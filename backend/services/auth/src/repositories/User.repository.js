/**
 * User Repository
 * Encapsule TOUS les appels Sequelize pour la table User
 * Permet à la couche Service d'être DB-agnostic
 * 
 * Throw AppError subclasses au lieu de exceptions
 */

const { User } = require('../models');
const { NotFoundError, ValidationError, ConflictError } = require('../errors/AppError');
const { Op } = require('sequelize');

class UserRepository {
  /**
   * Trouver tous les utilisateurs (avec filtres optionnels)
   * @param {object} filters - Filtres optionnels { role, status, search }
   * @param {number} limit - Pagination limit
   * @param {number} offset - Pagination offset
   * @returns {object} { count, rows, limit, offset }
   */
  static async findAll(filters = {}, limit = 10, offset = 0) {
    try {
      const where = {};

      // Filtrer par rôle si fourni
      if (filters.role) {
        where.role = filters.role;
      }

      // Filtrer par statut actif si fourni
      if (filters.isActive !== undefined) {
        where.is_active = filters.isActive;
      }

      // Recherche par email ou nom
      if (filters.search) {
        where[Op.or] = [
          { email: { [Op.iLike]: `%${filters.search}%` } },
          { nom: { [Op.iLike]: `%${filters.search}%` } },
          { prenom: { [Op.iLike]: `%${filters.search}%` } }
        ];
      }

      const { count, rows } = await User.findAndCountAll({
        where,
        limit,
        offset,
        order: [['created_at', 'DESC']],
        attributes: { exclude: ['password'] } // Never return passwords
      });

      return { count, rows, limit, offset };
    } catch (error) {
      throw new Error(`Failed to find users: ${error.message}`);
    }
  }

  /**
   * Trouver un utilisateur par ID
   * @param {string} userId - User ID (UUID)
   * @returns {object} User data (without password)
   * @throws NotFoundError si user n'existe pas
   */
  static async findById(userId) {
    try {
      const user = await User.findByPk(userId, {
        attributes: { exclude: ['password'] }
      });

      if (!user) {
        throw new NotFoundError(`User with ID ${userId} not found`);
      }

      return user;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new Error(`Failed to find user by ID: ${error.message}`);
    }
  }

  /**
   * Trouver un utilisateur par email
   * @param {string} email - User email
   * @returns {object} User data (WITH password for auth)
   * @throws NotFoundError si user n'existe pas
   */
  static async findByEmail(email) {
    try {
      const user = await User.findOne({
        where: { email: email.toLowerCase() }
      });

      if (!user) {
        throw new NotFoundError(`User with email ${email} not found`);
      }

      return user; // Include password for auth verification
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new Error(`Failed to find user by email: ${error.message}`);
    }
  }

  /**
   * Créer un nouvel utilisateur
   * @param {object} userData - { email, password, nom, prenom, role }
   * @returns {object} Newly created user (without password)
   * @throws ValidationError si données invalides
   * @throws ConflictError si email existe déjà
   */
  static async create(userData) {
    try {
      // Vérifier que l'email n'existe pas déjà
      const existingUser = await User.findOne({
        where: { email: userData.email.toLowerCase() }
      });

      if (existingUser) {
        throw new ConflictError(`Email ${userData.email} already exists`);
      }

      // Créer l'utilisateur
      const user = await User.create({
        ...userData,
        email: userData.email.toLowerCase()
      });

      // Retourner sans password
      return this.findById(user.id);
    } catch (error) {
      if (error instanceof (ConflictError || ValidationError)) throw error;
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new ConflictError('Email already exists');
      }
      if (error.name === 'SequelizeValidationError') {
        const details = error.errors.map(e => ({
          field: e.path,
          message: e.message
        }));
        throw new ValidationError('Validation failed', details);
      }
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  /**
   * Mettre à jour un utilisateur
   * @param {string} userId - User ID
   * @param {object} updateData - Données à mettre à jour
   * @returns {object} Updated user (without password)
   * @throws NotFoundError si user n'existe pas
   */
  static async update(userId, updateData) {
    try {
      const user = await User.findByPk(userId);

      if (!user) {
        throw new NotFoundError(`User with ID ${userId} not found`);
      }

      // Ne pas mettre à jour le password ici (utiliser changePassword() à la place)
      if (updateData.password) {
        delete updateData.password;
      }

      await user.update(updateData);

      // Retourner sans password
      return this.findById(userId);
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  /**
   * Supprimer un utilisateur
   * @param {string} userId - User ID
   * @returns {boolean} true si suppression réussie
   * @throws NotFoundError si user n'existe pas
   */
  static async delete(userId) {
    try {
      const user = await User.findByPk(userId);

      if (!user) {
        throw new NotFoundError(`User with ID ${userId} not found`);
      }

      await user.destroy();
      return true;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  /**
   * Trouver utilisateurs par rôle
   * @param {string} role - Role name (agent, citoyen, admin)
   * @returns {array} Array of users with that role
   */
  static async findByRole(role) {
    try {
      const users = await User.findAll({
        where: { role },
        attributes: { exclude: ['password'] },
        order: [['created_at', 'DESC']]
      });

      return users;
    } catch (error) {
      throw new Error(`Failed to find users by role: ${error.message}`);
    }
  }

  /**
   * Compter utilisateurs avec filtres optionnels
   * @param {object} filters - Optional filters
   * @returns {number} Count of users
   */
  static async count(filters = {}) {
    try {
      const where = {};

      if (filters.role) {
        where.role = filters.role;
      }

      if (filters.isActive !== undefined) {
        where.is_active = filters.isActive;
      }

      return await User.count({ where });
    } catch (error) {
      throw new Error(`Failed to count users: ${error.message}`);
    }
  }

  /**
   * Vérifier si email existe
   * @param {string} email - Email to check
   * @returns {boolean}
   */
  static async emailExists(email) {
    try {
      const user = await User.findOne({
        where: { email: email.toLowerCase() }
      });

      return !!user;
    } catch (error) {
      throw new Error(`Failed to check email: ${error.message}`);
    }
  }
}

module.exports = UserRepository;
