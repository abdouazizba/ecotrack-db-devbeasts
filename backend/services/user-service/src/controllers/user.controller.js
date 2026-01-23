const { validationResult } = require('express-validator');
const { UserService } = require('../services');

class UserController {
  // Create a new user (Agent, Citoyen, or Admin)
  static async createUser(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { role } = req.params;
      const user = await UserService.createUser(req.body, role);
      return res.status(201).json({
        message: `${role} created successfully`,
        user,
      });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  // Get my profile
  static async getProfile(req, res) {
    try {
      const user = await UserService.getUserById(req.user.id);
      return res.status(200).json(user);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  // Update my profile
  static async updateProfile(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = await UserService.updateUser(req.user.id, req.body);
      return res.status(200).json({
        message: 'Profile updated successfully',
        user,
      });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  // Deactivate my account
  static async deactivateAccount(req, res) {
    try {
      await UserService.deactivateUser(req.user.id);
      return res.status(200).json({ message: 'Account deactivated successfully' });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  // Get all users (Admin only)
  static async getAllUsers(req, res) {
    try {
      const users = await UserService.getAllUsers();
      return res.status(200).json(users);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  // Get user details (Admin only)
  static async getUserDetails(req, res) {
    try {
      const user = await UserService.getUserById(req.params.userId);
      return res.status(200).json(user);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  // Update user (Admin only)
  static async adminUpdateUser(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = await UserService.updateUser(req.params.userId, req.body);
      return res.status(200).json({
        message: 'User updated successfully',
        user,
      });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  // Deactivate user (Admin only)
  static async adminDeactivateUser(req, res) {
    try {
      await UserService.deactivateUser(req.params.userId);
      return res.status(200).json({ message: 'User deactivated successfully' });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }
}

module.exports = UserController;
