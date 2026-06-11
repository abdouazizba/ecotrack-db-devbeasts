const express = require('express');
const TourStatsController = require('../controllers/tour-stats.controller');
const { authenticate, authorize } = require('../middlewares');

const router = express.Router();

const STAFF_ROLES = ['admin', 'super_admin', 'agent'];

router.get('/dashboard', authenticate, authorize(STAFF_ROLES), TourStatsController.getDashboardStats);
router.get('/total', authenticate, authorize(STAFF_ROLES), TourStatsController.getTotalTours);
router.get('/in-progress', authenticate, authorize(STAFF_ROLES), TourStatsController.getToursInProgress);
router.get('/completed', authenticate, authorize(STAFF_ROLES), TourStatsController.getCompletedTours);
router.get('/breakdown/status', authenticate, authorize(STAFF_ROLES), TourStatsController.getTourStatusBreakdown);

module.exports = router;
