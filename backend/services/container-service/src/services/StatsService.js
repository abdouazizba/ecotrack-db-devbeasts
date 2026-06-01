const { Conteneur, Zone, Mesure, sequelize } = require('../models');
const { Op } = require('sequelize');

class StatsService {
  // Get total number of containers
  static async getTotalContainers() {
    return await Conteneur.count();
  }

  // Get total number of zones
  static async getTotalZones() {
    return await Zone.count();
  }

  // Get average fill rate
  static async getAverageFillRate() {
    const result = await Mesure.findOne({
      attributes: [
        [sequelize.fn('AVG', sequelize.col('taux_remplissage')), 'average_fill_rate']
      ],
      raw: true,
    });
    return result?.average_fill_rate ? Math.round(result.average_fill_rate * 100) / 100 : 0;
  }

  // Get critical containers (maintenance status or fill rate > 80%)
  static async getCriticalContainers() {
    const result = await Conteneur.findAll({
      where: {
        [Op.or]: [
          { statut: 'maintenance' },
        ]
      },
      attributes: ['id'],
      raw: true,
    });

    // Also check for containers with high fill rates
    const highFillContainers = await sequelize.query(`
      SELECT DISTINCT c.id 
      FROM conteneurs c
      LEFT JOIN mesures m ON c.id = m.id_conteneur
      WHERE m.taux_remplissage > 80
      AND m.date_mesure = (
        SELECT MAX(date_mesure) 
        FROM mesures 
        WHERE id_conteneur = c.id
      )
    `, { type: sequelize.QueryTypes.SELECT });

    // Combine and deduplicate
    const allCritical = [
      ...result.map(r => r.id),
      ...highFillContainers.map(r => r.id)
    ];
    
    return [...new Set(allCritical)].length;
  }

  // Get container status breakdown
  static async getContainerStatusBreakdown() {
    const result = await Conteneur.findAll({
      attributes: [
        'statut',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['statut'],
      raw: true,
    });
    
    return result.reduce((acc, row) => {
      acc[row.statut] = parseInt(row.count);
      return acc;
    }, {});
  }

  // Get container type breakdown
  static async getContainerTypeBreakdown() {
    const result = await Conteneur.findAll({
      attributes: [
        'type_conteneur',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['type_conteneur'],
      raw: true,
    });
    
    return result.reduce((acc, row) => {
      acc[row.type_conteneur] = parseInt(row.count);
      return acc;
    }, {});
  }

  // Get all dashboard statistics
  static async getDashboardStats() {
    const [
      totalContainers,
      totalZones,
      averageFillRate,
      criticalCount,
      statusBreakdown,
      typeBreakdown
    ] = await Promise.all([
      this.getTotalContainers(),
      this.getTotalZones(),
      this.getAverageFillRate(),
      this.getCriticalContainers(),
      this.getContainerStatusBreakdown(),
      this.getContainerTypeBreakdown()
    ]);

    return {
      containers: totalContainers,
      zones: totalZones,
      averageFillRate,
      criticalContainers: criticalCount,
      statusBreakdown,
      typeBreakdown
    };
  }
}

module.exports = StatsService;
