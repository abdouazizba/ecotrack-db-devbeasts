const TourStatsService = require('../services/TourStatsService');

class TourStatsController {
  static async getDashboardStats(req, res) {
    try {
      const stats = await TourStatsService.getDashboardStats();
      return res.status(200).json({
        success: true,
        message: 'Tour dashboard statistics retrieved',
        data: stats
      });
    } catch (error) {
      console.error('Error getting tour stats:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  static async getTotalTours(req, res) {
    try {
      const total = await TourStatsService.getTotalTours();
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

  static async getToursInProgress(req, res) {
    try {
      const count = await TourStatsService.getToursInProgress();
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

  static async getCompletedTours(req, res) {
    try {
      const count = await TourStatsService.getCompletedTours();
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

  static async getTourStatusBreakdown(req, res) {
    try {
      const breakdown = await TourStatsService.getTourStatusBreakdown();
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

module.exports = TourStatsController;
