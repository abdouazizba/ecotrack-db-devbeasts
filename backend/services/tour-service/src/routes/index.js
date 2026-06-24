const express = require('express');
const tourneeRoutes = require('./tournee.routes');
const vehiculeRoutes = require('./vehicule.routes');
const statsRoutes = require('./stats.routes');

const router = express.Router();

router.use('/tournees', tourneeRoutes);
router.use('/vehicules', vehiculeRoutes);
router.use('/stats', statsRoutes);
router.get('/health', (req, res) => {
  res.json({ status: 'Tour Service is running' });
});

module.exports = router;
