const express = require('express');
const TourStatsController = require('../controllers/tour-stats.controller');

const router = express.Router();

router.get('/dashboard', TourStatsController.getDashboardStats);
router.get('/total', TourStatsController.getTotalTours);
router.get('/in-progress', TourStatsController.getToursInProgress);
router.get('/completed', TourStatsController.getCompletedTours);
router.get('/breakdown/status', TourStatsController.getTourStatusBreakdown);

module.exports = router;
