const { Zone } = require('../models');
const EventService = require('./EventService');

class ZoneService {
  static async createZone(zoneData) {
    const zone = await Zone.create(zoneData);

    EventService.publishEvent('zone.created', {
      id: zone.id,
      nom: zone.nom,
      code_zone: zone.code_zone,
      latitude: zone.latitude,
      longitude: zone.longitude,
    }).catch((err) => console.error('⚠️ Failed to publish zone.created:', err.message));

    return zone;
  }

  static async getAllZones(filters = {}) {
    const where = {};
    if (filters.is_active !== undefined) {
      where.is_active = filters.is_active;
    }

    return await Zone.findAll({
      where,
      order: [['created_at', 'DESC']],
    });
  }

  static async getZoneById(zoneId) {
    return await Zone.findByPk(zoneId, { include: ['conteneurs'] });
  }

  static async getZoneByCode(code) {
    return await Zone.findOne({ where: { code_zone: code } });
  }

  static async updateZone(zoneId, updateData) {
    const zone = await Zone.findByPk(zoneId);
    if (!zone) throw new Error('Zone not found');

    const oldActive = zone.is_active;
    await zone.update(updateData);

    EventService.publishEvent('zone.updated', {
      id: zone.id,
      nom: zone.nom,
      code_zone: zone.code_zone,
      is_active: zone.is_active,
      was_deactivated: oldActive === true && zone.is_active === false,
    }).catch((err) => console.error('⚠️ Failed to publish zone.updated:', err.message));

    return zone;
  }

  static async deleteZone(zoneId) {
    const zone = await Zone.findByPk(zoneId);
    if (!zone) throw new Error('Zone not found');

    const payload = { id: zone.id, nom: zone.nom, code_zone: zone.code_zone };
    await zone.destroy();

    EventService.publishEvent('zone.deleted', payload)
      .catch((err) => console.error('⚠️ Failed to publish zone.deleted:', err.message));

    return { message: 'Zone deleted successfully' };
  }
}

module.exports = ZoneService;
