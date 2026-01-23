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

  // Get all containers
  static async getAllConteneurs(filters = {}) {
    try {
      const where = {};
      if (filters.statut) where.statut = filters.statut;
      if (filters.type_conteneur) where.type_conteneur = filters.type_conteneur;
      if (filters.id_zone) where.id_zone = filters.id_zone;

      const conteneurs = await Conteneur.findAll({
        where,
        include: ['zone'],
        order: [['code_conteneur', 'ASC']],
      });
      return conteneurs;
    } catch (error) {
      throw error;
    }
  }

  // Get container by ID
  static async getConteneurById(conteneurId) {
    try {
      const conteneur = await Conteneur.findByPk(conteneurId, {
        include: ['zone', 'mesures'],
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
        replacements: [fillRateThreshold],
        type: Conteneur.sequelize.QueryTypes.SELECT,
      });
      
      return conteneurs;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ConteneurService;
