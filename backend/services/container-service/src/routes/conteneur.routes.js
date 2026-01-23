const express = require('express');
const { body } = require('express-validator');
const { ConteneurController } = require('../controllers');

const router = express.Router();

router.post('/', [
  body('code_conteneur').notEmpty().trim(),
  body('type_conteneur').isIn(['standard', 'selective', 'organic', 'hazardous']),
  body('capacite').isFloat({ min: 0 }),
  body('latitude').isFloat(),
  body('longitude').isFloat(),
  body('date_installation').isISO8601(),
  body('id_zone').notEmpty(),
], ConteneurController.createConteneur);

router.get('/', ConteneurController.getAllConteneurs);

router.get('/needs-service', ConteneurController.getConteneursneedingService);

router.get('/:conteneurId', ConteneurController.getConteneurById);

router.put('/:conteneurId', [
  body('statut').optional().isIn(['actif', 'maintenance', 'retire']),
  body('capacite').optional().isFloat({ min: 0 }),
], ConteneurController.updateConteneur);

router.delete('/:conteneurId', ConteneurController.deleteConteneur);

module.exports = router;
