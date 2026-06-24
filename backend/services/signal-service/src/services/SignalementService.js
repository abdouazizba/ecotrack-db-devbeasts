const { Signalement, sequelize } = require('../models');
const { Op } = require('sequelize');
const axios = require('axios');
const EventService = require('./EventService');

const CONTAINER_SERVICE_URL = process.env.CONTAINER_SERVICE_URL || 'http://container-service:3002';

// Business metrics
let promClient;
try { promClient = require('prom-client'); } catch { promClient = null; }
const signalementsCreated = promClient
  ? new promClient.Counter({
      name: 'ecotrack_signalements_created_total',
      help: 'Total signalements created',
      labelNames: ['type', 'priorite'],
    })
  : null;

async function fetchZoneForContainer(idConteneur) {
  try {
    const { data } = await axios.get(
      `${CONTAINER_SERVICE_URL}/internal/containers/${idConteneur}`,
      { timeout: 3000 }
    );
    return data?.id_zone || null;
  } catch {
    return null;
  }
}

class SignalementService {
  async createSignalement(signalementData) {
    if (signalementData.id_conteneur && !signalementData.id_zone) {
      signalementData.id_zone = await fetchZoneForContainer(signalementData.id_conteneur);
    }
    const signalement = await Signalement.create(signalementData);
    signalementsCreated?.inc({ type: signalement.type, priorite: signalement.priorite });

    await EventService.publishEvent('signalement.created', {
      id: signalement.id,
      type: signalement.type,
      priorite: signalement.priorite,
      statut: signalement.statut,
      id_conteneur: signalement.id_conteneur,
      id_utilisateur: signalement.id_utilisateur,
      latitude: signalement.latitude,
      longitude: signalement.longitude,
      created_at: signalement.created_at,
    });

    return signalement;
  }

  async getSignalements(filters = {}) {
    const where = {};
    if (filters.type) where.type = filters.type;
    if (filters.statut) where.statut = filters.statut;
    if (filters.priorite) where.priorite = filters.priorite;
    if (filters.idConteneur) where.id_conteneur = filters.idConteneur;
    if (filters.idUtilisateur) where.id_utilisateur = filters.idUtilisateur;

    return await Signalement.findAll({
      where,
      order: [['created_at', 'DESC']],
    });
  }

  async getSignalementById(id) {
    return await Signalement.findByPk(id);
  }

  async updateSignalement(id, signalementData) {
    const signalement = await Signalement.findByPk(id);
    if (!signalement) return null;

    return await signalement.update(signalementData);
  }

  async deleteSignalement(id) {
    const signalement = await Signalement.findByPk(id);
    if (!signalement) return null;

    await signalement.destroy();
    return true;
  }

  async getSignalementsByCitoyen(idUtilisateur, filters = {}) {
    const where = { id_utilisateur: idUtilisateur };
    if (filters.statut) where.statut = filters.statut;

    return await Signalement.findAll({
      where,
      order: [['created_at', 'DESC']],
    });
  }

  async getSignalementsByContainer(idConteneur) {
    return await Signalement.findAll({
      where: { id_conteneur: idConteneur },
      order: [['created_at', 'DESC']],
    });
  }

  async closeSignalement(id, notes = '', photoUrl) {
    const signalement = await Signalement.findByPk(id);
    if (!signalement) return null;
    if (signalement.statut === 'FERMÉ' || signalement.statut === 'REJETÉ') {
      throw new Error(`Cannot close: signalement is already ${signalement.statut}`);
    }

    const updated = await signalement.update({
      statut: 'FERMÉ',
      date_resolution: new Date(),
      notes_resolution: notes,
      photo_url: photoUrl,
    });

    EventService.publishEvent('signalement.closed', {
      id: updated.id,
      type: updated.type,
      id_conteneur: updated.id_conteneur,
      id_tournee: updated.id_tournee,
      id_zone: updated.id_zone,
    }).catch((err) => console.error('⚠️ Failed to publish signalement.closed:', err.message));

    return updated;
  }

  async getOpenSignalements() {
    return await Signalement.findAll({
      where: { statut: { [Op.in]: ['OUVERT', 'EN_COURS_DE_TRAITEMENT'] } },
      order: [['priorite', 'DESC'], ['created_at', 'DESC']],
    });
  }

  async getSignalementStatistics(startDate, endDate) {
    const where = {
      created_at: {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      },
    };

    const total = await Signalement.count({ where });
    const byType = await Signalement.findAll({
      attributes: ['type', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      where,
      group: ['type'],
      raw: true,
    });

    const byStatus = await Signalement.findAll({
      attributes: ['statut', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      where,
      group: ['statut'],
      raw: true,
    });

    return {
      totalSignalements: total,
      byType,
      byStatus,
    };
  }

  async getSignalementsByTournee(idTournee) {
    return await Signalement.findAll({
      where: { id_tournee: idTournee },
      order: [['priorite', 'DESC'], ['created_at', 'DESC']],
    });
  }

  async assignToTournee(id, idTournee) {
    const signalement = await Signalement.findByPk(id);
    if (!signalement) return null;

    return await signalement.update({ id_tournee: idTournee });
  }

  async markInProgress(id) {
    const signalement = await Signalement.findByPk(id);
    if (!signalement) return null;
    if (signalement.statut !== 'OUVERT') {
      throw new Error(`Cannot mark in progress: signalement is ${signalement.statut}, expected OUVERT`);
    }

    return await signalement.update({ statut: 'EN_COURS_DE_TRAITEMENT' });
  }

  async autoAssignToTournees(tournees) {
    // Find all unassigned OUVERT signalements with coordinates
    const unassigned = await Signalement.findAll({
      where: {
        statut: 'OUVERT',
        id_tournee: null,
        latitude: { [Op.ne]: null },
        longitude: { [Op.ne]: null },
      },
    });

    if (unassigned.length === 0) {
      return { assigned: 0, details: [] };
    }

    // Haversine distance in km
    const haversine = (lat1, lon1, lat2, lon2) => {
      const toRad = (v) => (v * Math.PI) / 180;
      const R = 6371;
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    const details = [];

    for (const sig of unassigned) {
      let nearestId = null;
      let nearestDist = Infinity;

      for (const t of tournees) {
        if (t.latitude == null || t.longitude == null) continue;
        const dist = haversine(sig.latitude, sig.longitude, t.latitude, t.longitude);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestId = t.id;
        }
      }

      if (nearestId) {
        await sig.update({ id_tournee: nearestId });
        details.push({
          signalementId: sig.id,
          tourneeId: nearestId,
          distance: Math.round(nearestDist * 1000) / 1000, // 3 decimal places (meters precision)
        });
      }
    }

    return { assigned: details.length, details };
  }

  async rejectSignalement(id, notes = '') {
    const signalement = await Signalement.findByPk(id);
    if (!signalement) return null;
    if (signalement.statut === 'FERMÉ' || signalement.statut === 'REJETÉ') {
      throw new Error(`Cannot reject: signalement is already ${signalement.statut}`);
    }

    const updated = await signalement.update({
      statut: 'REJETÉ',
      date_resolution: new Date(),
      notes_resolution: notes,
    });

    EventService.publishEvent('signalement.rejected', {
      id: updated.id,
      type: updated.type,
      id_conteneur: updated.id_conteneur,
      id_tournee: updated.id_tournee,
      id_zone: updated.id_zone,
    }).catch((err) => console.error('⚠️ Failed to publish signalement.rejected:', err.message));

    return updated;
  }
}

module.exports = new SignalementService();
