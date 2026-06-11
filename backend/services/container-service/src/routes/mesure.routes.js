const express = require('express');
const { body } = require('express-validator');
const { MesureController } = require('../controllers');
const { authenticate, authorize } = require('../middlewares/authorization.middleware');

const router = express.Router();

const STAFF_ROLES = ['admin', 'super_admin', 'agent'];

// Post mesures: staff (agents record collections, IoT goes through RabbitMQ events)
router.post('/', authenticate, authorize(STAFF_ROLES), [
  body('taux_remplissage').isFloat({ min: 0, max: 100 }),
  body('temperature').optional().isFloat(),
  body('batterie').optional().isInt({ min: 0, max: 100 }),
  body('signal_force').optional().isInt(),
  body('id_conteneur').notEmpty(),
], MesureController.createMesure);

// Read: staff
router.get('/conteneur/:conteneurId', authenticate, authorize(STAFF_ROLES), MesureController.getMesuresByConteneur);
router.get('/conteneur/:conteneurId/latest', authenticate, authorize(STAFF_ROLES), MesureController.getLatestMesure);
router.get('/conteneur/:conteneurId/range', authenticate, authorize(STAFF_ROLES), MesureController.getMesuresByDateRange);
router.get('/conteneur/:conteneurId/stats', authenticate, authorize(STAFF_ROLES), MesureController.getAverageFillRate);

module.exports = router;
