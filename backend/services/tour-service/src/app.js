const express = require('express');
const sequelize = require('./config/database');

// Import models to register them
require('./models');

const routes = require('./routes');
const { commonMiddleware, errorMiddleware } = require('./middlewares');

// Import seed data
const { seedTourneeDatabase } = require('./seeds/seed');
const TourEventListener = require('./services/TourEventListener');

const { setupMetrics } = require('./metrics');

const app = express();

// Prometheus metrics — before other middleware
setupMetrics(app, 'tour-service');

// Common middleware
commonMiddleware(app);

// Routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'tour-service',
    timestamp: new Date().toISOString(),
  });
});

// Error handling
app.use(errorMiddleware);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

const PORT = process.env.SERVER_PORT || 3003;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✓ Tour Database connected successfully');

    await sequelize.sync({ alter: true, force: false });
    console.log('✓ Tour Database tables synchronized');

    await seedTourneeDatabase(sequelize);
    await TourEventListener.initialize(sequelize);

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Tour Service listening on port ${PORT}`);
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
