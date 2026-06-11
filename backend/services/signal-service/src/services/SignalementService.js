const { Signalement, sequelize } = require('../models');
const { Op } = require('sequelize');
const EventService = require('./EventService');

class SignalementService {
  async createSignalement(signalementData) {
    const signalement = await Signalement.create(signalementData);

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

  async closeSignalement(id, notes = '') {
    const signalement = await Signalement.findByPk(id);
    if (!signalement) return null;

    return await signalement.update({
      statut: 'FERMÉ',
      date_resolution: new Date(),
      notes_resolution: notes,
    });
  }

  async getOpenSignalements() {
    return await Signalement.findAll({
      where: { statut: 'OUVERT' },
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

  async markInProgress(id) {
    const signalement = await Signalement.findByPk(id);
    if (!signalement) return null;

    return await signalement.update({ statut: 'EN_COURS_DE_TRAITEMENT' });
  }

  async rejectSignalement(id, notes = '') {
    const signalement = await Signalement.findByPk(id);
    if (!signalement) return null;

    return await signalement.update({
      statut: 'REJETÉ',
      notes_resolution: notes,
    });
  }
}

module.exports = new SignalementService();
