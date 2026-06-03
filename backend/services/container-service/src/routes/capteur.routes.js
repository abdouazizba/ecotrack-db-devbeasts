const express = require('express');
const { body, param } = require('express-validator');
const CapteurController = require('../controllers/capteur.controller');

const router = express.Router();

const validateCreate = [
  body('code_capteur').notEmpty().trim().withMessage('code_capteur is required'),
  body('type').isIn(['REMPLISSAGE', 'TEMPERATURE', 'SIGNAL']).withMessage('Invalid type'),
  body('id_conteneur').isUUID().withMessage('id_conteneur must be a valid UUID'),
  body('statut').optional().isIn(['ACTIF', 'INACTIF', 'EN_MAINTENANCE']),
  body('batterie').optional().isInt({ min: 0, max: 100 }),
];

const validateUpdate = [
  body('code_capteur').optional().notEmpty().trim(),
  body('type').optional().isIn(['REMPLISSAGE', 'TEMPERATURE', 'SIGNAL']),
  body('statut').optional().isIn(['ACTIF', 'INACTIF', 'EN_MAINTENANCE']),
  body('batterie').optional().isInt({ min: 0, max: 100 }),
];

router.post('/',                             validateCreate,              CapteurController.createCapteur);
router.get('/',                              CapteurController.getAllCapteurs);
router.get('/conteneur/:conteneurId',        CapteurController.getCapteursByConteneur);
router.get('/:id',                           param('id').isUUID(),        CapteurController.getCapteurById);
router.put('/:id',                           validateUpdate,              CapteurController.updateCapteur);
router.delete('/:id',                        param('id').isUUID(),        CapteurController.deleteCapteur);
router.patch('/:id/conteneur',               param('id').isUUID(),        CapteurController.assignToConteneur);
router.patch('/:id/batterie',                param('id').isUUID(),        CapteurController.updateBatterie);

module.exports = router;
