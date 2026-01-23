const { Zone } = require('../models');

class ZoneService {
  // Create a new zone
  static async createZone(zoneData) {
    try {
      const zone = await Zone.create(zoneData);
      return zone;
    } catch (error) {
      throw error;
    }
  }

  // Get all zones
  static async getAllZones(filters = {}) {
    try {
      const where = {};
      if (filters.is_active !== undefined) {
        where.is_active = filters.is_active;
      }

      const zones = await Zone.findAll({
        where,
        order: [['nom', 'ASC']],
      });
      return zones;
    } catch (error) {
      throw error;
    }
  }

  // Get zone by ID
  static async getZoneById(zoneId) {
    try {
      const zone = await Zone.findByPk(zoneId, {
        include: ['conteneurs'],
      });
      return zone;
    } catch (error) {
      throw error;
    }
  }

  // Get zone by code
  static async getZoneByCode(code) {
    try {
      const zone = await Zone.findOne({
        where: { code_zone: code },
      });
      return zone;
    } catch (error) {
      throw error;
    }
  }

  // Update zone
  static async updateZone(zoneId, updateData) {
    try {
      const zone = await Zone.findByPk(zoneId);
      if (!zone) {
        throw new Error('Zone not found');
      }
      await zone.update(updateData);
      return zone;
    } catch (error) {
      throw error;
    }
  }

  // Delete zone
  static async deleteZone(zoneId) {
    try {
      const zone = await Zone.findByPk(zoneId);
      if (!zone) {
        throw new Error('Zone not found');
      }
      await zone.destroy();
      return { message: 'Zone deleted successfully' };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ZoneService;
