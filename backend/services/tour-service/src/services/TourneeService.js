const { Tournee, TourneeAgent } = require('../models');
const { Op } = require('sequelize');

let promClient;
try { promClient = require('prom-client'); } catch { promClient = null; }
const tourneesActive = promClient
  ? new promClient.Gauge({ name: 'ecotrack_tournees_active', help: 'Number of EN_COURS tournées' })
  : null;

async function refreshTourneesGauge() {
  if (!tourneesActive) return;
  try {
    const count = await Tournee.count({ where: { statut: 'EN_COURS' } });
    tourneesActive.set(count);
  } catch { /* ignore */ }
}

class TourneeService {
  async createTournee(tourneeData) {
    if (!tourneeData.code) {
      const count = await Tournee.count();
      const year  = new Date().getFullYear();
      tourneeData.code = `TRN-${year}-${String(count + 1).padStart(3, '0')}`;
    }
    const t = await Tournee.create(tourneeData);
    refreshTourneesGauge();
    return t;
  }

  async getTournees(filters = {}) {
    const where = {};
    if (filters.statut) where.statut = filters.statut;
    if (filters.date) where.date = { [Op.gte]: new Date(filters.date) };

    return await Tournee.findAll({
      where,
      include: [
        {
          model: TourneeAgent,
          as: 'agents',
          attributes: ['id', 'id_agent', 'role', 'heure_debut_reel', 'heure_fin_reelle'],
        },
      ],
      order: [['date', 'DESC']],
    });
  }

  async getTourneeById(id) {
    return await Tournee.findByPk(id, {
      include: [
        {
          model: TourneeAgent,
          as: 'agents',
          attributes: ['id', 'id_agent', 'role', 'heure_debut_reel', 'heure_fin_reelle'],
        },
      ],
    });
  }

  async updateTournee(id, tourneeData) {
    const tournee = await Tournee.findByPk(id);
    if (!tournee) return null;

    const updated = await tournee.update(tourneeData);
    if (tourneeData.statut) refreshTourneesGauge();
    return updated;
  }

  async deleteTournee(id) {
    const tournee = await Tournee.findByPk(id);
    if (!tournee) return null;

    await tournee.destroy();
    return true;
  }

  async getTourneesByAgent(idAgent, filters = {}) {
    const where = {};
    if (filters.statut) where.statut = filters.statut;

    const ids = await Tournee.findAll({
      where,
      attributes: ['id'],
      include: [{
        model: TourneeAgent,
        as: 'agents',
        where: { id_agent: idAgent },
        required: true,
        attributes: [],
      }],
    });

    if (ids.length === 0) return [];

    return await Tournee.findAll({
      where: { ...where, id: ids.map((t) => t.id) },
      include: [{
        model: TourneeAgent,
        as: 'agents',
        attributes: ['id', 'id_agent', 'role', 'heure_debut_reel', 'heure_fin_reelle'],
      }],
      order: [['date', 'DESC']],
    });
  }

  async addAgentToTournee(idTournee, idAgent, role = 'COLLECTEUR') {
    const tournee = await Tournee.findByPk(idTournee);
    if (!tournee) throw new Error('Tournée introuvable');

    return await TourneeAgent.create({
      id_tournee: idTournee,
      id_agent: idAgent,
      role,
    });
  }

  async removeAgentFromTournee(idTournee, idAgent) {
    return await TourneeAgent.destroy({
      where: {
        id_tournee: idTournee,
        id_agent: idAgent,
      },
    });
  }

  async getTounrneesForDateRange(startDate, endDate) {
    return await Tournee.findAll({
      where: {
        date: {
          [Op.between]: [new Date(startDate), new Date(endDate)],
        },
      },
      order: [['date', 'ASC']],
    });
  }

  async getTourneeStats(idTournee) {
    const tournee = await Tournee.findByPk(idTournee, {
      include: [
        {
          model: TourneeAgent,
          as: 'agents',
          attributes: ['id_agent', 'role'],
        },
      ],
    });

    if (!tournee) return null;

    return {
      tourneeId: tournee.id,
      code: tournee.code,
      date: tournee.date,
      statut: tournee.statut,
      agentCount: tournee.agents.length,
      conducteurs: tournee.agents.filter(a => a.role === 'CONDUCTEUR').length,
      collecteurs: tournee.agents.filter(a => a.role === 'COLLECTEUR').length,
      distanceKm: tournee.distance_km,
      conteneurs: tournee.conteneurs_collectes,
      duree: tournee.heure_fin && tournee.heure_debut
        ? `${(new Date(tournee.heure_fin) - new Date(tournee.heure_debut)) / 3600000} heures`
        : null,
    };
  }
}

module.exports = new TourneeService();
