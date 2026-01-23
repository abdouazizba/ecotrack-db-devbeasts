const { validationResult } = require('express-validator');
const { ZoneService } = require('../services');

class ZoneController {
  static async createZone(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const zone = await ZoneService.createZone(req.body);
      return res.status(201).json({
        message: 'Zone created successfully',
        zone,
      });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async getAllZones(req, res) {
    try {
      const { is_active } = req.query;
      const filters = {};
      if (is_active !== undefined) {
        filters.is_active = is_active === 'true';
      }

      const zones = await ZoneService.getAllZones(filters);
      return res.status(200).json({
        message: 'Zones retrieved',
        zones,
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getZoneById(req, res) {
    try {
      const zone = await ZoneService.getZoneById(req.params.zoneId);
      if (!zone) {
        return res.status(404).json({ error: 'Zone not found' });
      }

      return res.status(200).json({
        message: 'Zone retrieved',
        zone,
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async updateZone(req, res) {
    try {
      const zone = await ZoneService.updateZone(req.params.zoneId, req.body);
      return res.status(200).json({
        message: 'Zone updated',
        zone,
      });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async deleteZone(req, res) {
    try {
      const result = await ZoneService.deleteZone(req.params.zoneId);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }
}

module.exports = ZoneController;
