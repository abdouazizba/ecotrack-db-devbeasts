const express = require('express');
const { body } = require('express-validator');
const { ZoneController } = require('../controllers');

const router = express.Router();

router.post('/', [
  body('nom').notEmpty().trim(),
  body('code_zone').notEmpty().trim(),
  body('geometrie').optional().isJSON(),
  body('population_estimee').optional().isInt(),
], ZoneController.createZone);

router.get('/', ZoneController.getAllZones);

router.get('/:zoneId', ZoneController.getZoneById);

router.put('/:zoneId', [
  body('nom').optional().trim(),
  body('geometrie').optional().isJSON(),
  body('population_estimee').optional().isInt(),
], ZoneController.updateZone);

router.delete('/:zoneId', ZoneController.deleteZone);

module.exports = router;
