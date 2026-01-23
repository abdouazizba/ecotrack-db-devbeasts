const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { TourneeController } = require('../controllers');

const router = express.Router();

// Validation rules
const validateTourneeCreate = [
  body('code').isString().notEmpty().withMessage('Code is required'),
  body('date').isISO8601().toDate().withMessage('Valid date is required'),
  body('statut').optional().isIn(['PLANIFIÉE', 'EN_COURS', 'TERMINÉE', 'ANNULÉE']),
];

const validateTourneeUpdate = [
  body('statut').optional().isIn(['PLANIFIÉE', 'EN_COURS', 'TERMINÉE', 'ANNULÉE']),
  body('heure_debut').optional().isISO8601(),
  body('heure_fin').optional().isISO8601(),
  body('distance_km').optional().isFloat({ min: 0 }),
  body('conteneurs_collectes').optional().isInt({ min: 0 }),
];

const validateAgentAssignment = [
  body('idAgent').isUUID().withMessage('Valid agent ID is required'),
  body('role').optional().isIn(['CONDUCTEUR', 'COLLECTEUR']),
];

// Routes
router.post('/', validateTourneeCreate, TourneeController.createTournee);
router.get('/', TourneeController.getTournees);
router.get('/:id', param('id').isUUID(), TourneeController.getTourneeById);
router.put('/:id', param('id').isUUID(), validateTourneeUpdate, TourneeController.updateTournee);
router.delete('/:id', param('id').isUUID(), TourneeController.deleteTournee);

// Agent routes
router.get('/agent/:agentId', param('agentId').isUUID(), TourneeController.getTourneesByAgent);
router.post('/:id/agents', param('id').isUUID(), validateAgentAssignment, TourneeController.addAgentToTournee);
router.delete('/:id/agents/:agentId', 
  param('id').isUUID(), 
  param('agentId').isUUID(), 
  TourneeController.removeAgentFromTournee
);

// Stats route
router.get('/:id/stats', param('id').isUUID(), TourneeController.getTourneeStats);

module.exports = router;
