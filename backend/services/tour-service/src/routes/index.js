const express = require('express');
const tourneeRoutes = require('./tournee.routes');
const collecteurRoutes = require('./collecteur.routes');
const statsRoutes = require('./stats.routes');

const router = express.Router();

router.use('/tournees', tourneeRoutes);
router.use('/collecteurs', collecteurRoutes);
router.use('/stats', statsRoutes);
router.get('/health', (req, res) => {
  res.json({ status: 'Tour Service is running' });
});

module.exports = router;
