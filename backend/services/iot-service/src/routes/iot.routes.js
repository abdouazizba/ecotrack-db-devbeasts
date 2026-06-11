const express = require('express');
const router = express.Router();
const iotController = require('../controllers/iot.controller');
const {
  validateMeasurement,
  validateDeviceRegistration,
  handleValidationErrors,
} = require('../middlewares/validation');

// POST /api/iot/measure — receive sensor data and forward to container-service
router.post(
  '/measure',
  validateMeasurement,
  handleValidationErrors,
  iotController.recordMeasurement
);

// POST /api/iot/device/register — register a physical sensor
router.post(
  '/device/register',
  validateDeviceRegistration,
  handleValidationErrors,
  iotController.registerDevice
);

// GET /api/iot/status — service health + endpoints list
router.get('/status', iotController.getStatus);

module.exports = router;
