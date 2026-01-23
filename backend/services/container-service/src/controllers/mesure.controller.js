const { validationResult } = require('express-validator');
const { MesureService } = require('../services');

class MesureController {
  static async createMesure(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const mesure = await MesureService.createMesure(req.body);
      return res.status(201).json({
        message: 'Measurement recorded',
        mesure,
      });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async getMesuresByConteneur(req, res) {
    try {
      const { limit = 50 } = req.query;
      const mesures = await MesureService.getMesuresByConteneur(req.params.conteneurId, limit);
      return res.status(200).json({
        message: 'Measurements retrieved',
        mesures,
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getLatestMesure(req, res) {
    try {
      const mesure = await MesureService.getLatestMesure(req.params.conteneurId);
      if (!mesure) {
        return res.status(404).json({ error: 'No measurements found' });
      }

      return res.status(200).json({
        message: 'Latest measurement',
        mesure,
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getMesuresByDateRange(req, res) {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate and endDate are required' });
      }

      const mesures = await MesureService.getMesuresByDateRange(
        req.params.conteneurId,
        startDate,
        endDate
      );
      return res.status(200).json({
        message: 'Measurements for date range',
        mesures,
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getAverageFillRate(req, res) {
    try {
      const { days = 30 } = req.query;
      const stats = await MesureService.getAverageFillRate(req.params.conteneurId, days);
      return res.status(200).json({
        message: 'Average fill rate statistics',
        stats,
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}

module.exports = MesureController;
