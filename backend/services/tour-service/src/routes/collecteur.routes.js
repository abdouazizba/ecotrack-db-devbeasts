const express = require('express');
const { body, param, query } = require('express-validator');
const { CollecteurController } = require('../controllers');

const router = express.Router();

// Validation rules
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

// Routes
router.post('/', validateCollecteurCreate, CollecteurController.createCollecteur);
router.get('/', CollecteurController.getCollecteurs);
router.get('/low-battery', CollecteurController.getCollecteursByLowBattery);
router.get('/:id', param('id').isUUID(), CollecteurController.getCollecteurById);
router.put('/:id', param('id').isUUID(), validateCollecteurUpdate, CollecteurController.updateCollecteur);
router.delete('/:id', param('id').isUUID(), CollecteurController.deleteCollecteur);

// Agent routes
router.get('/agent/:agentId', param('agentId').isUUID(), CollecteurController.getCollecteursByAgent);

// Maintenance route
router.post('/:id/maintenance', 
  param('id').isUUID(), 
  validateMaintenance, 
  CollecteurController.recordMaintenance
);

module.exports = router;
