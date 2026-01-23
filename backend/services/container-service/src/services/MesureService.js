const { Mesure, Conteneur } = require('../models');

class MesureService {
  // Record a new measurement
  static async createMesure(mesureData) {
    try {
      // Verify container exists
      const conteneur = await Conteneur.findByPk(mesureData.id_conteneur);
      if (!conteneur) {
        throw new Error('Container not found');
      }

      const mesure = await Mesure.create(mesureData);
      return mesure;
    } catch (error) {
      throw error;
    }
  }

  // Get all measurements
  static async getAllMesures(filters = {}) {
    try {
      const where = {};
      if (filters.id_conteneur) where.id_conteneur = filters.id_conteneur;

      const mesures = await Mesure.findAll({
        where,
        include: ['conteneur'],
        order: [['date_mesure', 'DESC']],
      });
      return mesures;
    } catch (error) {
      throw error;
    }
  }

  // Get measurements for a container
  static async getMesuresByConteneur(conteneurId, limit = 50) {
    try {
      const mesures = await Mesure.findAll({
        where: { id_conteneur: conteneurId },
        order: [['date_mesure', 'DESC']],
        limit,
      });
      return mesures;
    } catch (error) {
      throw error;
    }
  }

  // Get latest measurement for a container
  static async getLatestMesure(conteneurId) {
    try {
      const mesure = await Mesure.findOne({
        where: { id_conteneur: conteneurId },
        order: [['date_mesure', 'DESC']],
      });
      return mesure;
    } catch (error) {
      throw error;
    }
  }

  // Get measurements for a date range
  static async getMesuresByDateRange(conteneurId, startDate, endDate) {
    try {
      const mesures = await Mesure.findAll({
        where: {
          id_conteneur: conteneurId,
          date_mesure: {
            [require('sequelize').Op.between]: [startDate, endDate],
          },
        },
        order: [['date_mesure', 'ASC']],
      });
      return mesures;
    } catch (error) {
      throw error;
    }
  }

  // Get average fill rate for a container over a period
  static async getAverageFillRate(conteneurId, days = 30) {
    try {
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
    } catch (error) {
      throw error;
    }
  }
}

module.exports = MesureService;
