const express = require('express');
const { body } = require('express-validator');
const { ConteneurController } = require('../controllers');
const { authenticate, authorize } = require('../middlewares/authorization.middleware');

const router = express.Router();

const ADMIN_ROLES = ['admin', 'super_admin'];
const STAFF_ROLES = ['admin', 'super_admin', 'agent'];

// Create: admin only
router.post('/', authenticate, authorize(ADMIN_ROLES), [
  body('code_conteneur').notEmpty().trim(),
  body('type_conteneur').isIn(['standard', 'selective', 'organic', 'hazardous']),
  body('capacite').isFloat({ min: 0 }),
  body('latitude').isFloat(),
  body('longitude').isFloat(),
  body('date_installation').isISO8601(),
  body('id_zone').notEmpty(),
], ConteneurController.createConteneur);

// Read: any authenticated user
router.get('/', authenticate, ConteneurController.getAllConteneurs);
router.get('/needs-service', authenticate, authorize(STAFF_ROLES), ConteneurController.getConteneursneedingService);
// /nearby must be before /:conteneurId to avoid route collision
router.get('/nearby', authenticate, ConteneurController.getNearbyConteneurs);
router.get('/:conteneurId', authenticate, ConteneurController.getConteneurById);

// Update: agent can update status (e.g. after collection), admin can update all
router.put('/:conteneurId', authenticate, authorize(STAFF_ROLES), [
  body('statut').optional().isIn(['actif', 'maintenance', 'retire']),
  body('capacite').optional().isFloat({ min: 0 }),
], ConteneurController.updateConteneur);

// Delete: admin only
router.delete('/:conteneurId', authenticate, authorize(ADMIN_ROLES), ConteneurController.deleteConteneur);

module.exports = router;
