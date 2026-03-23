/**
 * Auth Validators - Joi Schemas
 * Valide les requêtes d'authentification
 */

const Joi = require('joi');

/**
 * Schema pour POST /register
 * Body: { email, password, nom?, prenom? }
 */
const registerSchema = Joi.object({
  email: Joi.string()
    .email()
    .lowercase()
    .trim()
    .required()
    .messages({
      'string.email': 'Email must be valid',
      'any.required': 'Email is required'
    }),

  password: Joi.string()
    .min(8)
    .max(128)
    .required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.base': 'Password must contain uppercase, lowercase, and numbers',
      'any.required': 'Password is required'
    }),

  nom: Joi.string()
    .max(100)
    .optional()
    .messages({
      'string.max': 'Last name must be less than 100 characters'
    }),

  prenom: Joi.string()
    .max(100)
    .optional()
    .messages({
      'string.max': 'First name must be less than 100 characters'
    }),

  role: Joi.string()
    .valid('agent', 'citoyen', 'admin')
    .optional()
    .default('citoyen')
    .messages({
      'any.only': 'Role must be one of: agent, citoyen, admin'
    })
});

/**
 * Schema pour POST /login
 * Body: { email, password }
 */
const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .lowercase()
    .trim()
    .required()
    .messages({
      'string.email': 'Email must be valid',
      'any.required': 'Email is required'
    }),

  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    })
});

/**
 * Schema pour POST /refresh-token
 * Body: { refreshToken }
 */
const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string()
    .required()
    .messages({
      'any.required': 'Refresh token is required'
    })
});

/**
 * Schema pour POST /verify
 * Body: { token }
 */
const verifyTokenSchema = Joi.object({
  token: Joi.string()
    .required()
    .messages({
      'any.required': 'Token is required'
    })
});

/**
 * Schema pour UUID paramètres
 * Params: { id }
 */
const uuidParamSchema = Joi.object({
  id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Invalid user ID format',
      'any.required': 'User ID is required'
    })
});

/**
 * Schema pour changement de password
 * Body: { oldPassword, newPassword }
 */
const changePasswordSchema = Joi.object({
  oldPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'Current password is required'
    }),

  newPassword: Joi.string()
    .min(8)
    .max(128)
    .required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .messages({
      'string.min': 'New password must be at least 8 characters',
      'string.pattern.base': 'Password must contain uppercase, lowercase, and numbers',
      'any.required': 'New password is required'
    })
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  verifyTokenSchema,
  uuidParamSchema,
  changePasswordSchema
};
