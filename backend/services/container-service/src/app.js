const express = require('express');
require('dotenv').config();

const { QueryTypes } = require('sequelize');
const sequelize = require('./config/database');

// Import models to register them with sequelize
require('./models');

const {
  securityMiddleware,
  parsingMiddleware,
  rateLimiter,
  errorHandler,
  notFound,
} = require('./middlewares');

const { zoneRoutes, conteneurRoutes, capteurRoutes, mesureRoutes, statsRoutes } = require('./routes');

// Import seed data
const { seedMassiveData } = require('./seeds/seed-massive');
const { seedContainerDatabase } = require('./seeds/seed');
const ContainerEventListener = require('./services/ContainerEventListener');
const ArchiveService = require('./services/ArchiveService');

const { setupMetrics } = require('./metrics');

const app = express();
const PORT = process.env.SERVER_PORT || 3002;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Prometheus metrics — before other middleware
setupMetrics(app, 'container-service');

// Security and parsing
app.use(...securityMiddleware);
app.use(...parsingMiddleware);
app.use(rateLimiter);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'container-service' });
});

// API routes
app.use('/api/zones', zoneRoutes);
app.use('/api/conteneurs', conteneurRoutes);
app.use('/api/capteurs', capteurRoutes);
app.use('/api/mesures', mesureRoutes);
app.use('/api/stats', statsRoutes);

// Internal endpoints for inter-service communication — no auth, internal network only
app.get('/internal/containers', async (req, res) => {
  try {
    const rows = await sequelize.query(
      'SELECT id, id_zone, code_conteneur, latitude, longitude FROM conteneurs ORDER BY created_at ASC LIMIT 200',
      { type: QueryTypes.SELECT }
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/internal/capteurs', async (req, res) => {
  try {
    const rows = await sequelize.query(
      'SELECT id, code_capteur, type, statut, batterie, id_conteneur FROM capteurs ORDER BY created_at ASC',
      { type: QueryTypes.SELECT }
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/internal/containers/:id', async (req, res) => {
  try {
    const rows = await sequelize.query(
      'SELECT id, id_zone, code_conteneur, latitude, longitude FROM conteneurs WHERE id = $1 LIMIT 1',
      { bind: [req.params.id], type: QueryTypes.SELECT }
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 404 and error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connection successful');

    // Force synchronize database (create/update tables)
    await sequelize.sync({ alter: true, force: false });
    console.log('✓ Database tables synchronized');

    // Seed database with MASSIVE test data (2000 containers)
    // Change to seedContainerDatabase() for small test set
    await seedMassiveData(sequelize);

    // Initialize event listeners for RabbitMQ events
    await ContainerEventListener.initialize(sequelize);

    // Start archive scheduler (mesures > 90 days → mesures_archive, runs every 24h)
    ArchiveService.startScheduler();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n🚀 Container Service started on port ${PORT}`);
      console.log(`📊 Environment: ${NODE_ENV}`);
      console.log(`🔗 URL: http://localhost:${PORT}\n`);
    });
  } catch (error) {
    console.error('✗ Startup error:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = app;
