const { body, validationResult } = require('express-validator');

/**
 * Validate incoming measurement data
 */
const validateMeasurement = [
  body('capteur_id')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('capteur_id is required'),
  
  body('conteneur_id')
    .isInt({ min: 1 })
    .withMessage('conteneur_id must be a positive integer'),
  
  body('type_capteur')
    .isIn(['REMPLISSAGE', 'TEMPERATURE', 'POIDS', 'HUMIDITE', 'GPS'])
    .withMessage('type_capteur must be one of: REMPLISSAGE, TEMPERATURE, POIDS, HUMIDITE, GPS'),
  
  body('valeur')
    .isFloat()
    .withMessage('valeur must be a number'),
  
  body('unite')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('unite is required (%, °C, kg, etc)'),
  
  body('timestamp_capteur')
    .optional()
    .isISO8601()
    .withMessage('timestamp_capteur must be ISO 8601 format'),
  
  body('qualite_signal')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('qualite_signal must be 0-100'),
  
  body('batterie')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('batterie must be 0-100'),
];

/**
 * Validate device registration
 */
const validateDeviceRegistration = [
  body('capteur_id')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('capteur_id is required'),
  
  body('type_capteur')
    .isIn(['REMPLISSAGE', 'TEMPERATURE', 'POIDS', 'HUMIDITE', 'GPS'])
    .withMessage('type_capteur is required'),
  
  body('conteneur_id')
    .isInt({ min: 1 })
    .withMessage('conteneur_id must be a positive integer'),
  
  body('api_key')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('api_key is required for device registration'),
];

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(e => ({
        field: e.param,
        message: e.msg,
        value: e.value
      }))
    });
  }
  next();
};

module.exports = {
  validateMeasurement,
  validateDeviceRegistration,
  handleValidationErrors
};
