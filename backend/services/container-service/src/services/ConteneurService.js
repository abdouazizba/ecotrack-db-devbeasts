const { Conteneur, Zone } = require('../models');

class ConteneurService {
  // Create a new container
  static async createConteneur(conteneurData) {
    try {
      // Verify zone exists
      const zone = await Zone.findByPk(conteneurData.id_zone);
      if (!zone) {
        throw new Error('Zone not found');
      }

      const conteneur = await Conteneur.create(conteneurData);
      return conteneur;
    } catch (error) {
      throw error;
    }
  }

  // Get all containers with pagination
  static async getAllConteneurs(filters = {}) {
    try {
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
    } catch (error) {
      throw error;
    }
  }

  // Get container by ID
  static async getConteneurById(conteneurId) {
    try {
      const conteneur = await Conteneur.findByPk(conteneurId, {
        include: ['zone'],
      });
      return conteneur;
    } catch (error) {
      throw error;
    }
  }

  // Get containers by zone
  static async getConteneursByZone(zoneId) {
    try {
      const conteneurs = await Conteneur.findAll({
        where: { id_zone: zoneId },
        include: ['zone'],
      });
      return conteneurs;
    } catch (error) {
      throw error;
    }
  }

  // Update container
  static async updateConteneur(conteneurId, updateData) {
    try {
      const conteneur = await Conteneur.findByPk(conteneurId);
      if (!conteneur) {
        throw new Error('Container not found');
      }
      await conteneur.update(updateData);
      return conteneur;
    } catch (error) {
      throw error;
    }
  }

  // Delete container
  static async deleteConteneur(conteneurId) {
    try {
      const conteneur = await Conteneur.findByPk(conteneurId);
      if (!conteneur) {
        throw new Error('Container not found');
      }
      await conteneur.destroy();
      return { message: 'Container deleted successfully' };
    } catch (error) {
      throw error;
    }
  }

  // Get containers within radius km from a GPS point (Haversine formula)
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

  // Get containers needing service (high fill rate)
  static async getConteneursneedingService(fillRateThreshold = 80) {
    try {
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
      
      const conteneurs = await Conteneur.sequelize.query(sql, {
        bind: [fillRateThreshold],
        type: Conteneur.sequelize.QueryTypes.SELECT,
      });
      
      return conteneurs;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ConteneurService;
