const express = require('express');
const { body } = require('express-validator');
const { UserController } = require('../controllers');
const { authenticate, requireAdmin } = require('../middlewares/auth.middleware');

const router = express.Router();

const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('nom').notEmpty().trim(),
  body('prenom').notEmpty().trim(),
  body('date_naissance').optional().isISO8601(),
];

// All user routes require authentication
router.use(authenticate);

// Create new user (by role)
router.post('/:role', registerValidation, UserController.createUser);

// Get my profile
router.get('/me', UserController.getProfile);

// Update my profile
router.put('/me', [
  body('nom').optional().trim(),
  body('prenom').optional().trim(),
  body('date_naissance').optional().isISO8601(),
], UserController.updateProfile);

// Deactivate my account
router.delete('/me', UserController.deactivateAccount);

// Admin routes
router.get('/admin/users', requireAdmin, UserController.getAllUsers);
router.get('/admin/users/:userId', requireAdmin, UserController.getUserDetails);
router.put('/admin/users/:userId', requireAdmin, UserController.adminUpdateUser);
router.delete('/admin/users/:userId', requireAdmin, UserController.adminDeactivateUser);

module.exports = router;
