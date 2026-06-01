const express = require('express');
const SignalStatsController = require('../controllers/signal-stats.controller');

const router = express.Router();

router.get('/dashboard', SignalStatsController.getDashboardStats);
router.get('/total', SignalStatsController.getTotalSignals);
router.get('/open', SignalStatsController.getOpenSignals);
router.get('/breakdown/status', SignalStatsController.getSignalStatusBreakdown);
router.get('/breakdown/priority', SignalStatsController.getSignalByPriority);

module.exports = router;
