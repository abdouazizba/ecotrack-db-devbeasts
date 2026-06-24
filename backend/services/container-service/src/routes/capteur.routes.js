const express = require('express');
const { body, param } = require('express-validator');
const CapteurController = require('../controllers/capteur.controller');
const { authenticate, authorize } = require('../middlewares/authorization.middleware');

const router = express.Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ADMIN_ROLES = ['admin', 'super_admin'];
const STAFF_ROLES = ['admin', 'super_admin', 'agent'];

const validateCreate = [
  body('code_capteur').notEmpty().trim().withMessage('code_capteur is required'),
  body('type').isIn(['REMPLISSAGE', 'TEMPERATURE', 'SIGNAL']).withMessage('Invalid type'),
  body('id_conteneur').matches(UUID_RE).withMessage('id_conteneur must be a valid UUID'),
  body('statut').optional().isIn(['ACTIF', 'INACTIF', 'EN_MAINTENANCE']),
  body('batterie').optional().isInt({ min: 0, max: 100 }),
];

const validateUpdate = [
  body('code_capteur').optional().notEmpty().trim(),
  body('type').optional().isIn(['REMPLISSAGE', 'TEMPERATURE', 'SIGNAL']),
  body('statut').optional().isIn(['ACTIF', 'INACTIF', 'EN_MAINTENANCE']),
  body('batterie').optional().isInt({ min: 0, max: 100 }),
];

// Create/Delete/Assign: admin only
router.post('/', authenticate, authorize(ADMIN_ROLES), validateCreate, CapteurController.createCapteur);
router.delete('/:id', authenticate, authorize(ADMIN_ROLES), param('id').matches(UUID_RE), CapteurController.deleteCapteur);
router.patch('/:id/conteneur', authenticate, authorize(ADMIN_ROLES), param('id').matches(UUID_RE), CapteurController.assignToConteneur);

// Read: staff
router.get('/', authenticate, authorize(STAFF_ROLES), CapteurController.getAllCapteurs);
router.get('/conteneur/:conteneurId', authenticate, authorize(STAFF_ROLES), CapteurController.getCapteursByConteneur);
router.get('/:id', authenticate, authorize(STAFF_ROLES), param('id').matches(UUID_RE), CapteurController.getCapteurById);

// Update: admin only
router.put('/:id', authenticate, authorize(ADMIN_ROLES), validateUpdate, CapteurController.updateCapteur);

// Battery update: staff (agents/IoT-triggered updates)
router.patch('/:id/batterie', authenticate, authorize(STAFF_ROLES), param('id').matches(UUID_RE), CapteurController.updateBatterie);

module.exports = router;
