const express = require('express');
const { body, param } = require('express-validator');
const { TourneeController } = require('../controllers');
const { authenticate, authorize } = require('../middlewares');

const router = express.Router();

const ADMIN_ROLES = ['admin', 'super_admin'];
const STAFF_ROLES = ['admin', 'super_admin', 'agent'];

const validateTourneeCreate = [
  body('code').optional().isString(),
  body('date').isISO8601().toDate().withMessage('Valid date is required'),
  body('statut').optional().isIn(['PLANIFIÉE', 'EN_COURS', 'TERMINÉE', 'ANNULÉE']),
  body('id_zone').optional().isUUID().withMessage('id_zone must be a valid UUID'),
];

const validateTourneeUpdate = [
  body('statut').optional().isIn(['PLANIFIÉE', 'EN_COURS', 'TERMINÉE', 'ANNULÉE']),
  body('heure_debut').optional().isISO8601(),
  body('heure_fin').optional().isISO8601(),
  body('distance_km').optional().isFloat({ min: 0 }),
  body('conteneurs_collectes').optional().isInt({ min: 0 }),
  body('id_zone').optional().isUUID().withMessage('id_zone must be a valid UUID'),
];

const validateAgentAssignment = [
  body('idAgent').isUUID().withMessage('Valid agent ID is required'),
  body('role').optional().isIn(['CONDUCTEUR', 'COLLECTEUR']),
];

// CRUD
router.post('/', authenticate, authorize(ADMIN_ROLES), validateTourneeCreate, TourneeController.createTournee);
router.get('/', authenticate, authorize(STAFF_ROLES), TourneeController.getTournees);
router.get('/:id', authenticate, authorize(STAFF_ROLES), param('id').isUUID(), TourneeController.getTourneeById);
router.put('/:id', authenticate, authorize(ADMIN_ROLES), param('id').isUUID(), validateTourneeUpdate, TourneeController.updateTournee);
router.delete('/:id', authenticate, authorize(ADMIN_ROLES), param('id').isUUID(), TourneeController.deleteTournee);

// Agent management
router.get('/agent/:agentId', authenticate, authorize(STAFF_ROLES), param('agentId').isUUID(), TourneeController.getTourneesByAgent);
router.post('/:id/agents', authenticate, authorize(ADMIN_ROLES), param('id').isUUID(), validateAgentAssignment, TourneeController.addAgentToTournee);
router.delete('/:id/agents/:agentId',
  authenticate, authorize(ADMIN_ROLES),
  param('id').isUUID(),
  param('agentId').isUUID(),
  TourneeController.removeAgentFromTournee
);

// Status update — agents can update status of their own tours
router.patch('/:id/statut',
  authenticate, authorize(STAFF_ROLES),
  param('id').isUUID(),
  body('statut').isIn(['PLANIFIÉE', 'EN_COURS', 'TERMINÉE', 'ANNULÉE']).withMessage('Valid status is required'),
  TourneeController.updateStatut
);

// Stats
router.get('/:id/stats', authenticate, authorize(STAFF_ROLES), param('id').isUUID(), TourneeController.getTourneeStats);

module.exports = router;
