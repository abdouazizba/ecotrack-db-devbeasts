const { Tournee, TourneeAgent, sequelize } = require('../models');
const { Op } = require('sequelize');

class TourStatsService {
  // Get total number of tours
  static async getTotalTours() {
    return await Tournee.count();
  }

  // Get tour status breakdown
  static async getTourStatusBreakdown() {
    const result = await Tournee.findAll({
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

  // Get tours in progress
  static async getToursInProgress() {
    return await Tournee.count({
      where: { statut: 'EN_COURS' }
    });
  }

  // Get completed tours
  static async getCompletedTours() {
    return await Tournee.count({
      where: { statut: 'TERMINÉE' }
    });
  }

  // Get dashboard stats for tours
  static async getDashboardStats() {
    const [
      totalTours,
      toursInProgress,
      completedTours,
      statusBreakdown
    ] = await Promise.all([
      this.getTotalTours(),
      this.getToursInProgress(),
      this.getCompletedTours(),
      this.getTourStatusBreakdown()
    ]);

    return {
      totalTours,
      toursInProgress,
      completedTours,
      statusBreakdown
    };
  }
}

module.exports = TourStatsService;
