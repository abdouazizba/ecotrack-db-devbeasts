const express = require('express');
const { body } = require('express-validator');
const { ZoneController } = require('../controllers');
const { authenticate, authorize } = require('../middlewares/authorization.middleware');

const router = express.Router();

const ADMIN_ROLES = ['admin', 'super_admin'];

// Create/Update/Delete: admin only
router.post('/', authenticate, authorize(ADMIN_ROLES), [
  body('nom').notEmpty().trim(),
  body('code_zone').notEmpty().trim(),
  body('geometrie').optional(),
  body('population_estimee').optional().isInt(),
], ZoneController.createZone);

// Read: any authenticated user
router.get('/', authenticate, ZoneController.getAllZones);
router.get('/:zoneId', authenticate, ZoneController.getZoneById);

router.put('/:zoneId', authenticate, authorize(ADMIN_ROLES), [
  body('nom').optional().trim(),
  body('geometrie').optional().isJSON(),
  body('population_estimee').optional().isInt(),
], ZoneController.updateZone);

router.delete('/:zoneId', authenticate, authorize(ADMIN_ROLES), ZoneController.deleteZone);

module.exports = router;
