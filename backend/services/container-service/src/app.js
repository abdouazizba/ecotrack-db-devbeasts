const express = require('express');
require('dotenv').config();

const sequelize = require('./config/database');

// Import models to register them with sequelize
require('./models');

const {
  securityMiddleware,
  parsingMiddleware,
  errorHandler,
  notFound,
} = require('./middlewares');

const { zoneRoutes, conteneurRoutes, mesureRoutes } = require('./routes');

// Import seed data
const { seedContainerDatabase } = require('./seeds/seed');

const app = express();
const PORT = process.env.SERVER_PORT || 3002;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Security and parsing
app.use(...securityMiddleware);
app.use(...parsingMiddleware);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'container-service' });
});

// API routes
app.use('/api/zones', zoneRoutes);
app.use('/api/conteneurs', conteneurRoutes);
app.use('/api/mesures', mesureRoutes);

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

    // Seed database with test data
    await seedContainerDatabase(sequelize);

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

startServer();

module.exports = app;
