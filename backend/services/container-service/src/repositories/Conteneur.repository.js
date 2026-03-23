/**
 * Conteneur Repository
 * Encapsule TOUT l'accès à la base de données pour les conteneurs
 * Si on change PostgreSQL → MongoDB, on modifie juste ce fichier
 */

const { Conteneur, Mesure, Zone } = require('../models');
const { NotFoundError, ValidationError } = require('../errors/AppError');

class ConteneurRepository {
  /**
   * Récupérer tous les conteneurs avec filtres optionnels
   * @param {object} filters - { zone_id, status, waste_type, limit, offset }
   * @returns {object} { total, conteneurs, limit, offset }
   */
  static async findAll(filters = {}) {
    try {
      const {
        zone_id = null,
        status = null,
        waste_type = null,
        limit = 10,
        offset = 0
      } = filters;

      // Construire les conditions WHERE
      const where = {};
      if (zone_id) where.zone_id = zone_id;
      if (status) where.status = status;
      if (waste_type) where.waste_type = waste_type;

      const { count, rows } = await Conteneur.findAndCountAll({
        where,
        include: [
          {
            model: Zone,
            attributes: ['id', 'name', 'latitude', 'longitude'],
            required: false
          }
        ],
        limit,
        offset,
        order: [['created_at', 'DESC']]
      });

      return {
        total: count,
        conteneurs: rows,
        limit,
        offset
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Récupérer un conteneur par ID
   * @param {string} id - Conteneur ID
   * @returns {object} Conteneur object
   * @throws NotFoundError si n'existe pas
   */
  static async findById(id) {
    try {
      const conteneur = await Conteneur.findByPk(id, {
        include: [
          {
            model: Zone,
            attributes: ['id', 'name', 'latitude', 'longitude']
          },
          {
            model: Mesure,
            limit: 5,
            order: [['created_at', 'DESC']]
          }
        ]
      });

      if (!conteneur) {
        throw new NotFoundError(`Conteneur ${id} not found`);
      }

      return conteneur;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Créer un nouveau conteneur
   * @param {object} data - { code, latitude, longitude, zone_id, waste_type, capacity_liters }
   * @returns {object} Conteneur créé
   * @throws ValidationError si données invalides
   */
  static async create(data) {
    try {
      const {
        code,
        latitude,
        longitude,
        zone_id,
        waste_type,
        capacity_liters
      } = data;

      // Validations simples (Joi le fera aussi mais on double-check)
      if (!code || !latitude || !longitude) {
        throw new ValidationError('Missing required fields');
      }

      // Vérifier que la zone existe
      if (zone_id) {
        const zone = await Zone.findByPk(zone_id);
        if (!zone) {
          throw new NotFoundError(`Zone ${zone_id} not found`);
        }
      }

      const conteneur = await Conteneur.create({
        code,
        latitude,
        longitude,
        zone_id,
        waste_type: waste_type || 'general',
        capacity_liters: capacity_liters || 100,
        current_fill_level: 0,
        status: 'active'
      });

      return conteneur;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Mettre à jour un conteneur
   * @param {string} id - Conteneur ID
   * @param {object} data - Données à mettre à jour
   * @returns {object} Conteneur mis à jour
   * @throws NotFoundError si n'existe pas
   */
  static async update(id, data) {
    try {
      const conteneur = await Conteneur.findByPk(id);
      if (!conteneur) {
        throw new NotFoundError(`Conteneur ${id} not found`);
      }

      // Vérifier zone existe si changement
      if (data.zone_id && data.zone_id !== conteneur.zone_id) {
        const zone = await Zone.findByPk(data.zone_id);
        if (!zone) {
          throw new NotFoundError(`Zone ${data.zone_id} not found`);
        }
      }

      await conteneur.update(data);
      return conteneur;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Supprimer un conteneur
   * @param {string} id - Conteneur ID
   * @returns {boolean} true si supprimé
   * @throws NotFoundError si n'existe pas
   */
  static async delete(id) {
    try {
      const conteneur = await Conteneur.findByPk(id);
      if (!conteneur) {
        throw new NotFoundError(`Conteneur ${id} not found`);
      }

      await conteneur.destroy();
      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Récupérer conteneurs par zone
   * @param {string} zoneId - Zone ID
   * @returns {array} Liste des conteneurs
   */
  static async findByZoneId(zoneId) {
    try {
      return await Conteneur.findAll({
        where: { zone_id: zoneId },
        order: [['created_at', 'DESC']]
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Récupérer conteneurs prioritaires (fill_level > 85%)
   * @returns {array} Conteneurs à vider en priorité
   */
  static async findPriority() {
    try {
      return await Conteneur.findAll({
        where: {
          current_fill_level: { [require('sequelize').Op.gt]: 85 }
        },
        order: [['current_fill_level', 'DESC']]
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Mettre à jour le niveau de remplissage
   * @param {string} id - Conteneur ID
   * @param {number} fillLevel - Nouveau niveau (0-100)
   * @returns {object} Conteneur mis à jour
   */
  static async updateFillLevel(id, fillLevel) {
    try {
      if (fillLevel < 0 || fillLevel > 100) {
        throw new ValidationError('Fill level must be between 0 and 100');
      }

      const conteneur = await Conteneur.findByPk(id);
      if (!conteneur) {
        throw new NotFoundError(`Conteneur ${id} not found`);
      }

      await conteneur.update({ current_fill_level: fillLevel });
      return conteneur;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ConteneurRepository;
