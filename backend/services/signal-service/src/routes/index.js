const express = require('express');
const signalementRoutes = require('./signalement.routes');

const router = express.Router();

router.use('/signalements', signalementRoutes);
router.get('/health', (req, res) => {
  res.json({ status: 'Signal Service is running' });
});

module.exports = router;
