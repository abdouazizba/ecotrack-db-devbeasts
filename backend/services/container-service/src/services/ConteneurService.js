const { Conteneur, Zone } = require('../models');
const EventService = require('./EventService');

class ConteneurService {
  static async createConteneur(conteneurData) {
    const zone = await Zone.findByPk(conteneurData.id_zone);
    if (!zone) throw new Error('Zone not found');

    const conteneur = await Conteneur.create(conteneurData);

    EventService.publishEvent('container.created', {
      id: conteneur.id,
      code_conteneur: conteneur.code_conteneur,
      type_conteneur: conteneur.type_conteneur,
      id_zone: conteneur.id_zone,
      statut: conteneur.statut,
      latitude: conteneur.latitude,
      longitude: conteneur.longitude,
    }).catch((err) => console.error('⚠️ Failed to publish container.created:', err.message));

    return conteneur;
  }

  static async getAllConteneurs(filters = {}) {
    const where = {};
    if (filters.statut) where.statut = filters.statut;
    if (filters.type_conteneur) where.type_conteneur = filters.type_conteneur;
    if (filters.id_zone) where.id_zone = filters.id_zone;

    const limit = Math.min(parseInt(filters.limit, 10) || 5000, 10000);
    const page  = Math.max(parseInt(filters.page,  10) || 1,   1);
    const offset = (page - 1) * limit;

    const { count, rows } = await Conteneur.findAndCountAll({
      where,
      include: ['zone'],
      order: [['code_conteneur', 'ASC']],
      limit,
      offset,
    });

    return {
      conteneurs: rows,
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
    };
  }

  static async getConteneurById(conteneurId) {
    return await Conteneur.findByPk(conteneurId, { include: ['zone'] });
  }

  static async getConteneursByZone(zoneId) {
    return await Conteneur.findAll({
      where: { id_zone: zoneId },
      include: ['zone'],
    });
  }

  static async updateConteneur(conteneurId, updateData) {
    const conteneur = await Conteneur.findByPk(conteneurId);
    if (!conteneur) throw new Error('Container not found');

    const oldStatut = conteneur.statut;
    const oldZone   = conteneur.id_zone;

    await conteneur.update(updateData);

    if (updateData.statut && updateData.statut !== oldStatut) {
      EventService.publishEvent('container.status_changed', {
        id: conteneur.id,
        code_conteneur: conteneur.code_conteneur,
        old_statut: oldStatut,
        new_statut: conteneur.statut,
        id_zone: conteneur.id_zone,
      }).catch((err) => console.error('⚠️ Failed to publish container.status_changed:', err.message));
    }

    if (updateData.id_zone && updateData.id_zone !== oldZone) {
      EventService.publishEvent('container.zone_changed', {
        id: conteneur.id,
        code_conteneur: conteneur.code_conteneur,
        old_zone: oldZone,
        new_zone: conteneur.id_zone,
      }).catch((err) => console.error('⚠️ Failed to publish container.zone_changed:', err.message));
    }

    return conteneur;
  }

  static async deleteConteneur(conteneurId) {
    const conteneur = await Conteneur.findByPk(conteneurId);
    if (!conteneur) throw new Error('Container not found');

    const payload = {
      id: conteneur.id,
      code_conteneur: conteneur.code_conteneur,
      id_zone: conteneur.id_zone,
    };

    await conteneur.destroy();

    EventService.publishEvent('container.deleted', payload)
      .catch((err) => console.error('⚠️ Failed to publish container.deleted:', err.message));

    return { message: 'Container deleted successfully' };
  }

  static async getNearby(lat, lng, radiusKm = 5) {
    const sql = `
      SELECT * FROM (
        SELECT c.*,
          (6371 * acos(
            cos(radians(:lat)) * cos(radians(c.latitude)) *
            cos(radians(c.longitude) - radians(:lng)) +
            sin(radians(:lat)) * sin(radians(c.latitude))
          )) AS distance_km
        FROM conteneurs c
        WHERE c.statut != 'retire'
      ) sub
      WHERE distance_km < :radius
      ORDER BY distance_km
      LIMIT 50
    `;
    return Conteneur.sequelize.query(sql, {
      replacements: { lat, lng, radius: radiusKm },
      type: Conteneur.sequelize.QueryTypes.SELECT,
    });
  }

  static async getConteneursneedingService(fillRateThreshold = 80) {
    try {
      const [tables] = await Conteneur.sequelize.query(
        "SELECT to_regclass('public.mesures') AS exists"
      );
      if (!tables[0]?.exists) return [];

      const sql = `
        SELECT DISTINCT c.*
        FROM conteneurs c
        JOIN mesures m ON c.id = m.id_conteneur
        WHERE m.taux_remplissage >= $1
        AND m.date_mesure = (
          SELECT MAX(date_mesure) FROM mesures WHERE id_conteneur = c.id
        )
        ORDER BY m.taux_remplissage DESC
      `;

      return await Conteneur.sequelize.query(sql, {
        bind: [fillRateThreshold],
        type: Conteneur.sequelize.QueryTypes.SELECT,
      });
    } catch (error) {
      console.error('getConteneursneedingService error:', error.message);
      return [];
    }
  }
}

module.exports = ConteneurService;
