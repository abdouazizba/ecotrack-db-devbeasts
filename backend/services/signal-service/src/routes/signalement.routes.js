const express = require('express');
const { body, param, query } = require('express-validator');
const { SignalementController } = require('../controllers');
const { authenticate } = require('../middlewares');

const router = express.Router();

// Validation rules
const validateSignalementCreate = [
  body('type').isIn(['CONTENEUR_PLEIN', 'CONTENEUR_ENDOMMAGÉ', 'MAUVAISE_ODEUR', 'DÉBORDEMENT', 'AUTRE'])
    .withMessage('Valid signal type is required'),
  body('description').optional().isString(),
  body('id_conteneur').isUUID().withMessage('Valid container ID is required'),
  // id_utilisateur est injecté depuis req.user.id (JWT), ne pas accepter du client
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

// Routes
// authenticate oblige l'utilisateur à être connecté et injecte req.user depuis le JWT
router.post('/', authenticate, validateSignalementCreate, SignalementController.createSignalement);
router.get('/', SignalementController.getSignalements);
router.get('/open', SignalementController.getOpenSignalements);
router.get('/:id', param('id').isUUID(), SignalementController.getSignalementById);
router.put('/:id', param('id').isUUID(), validateSignalementUpdate, SignalementController.updateSignalement);
router.delete('/:id', param('id').isUUID(), SignalementController.deleteSignalement);

// Citizen routes
router.get('/citoyen/:citoyenId', param('citoyenId').isUUID(), SignalementController.getSignalementsByCitoyen);

// Container routes
router.get('/container/:containerId', param('containerId').isUUID(), SignalementController.getSignalementsByContainer);

// Status change routes
router.post('/:id/in-progress', param('id').isUUID(), SignalementController.markInProgress);
router.post('/:id/close', param('id').isUUID(), validateResolution, SignalementController.closeSignalement);
router.post('/:id/reject', param('id').isUUID(), validateResolution, SignalementController.rejectSignalement);

module.exports = router;
