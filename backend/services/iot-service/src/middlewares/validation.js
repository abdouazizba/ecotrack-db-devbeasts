const { body, validationResult } = require('express-validator');

const validateMeasurement = [
  body('id_conteneur')
    .isUUID()
    .withMessage('id_conteneur must be a valid UUID'),

  body('capteur_id')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('capteur_id must be a non-empty string'),

  body('taux_remplissage')
    .isFloat({ min: 0, max: 100 })
    .withMessage('taux_remplissage must be a number between 0 and 100'),

  body('temperature')
    .optional()
    .isFloat()
    .withMessage('temperature must be a number (°C)'),

  body('batterie')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('batterie must be an integer between 0 and 100'),

  body('signal_force')
    .optional()
    .isInt()
    .withMessage('signal_force must be an integer (dBm)'),
];

const validateDeviceRegistration = [
  body('capteur_id')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('capteur_id is required'),

  body('id_conteneur')
    .isUUID()
    .withMessage('id_conteneur must be a valid UUID'),

  body('api_key')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('api_key is required for device registration'),
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(e => ({
        field: e.path,
        message: e.msg,
        value: e.value,
      })),
    });
  }
  next();
};

module.exports = {
  validateMeasurement,
  validateDeviceRegistration,
  handleValidationErrors,
};
