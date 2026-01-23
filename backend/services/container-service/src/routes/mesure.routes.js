const express = require('express');
const { body } = require('express-validator');
const { MesureController } = require('../controllers');

const router = express.Router();

router.post('/', [
  body('taux_remplissage').isFloat({ min: 0, max: 100 }),
  body('temperature').optional().isFloat(),
  body('batterie').optional().isInt({ min: 0, max: 100 }),
  body('signal_force').optional().isInt(),
  body('id_conteneur').notEmpty(),
], MesureController.createMesure);

router.get('/conteneur/:conteneurId', MesureController.getMesuresByConteneur);

router.get('/conteneur/:conteneurId/latest', MesureController.getLatestMesure);

router.get('/conteneur/:conteneurId/range', MesureController.getMesuresByDateRange);

router.get('/conteneur/:conteneurId/stats', MesureController.getAverageFillRate);

module.exports = router;
