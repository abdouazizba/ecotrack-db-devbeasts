const StatsService = require('../services/StatsService');

class StatsController {
  static async getDashboardStats(req, res) {
    try {
      const stats = await StatsService.getDashboardStats();
      return res.status(200).json({
        success: true,
        message: 'Dashboard statistics retrieved',
        data: stats
      });
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  static async getTotalContainers(req, res) {
    try {
      const total = await StatsService.getTotalContainers();
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

  static async getTotalZones(req, res) {
    try {
      const total = await StatsService.getTotalZones();
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

  static async getAverageFillRate(req, res) {
    try {
      const average = await StatsService.getAverageFillRate();
      return res.status(200).json({
        success: true,
        data: { average }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  static async getCriticalContainers(req, res) {
    try {
      const count = await StatsService.getCriticalContainers();
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

  static async getContainerStatusBreakdown(req, res) {
    try {
      const breakdown = await StatsService.getContainerStatusBreakdown();
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

  static async getContainerTypeBreakdown(req, res) {
    try {
      const breakdown = await StatsService.getContainerTypeBreakdown();
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

module.exports = StatsController;
