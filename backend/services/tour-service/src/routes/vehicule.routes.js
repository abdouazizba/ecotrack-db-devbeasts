const express = require('express');
const { body, param } = require('express-validator');
const { VehiculeController } = require('../controllers');
const { authenticate, authorize } = require('../middlewares');

const router = express.Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ADMIN_ROLES = ['admin', 'super_admin'];
const STAFF_ROLES = ['admin', 'super_admin', 'agent'];

const validateVehiculeCreate = [
  body('immatriculation').isString().notEmpty().withMessage('Immatriculation is required'),
  body('marque').isString().notEmpty().withMessage('Marque is required'),
  body('modele').optional().isString(),
  body('type_vehicule').optional().isIn(['BENNE', 'COMPACTEUR', 'UTILITAIRE', 'CAMION_GRUE']),
  body('capacite_tonnes').optional().isFloat({ min: 0 }),
  body('kilometrage').optional().isInt({ min: 0 }),
  body('id_agent').optional().matches(UUID_RE).withMessage('Valid agent ID is required'),
  body('statut').optional().isIn(['ACTIF', 'INACTIF', 'EN_MAINTENANCE']),
];

const validateVehiculeUpdate = [
  body('statut').optional().isIn(['ACTIF', 'INACTIF', 'EN_MAINTENANCE']),
  body('kilometrage').optional().isInt({ min: 0 }),
  body('id_agent').optional().matches(UUID_RE),
  body('notes').optional().isString(),
  body('type_vehicule').optional().isIn(['BENNE', 'COMPACTEUR', 'UTILITAIRE', 'CAMION_GRUE']),
  body('capacite_tonnes').optional().isFloat({ min: 0 }),
];

const validateMaintenance = [
  body('notes').optional().isString(),
];

// CRUD
router.post('/', authenticate, authorize(ADMIN_ROLES), validateVehiculeCreate, VehiculeController.createVehicule);
router.get('/', authenticate, authorize(STAFF_ROLES), VehiculeController.getVehicules);
router.get('/maintenance-due', authenticate, authorize(STAFF_ROLES), VehiculeController.getVehiculesMaintenanceDue);
router.get('/agent/:agentId', authenticate, authorize(STAFF_ROLES), param('agentId').matches(UUID_RE), VehiculeController.getVehiculesByAgent);
router.get('/:id', authenticate, authorize(STAFF_ROLES), param('id').matches(UUID_RE), VehiculeController.getVehiculeById);
router.put('/:id', authenticate, authorize(ADMIN_ROLES), param('id').matches(UUID_RE), validateVehiculeUpdate, VehiculeController.updateVehicule);
router.delete('/:id', authenticate, authorize(ADMIN_ROLES), param('id').matches(UUID_RE), VehiculeController.deleteVehicule);

// Maintenance
router.post('/:id/maintenance',
  authenticate, authorize(STAFF_ROLES),
  param('id').matches(UUID_RE),
  validateMaintenance,
  VehiculeController.recordMaintenance
);

module.exports = router;
