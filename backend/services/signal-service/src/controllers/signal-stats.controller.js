const SignalStatsService = require('../services/SignalStatsService');

class SignalStatsController {
  static async getDashboardStats(req, res) {
    try {
      const stats = await SignalStatsService.getDashboardStats();
      return res.status(200).json({
        success: true,
        message: 'Signal dashboard statistics retrieved',
        data: stats
      });
    } catch (error) {
      console.error('Error getting signal stats:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  static async getTotalSignals(req, res) {
    try {
      const total = await SignalStatsService.getTotalSignals();
      return res.status(200).json({
        success: true,
        data: { total }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  static async getOpenSignals(req, res) {
    try {
      const count = await SignalStatsService.getOpenSignals();
      return res.status(200).json({
        success: true,
        data: { count }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  static async getSignalStatusBreakdown(req, res) {
    try {
      const breakdown = await SignalStatsService.getSignalStatusBreakdown();
      return res.status(200).json({
        success: true,
        data: breakdown
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  static async getSignalByPriority(req, res) {
    try {
      const breakdown = await SignalStatsService.getSignalByPriority();
      return res.status(200).json({
        success: true,
        data: breakdown
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = SignalStatsController;
