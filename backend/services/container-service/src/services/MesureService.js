const { Mesure, Conteneur, Capteur } = require('../models');
const EventService = require('./EventService');

class MesureService {
  static async createMesure(mesureData) {
    const conteneur = await Conteneur.findByPk(mesureData.id_conteneur);
    if (!conteneur) throw new Error('Container not found');

    const mesure = await Mesure.create(mesureData);

    // Update capteur's last measurement timestamp + battery if provided
    if (mesureData.id_capteur) {
      const patch = { derniere_mesure_at: mesure.date_mesure };
      if (mesureData.batterie !== undefined) patch.batterie = mesureData.batterie;
      await Capteur.update(patch, { where: { id: mesureData.id_capteur } });
    }

    // Publish event for other services (signal-service, tour-service)
    await EventService.publishEvent('measurement.created', {
      id:               mesure.id,
      id_conteneur:     mesure.id_conteneur,
      id_capteur:       mesure.id_capteur || null,
      id_zone:          conteneur.id_zone,
      taux_remplissage: mesure.taux_remplissage,
      temperature:      mesure.temperature,
      batterie:         mesure.batterie,
      signal_force:     mesure.signal_force,
      timestamp:        mesure.date_mesure,
    });

    return mesure;
  }

  static async getAllMesures(filters = {}) {
    const where = {};
    if (filters.id_conteneur) where.id_conteneur = filters.id_conteneur;

    return Mesure.findAll({
      where,
      include: ['conteneur'],
      order: [['date_mesure', 'DESC']],
    });
  }

  static async getMesuresByConteneur(conteneurId, { limit = 50, page = 1 } = {}) {
    const parsedLimit = Math.min(parseInt(limit, 10) || 50, 500);
    const parsedPage  = Math.max(parseInt(page,  10) || 1,  1);
    const offset = (parsedPage - 1) * parsedLimit;

    const { count, rows } = await Mesure.findAndCountAll({
      where: { id_conteneur: conteneurId },
      order: [['date_mesure', 'DESC']],
      limit: parsedLimit,
      offset,
    });

    return {
      data: rows,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total: count,
        totalPages: Math.ceil(count / parsedLimit),
      },
    };
  }

  static async getLatestMesure(conteneurId) {
    return Mesure.findOne({
      where: { id_conteneur: conteneurId },
      order: [['date_mesure', 'DESC']],
    });
  }

  static async getMesuresByDateRange(conteneurId, startDate, endDate, { limit = 200, page = 1 } = {}) {
    const parsedLimit = Math.min(parseInt(limit, 10) || 200, 500);
    const parsedPage  = Math.max(parseInt(page,  10) || 1,  1);
    const offset = (parsedPage - 1) * parsedLimit;

    const { count, rows } = await Mesure.findAndCountAll({
      where: {
        id_conteneur: conteneurId,
        date_mesure: { [require('sequelize').Op.between]: [startDate, endDate] },
      },
      order: [['date_mesure', 'ASC']],
      limit: parsedLimit,
      offset,
    });

    return {
      data: rows,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total: count,
        totalPages: Math.ceil(count / parsedLimit),
      },
    };
  }

  static async getAverageFillRate(conteneurId, days = 30) {
    const sql = `
      SELECT
        AVG(taux_remplissage) as average_fill_rate,
        MAX(taux_remplissage) as max_fill_rate,
        MIN(taux_remplissage) as min_fill_rate,
        COUNT(*) as measurement_count
      FROM mesures
      WHERE id_conteneur = $1
      AND date_mesure >= NOW() - INTERVAL '${days} days'
    `;
    const result = await Mesure.sequelize.query(sql, {
      replacements: [conteneurId],
      type: Mesure.sequelize.QueryTypes.SELECT,
    });
    return result[0] || null;
  }
}

module.exports = MesureService;
