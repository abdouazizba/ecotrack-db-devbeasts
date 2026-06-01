const express = require('express');
const signalementRoutes = require('./signalement.routes');
const statsRoutes = require('./stats.routes');

const router = express.Router();

router.use('/signalements', signalementRoutes);
router.use('/stats', statsRoutes);
router.get('/health', (req, res) => {
  res.json({ status: 'Signal Service is running' });
});

module.exports = router;
