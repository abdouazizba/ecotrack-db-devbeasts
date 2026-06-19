const express = require('express');
const AgentController = require('../controllers/agent.controller');
const { authenticate, requireOwnerOrAdmin } = require('../middlewares/auth.middleware');

const router = express.Router();

// NOTE: /:id/zone/containers MUST be defined before /:id/zone to avoid route collision
router.get('/:id/zone/containers', authenticate, requireOwnerOrAdmin, AgentController.getAgentZoneContainers);
router.get('/:id/zone', authenticate, requireOwnerOrAdmin, AgentController.getAgentZone);

module.exports = router;
