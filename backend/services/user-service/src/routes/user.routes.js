const express = require('express');
const { body } = require('express-validator');
const UserController = require('../controllers/user.controller');
const {
  authenticate,
  requireAdmin,
  requireSuperAdmin,
  requireOwnerOrAdmin,
} = require('../middlewares/auth.middleware');

const router = express.Router();

// GET /api/users/me — must be BEFORE /:id to avoid route conflict
router.get('/me', authenticate, UserController.getMe);

// GET /api/users — admin only
router.get('/', authenticate, requireAdmin, UserController.getAllUsers);

// GET /api/users/citoyens — tout utilisateur authentifié (classement accessible aux citoyens)
router.get('/citoyens', authenticate, UserController.getCitoyens);

// GET /api/users/:id — any authenticated user
router.get('/:id', authenticate, UserController.getUserById);

// GET /api/users/:id/profile — any authenticated user
router.get('/:id/profile', authenticate, UserController.getUserProfile);

// PUT /api/users/:id/role — super_admin only (role elevation is critical)
router.put('/:id/role', authenticate, requireSuperAdmin, [
  body('role').isIn(['super_admin', 'admin', 'agent', 'citoyen']).withMessage('Role must be: super_admin, admin, agent, or citoyen'),
  body('roleData').optional().isObject(),
], UserController.assignRole);

// PUT /api/users/:id — owner or admin
router.put('/:id', authenticate, requireOwnerOrAdmin, [
  body('nom').optional().notEmpty().trim(),
  body('prenom').optional().notEmpty().trim(),
  body('date_naissance').optional().isISO8601(),
  body('is_active').optional().isBoolean(),
], UserController.updateUserProfile);

// DELETE /api/users/:id — admin only
router.delete('/:id', authenticate, requireAdmin, UserController.deleteUser);

module.exports = router;
