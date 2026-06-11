const express = require('express');
const { body, param } = require('express-validator');
const { SignalementController } = require('../controllers');
const { authenticate, authorize } = require('../middlewares');
const upload = require('../middlewares/upload.middleware');

const router = express.Router();

const ADMIN_ROLES = ['admin', 'super_admin'];
const STAFF_ROLES = ['admin', 'super_admin', 'agent'];

const validateSignalementCreate = [
  body('type').isIn(['CONTENEUR_PLEIN', 'CONTENEUR_ENDOMMAGÉ', 'MAUVAISE_ODEUR', 'DÉBORDEMENT', 'AUTRE'])
    .withMessage('Valid signal type is required'),
  body('description').optional().isString(),
  body('id_conteneur').isUUID().withMessage('Valid container ID is required'),
  body('latitude').optional().isFloat(),
  body('longitude').optional().isFloat(),
  body('photo_url').optional().isURL(),
  body('priorite').optional().isIn(['BASSE', 'NORMALE', 'HAUTE', 'CRITIQUE']),
];

const validateSignalementUpdate = [
  body('type').optional().isIn(['CONTENEUR_PLEIN', 'CONTENEUR_ENDOMMAGÉ', 'MAUVAISE_ODEUR', 'DÉBORDEMENT', 'AUTRE']),
  body('description').optional().isString(),
  body('statut').optional().isIn(['OUVERT', 'EN_COURS_DE_TRAITEMENT', 'FERMÉ', 'REJETÉ']),
  body('priorite').optional().isIn(['BASSE', 'NORMALE', 'HAUTE', 'CRITIQUE']),
];

const validateResolution = [
  body('notes').optional().isString(),
];

// Create: any authenticated user (citoyen, agent, admin)
router.post('/', authenticate, validateSignalementCreate, SignalementController.createSignalement);

// List all: staff only (not citoyen — they use /citoyen/:id for their own)
router.get('/', authenticate, authorize(STAFF_ROLES), SignalementController.getSignalements);
router.get('/open', authenticate, authorize(STAFF_ROLES), SignalementController.getOpenSignalements);

// View single: any authenticated user
router.get('/:id', authenticate, param('id').isUUID(), SignalementController.getSignalementById);

// Update: staff only
router.put('/:id', authenticate, authorize(STAFF_ROLES), param('id').isUUID(), validateSignalementUpdate, SignalementController.updateSignalement);

// Delete: admin only
router.delete('/:id', authenticate, authorize(ADMIN_ROLES), param('id').isUUID(), SignalementController.deleteSignalement);

// Citizen's own signals: any authenticated user (controller enforces ownership vs admin)
router.get('/citoyen/:citoyenId', authenticate, param('citoyenId').isUUID(), SignalementController.getSignalementsByCitoyen);

// Container signals: staff only
router.get('/container/:containerId', authenticate, authorize(STAFF_ROLES), param('containerId').isUUID(), SignalementController.getSignalementsByContainer);

// Status transitions: agent + admin
router.post('/:id/in-progress', authenticate, authorize(STAFF_ROLES), param('id').isUUID(), SignalementController.markInProgress);
router.post('/:id/close', authenticate, authorize(STAFF_ROLES), param('id').isUUID(), validateResolution, SignalementController.closeSignalement);
router.post('/:id/reject', authenticate, authorize(ADMIN_ROLES), param('id').isUUID(), validateResolution, SignalementController.rejectSignalement);

// Photo upload: creator or staff
router.post('/:id/photo', authenticate, param('id').isUUID(), upload.single('photo'), SignalementController.uploadPhoto);

module.exports = router;
