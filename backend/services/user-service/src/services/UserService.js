const axios = require('axios');
const { Utilisateur, Agent, Citoyen, Admin } = require('../models');

class UserService {
  /**
   * Get a user by ID
   */
  static async getUserById(userId) {
    try {
      const user = await Utilisateur.findByPk(userId);
      if (!user) {
        throw new Error(`User ${userId} not found`);
      }
      return user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all users (with pagination)
   */
  static async getAllUsers(limit = 10, offset = 0) {
    try {
      const { count, rows } = await Utilisateur.findAndCountAll({
        limit,
        offset,
        order: [['created_at', 'DESC']]
      });
      return { total: count, users: rows, limit, offset };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Assign or change user role (ADMIN ONLY)
   * Handles transitions between roles (e.g., citoyen → agent → admin)
   * By default, new users are created as 'citoyen'
   * Admin can change role via this endpoint
   * @param {string} userId - User ID
   * @param {string} role - Role: 'super_admin' | 'admin' | 'agent' | 'citoyen'
   * @param {object} roleData - Role-specific data (optional)
   */
  static async assignRole(userId, role, roleData = {}) {
    try {
      // Validate role
      if (!['super_admin', 'admin', 'agent', 'citoyen'].includes(role)) {
        throw new Error('Invalid role. Must be: super_admin, admin, agent, or citoyen');
      }

      // Check if user exists
      const user = await Utilisateur.findByPk(userId);
      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      const oldRole = user.role;

      // If role is being changed, delete the old role-specific profile first
      if (oldRole && oldRole !== role) {
        if (oldRole === 'agent') {
          await Agent.destroy({ where: { id: userId } });
          console.log(`✓ Removed Agent profile from user ${userId}`);
        } else if (oldRole === 'citoyen') {
          await Citoyen.destroy({ where: { id: userId } });
          console.log(`✓ Removed Citoyen profile from user ${userId}`);
        } else if (oldRole === 'admin') {
          await Admin.destroy({ where: { id: userId } });
          console.log(`✓ Removed Admin profile from user ${userId}`);
        }
      }

      // Update user role
      await user.update({ role });
      console.log(`✓ Changed role from '${oldRole}' to '${role}' for user ${userId}`);

      // Create new role-specific profile (TPT pattern)
      if (role === 'agent') {
        await Agent.create({
          id: userId,
          numero_badge: roleData.numero_badge || `AGENT-${userId.substring(0, 8)}`,
          id_zone: roleData.id_zone || null,
          date_assignment_zone: roleData.date_assignment_zone || new Date()
        });
        console.log(`✓ Created Agent profile for user ${userId}`);

      } else if (role === 'citoyen') {
        await Citoyen.create({
          id: userId,
          email_verified: roleData.email_verified || false,
          nombre_signalements: 0,
          score_reputation: roleData.score_reputation || 50,
          telephone: roleData.telephone || null
        });
        console.log(`✓ Created Citoyen profile for user ${userId}`);

      } else if (role === 'admin') {
        await Admin.create({
          id: userId,
          niveau_acces: roleData.niveau_acces || 'admin',
          permissions: roleData.permissions || {
            manage_users: true,
            manage_resources: true,
            manage_zones: false,
            view_statistics: true,
            manage_admins: false
          }
        });
        console.log(`✓ Created Admin profile for user ${userId}`);
      }

      console.log(`✅ Role assignment completed: ${role}`);
      return user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update user profile (nom, prenom, etc.)
   */
  static async updateUserProfile(userId, profileData) {
    try {
      const user = await Utilisateur.findByPk(userId);
      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      const updatedUser = await user.update({
        nom: profileData.nom || user.nom,
        prenom: profileData.prenom || user.prenom,
        date_naissance: profileData.date_naissance || user.date_naissance,
        is_active: profileData.is_active !== undefined ? profileData.is_active : user.is_active
      });

      return updatedUser;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete user (cascade deletes role-specific profiles)
   */
  static async deleteUser(userId) {
    try {
      const user = await Utilisateur.findByPk(userId);
      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      // Delete role-specific profile first
      if (user.role === 'agent') {
        await Agent.destroy({ where: { id: userId } });
      } else if (user.role === 'citoyen') {
        await Citoyen.destroy({ where: { id: userId } });
      } else if (user.role === 'admin') {
        await Admin.destroy({ where: { id: userId } });
      }

      // Delete user
      await user.destroy();
      console.log(`✓ Deleted user ${userId}`);

      return { message: `User ${userId} deleted successfully` };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Deactivate user account
   */
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
