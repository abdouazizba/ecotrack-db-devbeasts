const { validationResult } = require('express-validator');
const UserService = require('../services/UserService');

class UserController {
  /**
   * GET /api/users/:id
   * Get user by ID
   */
  static async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await UserService.getUserById(id);
      return res.status(200).json(user);
    } catch (error) {
      return res.status(404).json({ error: error.message });
    }
  }

  /**
   * GET /api/users
   * Get all users (with pagination)
   */
  static async getAllUsers(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const offset = parseInt(req.query.offset) || 0;

      const result = await UserService.getAllUsers(limit, offset);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  /**
   * PUT /api/users/:id/role
   * Assign role to a user
   * Body: { role: 'agent' | 'citoyen' | 'admin', roleData?: {...} }
   */
  static async assignRole(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { role, roleData = {} } = req.body;

      const user = await UserService.assignRole(id, role, roleData);

      return res.status(200).json({
        message: `Role '${role}' assigned successfully to user ${id}`,
        user
      });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  /**
   * PUT /api/users/:id
   * Update user profile (nom, prenom, etc.)
   */
  static async updateUserProfile(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const user = await UserService.updateUserProfile(id, req.body);

      return res.status(200).json({
        message: 'User profile updated successfully',
        user
      });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  /**
   * DELETE /api/users/:id
   * Delete a user (cascade deletes role-specific profiles)
   */
  static async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const result = await UserService.deleteUser(id);

      return res.status(200).json(result);
    } catch (error) {
      return res.status(404).json({ error: error.message });
    }
  }

  /**
   * GET /api/users/:id/profile
   * Get user profile with role-specific data
   */
  static async getUserProfile(req, res) {
    try {
      const { id } = req.params;
      const user = await UserService.getUserById(id);

      if (!user.role) {
        return res.status(200).json({
          user: {
            id: user.id,
            email: user.email,
            nom: user.nom,
            prenom: user.prenom,
            role: null,
            message: 'User profile incomplete. Role not assigned yet.'
          }
        });
      }

      return res.status(200).json({ user });
    } catch (error) {
      return res.status(404).json({ error: error.message });
    }
  }

  /**
   * GET /api/users/me
   * Get current authenticated user's profile (from JWT)
   */
  static async getMe(req, res) {
    try {
      // req.user is set by auth middleware from JWT
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: No user ID in token' });
      }

      const user = await UserService.getUserById(userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (!user.role) {
        return res.status(200).json({
          status: 'success',
          user: {
            id: user.id,
            email: user.email,
            nom: user.nom,
            prenom: user.prenom,
            role: null,
            is_active: user.is_active,
            message: 'User profile incomplete. Role not assigned yet.'
          }
        });
      }

      return res.status(200).json({
        status: 'success',
        user
      });
    } catch (error) {
      return res.status(500).json({ 
        error: 'Failed to retrieve user profile',
        message: error.message 
      });
    }
  }
}

module.exports = UserController;
