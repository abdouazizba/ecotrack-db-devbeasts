const express = require('express');
const SignalStatsController = require('../controllers/signal-stats.controller');
const { authenticate, authorize } = require('../middlewares');

const router = express.Router();

const STAFF_ROLES = ['admin', 'super_admin', 'agent'];

router.get('/dashboard', authenticate, authorize(STAFF_ROLES), SignalStatsController.getDashboardStats);
router.get('/total', authenticate, authorize(STAFF_ROLES), SignalStatsController.getTotalSignals);
router.get('/open', authenticate, authorize(STAFF_ROLES), SignalStatsController.getOpenSignals);
router.get('/breakdown/status', authenticate, authorize(STAFF_ROLES), SignalStatsController.getSignalStatusBreakdown);
router.get('/breakdown/priority', authenticate, authorize(STAFF_ROLES), SignalStatsController.getSignalByPriority);

module.exports = router;
