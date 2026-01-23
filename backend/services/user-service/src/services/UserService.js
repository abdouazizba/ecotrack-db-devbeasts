const axios = require('axios');
const { Utilisateur, Agent, Citoyen, Admin } = require('../models');

class UserService {
  // Create a new user (called by user-service registration)
  static async createUser(userData, role) {
    try {
      // 1. Create base user profile in User Service
      const user = await Utilisateur.create({
        email: userData.email,
        nom: userData.nom,
        prenom: userData.prenom,
        date_naissance: userData.date_naissance,
        role,
      });

      // 2. Create role-specific profile
      if (role === 'agent') {
        await Agent.create({
          id: user.id,
          numero_badge: userData.numero_badge,
          id_zone: userData.id_zone,
        });
      } else if (role === 'citoyen') {
        await Citoyen.create({
          id: user.id,
          telephone: userData.telephone,
        });
      } else if (role === 'admin') {
        await Admin.create({
          id: user.id,
          niveau_acces: userData.niveau_acces || 'admin',
          permissions: userData.permissions,
        });
      }

      // 3. Call Auth Service to create credentials
      try {
        const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';
        await axios.post(`${authServiceUrl}/api/auth/register`, {
          email: userData.email,
          password: userData.password,
        });
      } catch (authError) {
        // If auth registration fails, rollback user creation
        await Utilisateur.destroy({ where: { id: user.id } });
        throw new Error(`Auth registration failed: ${authError.message}`);
      }

      return user;
    } catch (error) {
      throw new Error(`Error creating user: ${error.message}`);
    }
  }

  // Get user profile by ID
  static async getUserById(userId) {
    try {
      const user = await Utilisateur.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    } catch (error) {
      throw error;
    }
  }

  // Get all users (Admin only)
  static async getAllUsers() {
    try {
      const users = await Utilisateur.findAll();
      return users;
    } catch (error) {
      throw error;
    }
  }

  // Update user
  static async updateUser(userId, updateData) {
    try {
      const user = await Utilisateur.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      await user.update(updateData);
      return user;
    } catch (error) {
      throw error;
    }
  }

  // Deactivate user account
  static async deactivateUser(userId) {
    try {
      const user = await Utilisateur.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      await user.update({ is_active: false });
      return { message: 'User account deactivated' };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = UserService;
