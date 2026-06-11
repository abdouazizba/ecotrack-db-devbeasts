const express = require('express');
const { StatsController } = require('../controllers');
const { authenticate, authorize } = require('../middlewares/authorization.middleware');

const router = express.Router();

const STAFF_ROLES = ['admin', 'super_admin', 'agent'];

router.get('/dashboard', authenticate, authorize(STAFF_ROLES), StatsController.getDashboardStats);
router.get('/containers', authenticate, authorize(STAFF_ROLES), StatsController.getTotalContainers);
router.get('/zones', authenticate, authorize(STAFF_ROLES), StatsController.getTotalZones);
router.get('/fill-rate', authenticate, authorize(STAFF_ROLES), StatsController.getAverageFillRate);
router.get('/critical', authenticate, authorize(STAFF_ROLES), StatsController.getCriticalContainers);
router.get('/breakdown/status', authenticate, authorize(STAFF_ROLES), StatsController.getContainerStatusBreakdown);
router.get('/breakdown/type', authenticate, authorize(STAFF_ROLES), StatsController.getContainerTypeBreakdown);

module.exports = router;
