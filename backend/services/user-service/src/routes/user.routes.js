const express = require('express');
const { body } = require('express-validator');
const UserController = require('../controllers/user.controller');

const router = express.Router();

// ============================================
// 📋 USER ROUTES (Public & Event-Driven)
// ============================================

/**
 * GET /api/users/:id
 * Get a user by ID (event-driven from auth-service)
 */
router.get('/:id', UserController.getUserById);

/**
 * GET /api/users
 * Get all users (with pagination)
 */
router.get('/', UserController.getAllUsers);

/**
 * PUT /api/users/:id/role
 * Assign role to a user (converts user.created → complete profile)
 * Body: { role: 'agent' | 'citoyen' | 'admin', roleData?: {...} }
 *
 * Example:
 * PUT /api/users/uuid-123/role
 * {
 *   "role": "agent",
 *   "roleData": {
 *     "numero_badge": "AGENT-001",
 *     "id_zone": "zone-uuid"
 *   }
 * }
 */
router.put('/:id/role', [
  body('role').isIn(['super_admin', 'admin', 'agent', 'citoyen']).withMessage('Role must be: super_admin, admin, agent, or citoyen'),
  body('roleData').optional().isObject(),
], UserController.assignRole);

/**
 * PUT /api/users/:id
 * Update user profile (nom, prenom, etc.)
 */
router.put('/:id', [
  body('nom').optional().notEmpty().trim(),
  body('prenom').optional().notEmpty().trim(),
  body('date_naissance').optional().isISO8601(),
  body('is_active').optional().isBoolean(),
], UserController.updateUserProfile);

/**
 * DELETE /api/users/:id
 * Delete a user
 */
router.delete('/:id', UserController.deleteUser);

/**
 * GET /api/users/:id/profile
 * Get user profile with role-specific data
 */
router.get('/:id/profile', UserController.getUserProfile);

module.exports = router;
