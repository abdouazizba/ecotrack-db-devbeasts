const express = require('express');
const { AuthController } = require('../controllers');
const validate = require('../middlewares/validation.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { authRateLimiter } = require('../middlewares/common.middleware');
const authValidator = require('../validators/auth.validator');

const router = express.Router();

/**
 * POST /api/auth/register
 * Public endpoint - create new account
 */
router.post(
  '/register',
  authRateLimiter,
  validate(authValidator.registerSchema, 'body'),
  AuthController.register
);

/**
 * POST /api/auth/login
 * Public endpoint - login
 */
router.post(
  '/login',
  authRateLimiter,
  validate(authValidator.loginSchema, 'body'),
  AuthController.login
);

/**
 * POST /api/auth/verify
 * Protected endpoint - verify JWT
 */
router.post(
  '/verify',
  authenticate,
  AuthController.verify
);

/**
 * POST /api/auth/refresh-token
 * Public endpoint - refresh JWT with refresh token
 */
router.post(
  '/refresh-token',
  authRateLimiter,
  validate(authValidator.refreshTokenSchema, 'body'),
  AuthController.refreshToken
);

/**
 * POST /api/auth/logout
 * Protected endpoint - logout
 */
router.post(
  '/logout',
  authenticate,
  AuthController.logout
);

/**
 * GET /api/auth/me
 * Protected endpoint - get current user from JWT
 */
router.get(
  '/me',
  authenticate,
  AuthController.getMe
);

module.exports = router;
