const express = require('express');
const { body, param } = require('express-validator');
const { CollecteurController } = require('../controllers');
const { authenticate, authorize } = require('../middlewares');

const router = express.Router();

const ADMIN_ROLES = ['admin', 'super_admin'];
const STAFF_ROLES = ['admin', 'super_admin', 'agent'];

const validateCollecteurCreate = [
  body('code_collecteur').isString().notEmpty().withMessage('Code collecteur is required'),
  body('id_agent').isUUID().withMessage('Valid agent ID is required'),
  body('statut').optional().isIn(['ACTIF', 'INACTIF', 'EN_MAINTENANCE']),
  body('model').optional().isString(),
  body('batterie_actuelle').optional().isFloat({ min: 0, max: 100 }),
];

const validateCollecteurUpdate = [
  body('statut').optional().isIn(['ACTIF', 'INACTIF', 'EN_MAINTENANCE']),
  body('batterie_actuelle').optional().isFloat({ min: 0, max: 100 }),
  body('notes').optional().isString(),
];

const validateMaintenance = [
  body('notes').optional().isString(),
];

// CRUD
router.post('/', authenticate, authorize(ADMIN_ROLES), validateCollecteurCreate, CollecteurController.createCollecteur);
router.get('/', authenticate, authorize(STAFF_ROLES), CollecteurController.getCollecteurs);
router.get('/low-battery', authenticate, authorize(STAFF_ROLES), CollecteurController.getCollecteursByLowBattery);
router.get('/:id', authenticate, authorize(STAFF_ROLES), param('id').isUUID(), CollecteurController.getCollecteurById);
router.put('/:id', authenticate, authorize(ADMIN_ROLES), param('id').isUUID(), validateCollecteurUpdate, CollecteurController.updateCollecteur);
router.delete('/:id', authenticate, authorize(ADMIN_ROLES), param('id').isUUID(), CollecteurController.deleteCollecteur);

// Agent's devices
router.get('/agent/:agentId', authenticate, authorize(STAFF_ROLES), param('agentId').isUUID(), CollecteurController.getCollecteursByAgent);

// Maintenance — agents can record maintenance
router.post('/:id/maintenance',
  authenticate, authorize(STAFF_ROLES),
  param('id').isUUID(),
  validateMaintenance,
  CollecteurController.recordMaintenance
);

module.exports = router;
