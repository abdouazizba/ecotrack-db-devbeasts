const { validationResult } = require('express-validator');
const { UserService } = require('../services');
const { Utilisateur } = require('../models');

class UserController {
  // Get the user profile
  static async getProfile(req, res) {
    try {
      const user = await UserService.getUserProfile(req.user.id);

      if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }

      return res.status(200).json({
        message: 'Profil récupéré',
        user,
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Update the user profile
  static async updateProfile(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = await UserService.updateUserProfile(req.user.id, req.body);

      return res.status(200).json({
        message: 'Profil mis à jour',
        user,
      });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  // Disable the account
  static async deactivateAccount(req, res) {
    try {
      const result = await UserService.deactivateAccount(req.user.id);
      res.clearCookie('refreshToken');

      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  // ==================== ADMIN FUNCTIONS ====================

  // Get all users (Admin)
  static async getAllUsers(req, res) {
    try {
      const { role, is_active, page = 1, limit = 10 } = req.query;

      const where = {};
      if (role) where.role = role;
      if (is_active !== undefined) where.is_active = is_active === 'true';

      const users = await Utilisateur.findAndCountAll({
        where,
        offset: (page - 1) * limit,
        limit: parseInt(limit),
        attributes: { exclude: ['password'] },
        order: [['created_at', 'DESC']],
      });

      return res.status(200).json({
        message: 'Utilisateurs récupérés',
        data: users.rows,
        pagination: {
          total: users.count,
          pages: Math.ceil(users.count / limit),
          currentPage: page,
        },
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Get details of a user (Admin)
  static async getUserDetails(req, res) {
    try {
      const user = await UserService.getUserProfile(req.params.userId);

      if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }

      return res.status(200).json({
        message: 'Détails de l\'utilisateur',
        user,
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Update a user (Admin)
  static async adminUpdateUser(req, res) {
    try {
      const { userId } = req.params;
      const user = await UserService.updateUserProfile(userId, req.body);

      return res.status(200).json({
        message: 'Utilisateur mis à jour',
        user,
      });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  // Disable a user (Admin)
  static async adminDeactivateUser(req, res) {
    try {
      const { userId } = req.params;
      const result = await UserService.deactivateAccount(userId);

      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }
}

module.exports = UserController;
