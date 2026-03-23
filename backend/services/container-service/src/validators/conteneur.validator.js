/**
 * Schémas de Validation Joi pour le Container Service
 * Docs: https://joi.dev/api/
 */

const Joi = require('joi');

/**
 * Schema : Créer un conteneur
 * POST /api/conteneurs
 */
const createConteneurSchema = Joi.object({
  code: Joi.string()
    .alphanum()
    .min(3)
    .max(50)
    .required()
    .messages({
      'string.alphanum': 'Code must contain only alphanumeric characters',
      'string.min': 'Code must be at least 3 characters',
      'any.required': 'Code is required'
    }),

  latitude: Joi.number()
    .min(-90)
    .max(90)
    .required()
    .messages({
      'number.min': 'Latitude must be >= -90',
      'number.max': 'Latitude must be <= 90',
      'any.required': 'Latitude is required'
    }),

  longitude: Joi.number()
    .min(-180)
    .max(180)
    .required()
    .messages({
      'number.min': 'Longitude must be >= -180',
      'number.max': 'Longitude must be <= 180',
      'any.required': 'Longitude is required'
    }),

  zone_id: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.guid': 'Zone ID must be a valid UUID'
    }),

  waste_type: Joi.string()
    .valid('general', 'recycling', 'organic', 'hazardous')
    .default('general')
    .messages({
      'any.only': 'Waste type must be one of: general, recycling, organic, hazardous'
    }),

  capacity_liters: Joi.number()
    .min(1)
    .max(10000)
    .default(100)
    .messages({
      'number.min': 'Capacity must be at least 1 liter',
      'number.max': 'Capacity cannot exceed 10000 liters'
    })
});

/**
 * Schema : Mettre à jour un conteneur
 * PUT /api/conteneurs/:id
 */
const updateConteneurSchema = Joi.object({
  code: Joi.string()
    .alphanum()
    .min(3)
    .max(50)
    .optional(),

  latitude: Joi.number()
    .min(-90)
    .max(90)
    .optional(),

  longitude: Joi.number()
    .min(-180)
    .max(180)
    .optional(),

  zone_id: Joi.string()
    .uuid()
    .optional(),

  waste_type: Joi.string()
    .valid('general', 'recycling', 'organic', 'hazardous')
    .optional(),

  capacity_liters: Joi.number()
    .min(1)
    .max(10000)
    .optional(),

  status: Joi.string()
    .valid('active', 'inactive', 'maintenance')
    .optional(),

  current_fill_level: Joi.number()
    .min(0)
    .max(100)
    .optional()
}).min(1); // Au moins 1 champ à mettre à jour

/**
 * Schema : Mettre à jour le niveau de remplissage
 * POST /api/conteneurs/:id/fill-level
 */
const updateFillLevelSchema = Joi.object({
  fill_level: Joi.number()
    .min(0)
    .max(100)
    .required()
    .messages({
      'number.min': 'Fill level must be >= 0',
      'number.max': 'Fill level must be <= 100',
      'any.required': 'Fill level is required'
    })
});

/**
 * Schema : Query filters pour lister
 * GET /api/conteneurs?zone_id=xxx&status=active&waste_type=general
 */
const listFiltersSchema = Joi.object({
  zone_id: Joi.string()
    .uuid()
    .optional(),

  status: Joi.string()
    .valid('active', 'inactive', 'maintenance')
    .optional(),

  waste_type: Joi.string()
    .valid('general', 'recycling', 'organic', 'hazardous')
    .optional(),

  limit: Joi.number()
    .min(1)
    .max(100)
    .default(10)
    .optional(),

  offset: Joi.number()
    .min(0)
    .default(0)
    .optional()
}).unknown(true); // Allow unknown params (on les ignore)

/**
 * Schema : UUID param (pour :id)
 */
const uuidParamSchema = Joi.object({
  id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'ID must be a valid UUID',
      'any.required': 'ID is required'
    })
});

module.exports = {
  createConteneurSchema,
  updateConteneurSchema,
  updateFillLevelSchema,
  listFiltersSchema,
  uuidParamSchema
};
