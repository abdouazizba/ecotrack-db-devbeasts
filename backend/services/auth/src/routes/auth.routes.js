const express = require('express');
const { body } = require('express-validator');
const { AuthController } = require('../controllers');

const router = express.Router();

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
];

// Register new credentials (called by User Service)
router.post('/register', registerValidation, AuthController.register);

// Generic login (all roles)
router.post('/login', loginValidation, AuthController.login);

// Verify token
router.post('/verify', AuthController.verify);

// Refresh token
router.post('/refresh', AuthController.refreshToken);

// Logout
router.post('/logout', AuthController.logout);

module.exports = router;
