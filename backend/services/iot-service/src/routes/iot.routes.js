const express = require('express');
const router = express.Router();
const iotController = require('../controllers/iot.controller');
const {
  validateMeasurement,
  validateDeviceRegistration,
  handleValidationErrors
} = require('../middlewares/validation');

/**
 * POST /api/iot/measure
 * Receive measurement from IoT device
 */
router.post(
  '/measure',
  validateMeasurement,
  handleValidationErrors,
  iotController.recordMeasurement
);

/**
 * POST /api/iot/device/register
 * Register new IoT device
 */
router.post(
  '/device/register',
  validateDeviceRegistration,
  handleValidationErrors,
  iotController.registerDevice
);

/**
 * GET /api/iot/device/:capteur_id
 * Get device information
 */
router.get('/device/:capteur_id', iotController.getDevice);

/**
 * GET /api/iot/status
 * Get IoT service status and available endpoints
 */
router.get('/status', iotController.getStatus);

module.exports = router;
