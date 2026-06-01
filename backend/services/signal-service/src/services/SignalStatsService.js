const models = require('../models');

class SignalStatsService {
  static async getTotalSignals() {
    const Signalement = models.Signalement;
    return await Signalement.count();
  }

  static async getOpenSignals() {
    const Signalement = models.Signalement;
    return await Signalement.count({
      where: { statut: 'OUVERT' }
    });
  }

  static async getInProgressSignals() {
    const Signalement = models.Signalement;
    return await Signalement.count({
      where: { statut: 'EN_COURS_DE_TRAITEMENT' }
    });
  }

  static async getClosedSignals() {
    const Signalement = models.Signalement;
    return await Signalement.count({
      where: { statut: 'FERMÉ' }
    });
  }

  static async getRejectedSignals() {
    const Signalement = models.Signalement;
    return await Signalement.count({
      where: { statut: 'REJETÉ' }
    });
  }

  static async getSignalStatusBreakdown() {
    const Signalement = models.Signalement;
    const sequelize = Signalement.sequelize;
    
    const result = await Signalement.findAll({
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

  static async getSignalByPriority() {
    const Signalement = models.Signalement;
    const sequelize = Signalement.sequelize;
    
    const result = await Signalement.findAll({
      attributes: [
        'priorite',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['priorite'],
      raw: true,
    });
    
    return result.reduce((acc, row) => {
      acc[row.priorite] = parseInt(row.count);
      return acc;
    }, {});
  }

  static async getDashboardStats() {
    const [
      totalSignals,
      openSignals,
      inProgressSignals,
      closedSignals,
      rejectedSignals,
      statusBreakdown,
      priorityBreakdown
    ] = await Promise.all([
      this.getTotalSignals(),
      this.getOpenSignals(),
      this.getInProgressSignals(),
      this.getClosedSignals(),
      this.getRejectedSignals(),
      this.getSignalStatusBreakdown(),
      this.getSignalByPriority()
    ]);

    return {
      totalSignals,
      openSignals,
      inProgressSignals,
      closedSignals,
      rejectedSignals,
      statusBreakdown,
      priorityBreakdown
    };
  }
}

module.exports = SignalStatsService;
