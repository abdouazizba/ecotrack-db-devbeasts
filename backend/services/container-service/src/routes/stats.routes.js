const express = require('express');
const { StatsController } = require('../controllers');

const router = express.Router();

router.get('/dashboard', StatsController.getDashboardStats);
router.get('/containers', StatsController.getTotalContainers);
router.get('/zones', StatsController.getTotalZones);
router.get('/fill-rate', StatsController.getAverageFillRate);
router.get('/critical', StatsController.getCriticalContainers);
router.get('/breakdown/status', StatsController.getContainerStatusBreakdown);
router.get('/breakdown/type', StatsController.getContainerTypeBreakdown);

module.exports = router;
