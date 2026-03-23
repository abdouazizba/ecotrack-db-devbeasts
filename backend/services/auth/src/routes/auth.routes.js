const express = require('express');
const { AuthController } = require('../controllers');
const validate = require('../middlewares/validation.middleware');
const { auth } = require('../middlewares/authorization.middleware');
const authValidator = require('../validators/auth.validator');

const router = express.Router();

/**
 * POST /api/auth/register
 * Public endpoint - create new account
 */
router.post(
  '/register',
  validate(authValidator.registerSchema, 'body'),
  AuthController.register
);

/**
 * POST /api/auth/login
 * Public endpoint - login
 */
router.post(
  '/login',
  validate(authValidator.loginSchema, 'body'),
  AuthController.login
);

/**
 * POST /api/auth/verify
 * Protected endpoint - verify JWT
 */
router.post(
  '/verify',
  auth,
  AuthController.verify
);

/**
 * POST /api/auth/refresh-token
 * Public endpoint - refresh JWT with refresh token
 */
router.post(
  '/refresh-token',
  validate(authValidator.refreshTokenSchema, 'body'),
  AuthController.refreshToken
);

/**
 * POST /api/auth/logout
 * Protected endpoint - logout
 */
router.post(
  '/logout',
  auth,
  AuthController.logout
);

module.exports = router;
