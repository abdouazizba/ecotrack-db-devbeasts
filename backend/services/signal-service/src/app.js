const express = require('express');
const sequelize = require('./config/database');

// Import models to register them
require('./models');

const routes = require('./routes');
const { commonMiddleware, errorMiddleware } = require('./middlewares');

const { seedSignalDatabase } = require('./seeds/seed');
const SignalEventListener = require('./services/SignalEventListener');

const app = express();
const PORT = process.env.SERVER_PORT || 3004;

// Middleware
commonMiddleware(app);

// Routes
app.use('/api', routes);

// Health check — sequelize.authenticate() est async, on retourne le statut connu
let dbConnected = false;
app.get('/health', (req, res) => {
  res.status(dbConnected ? 200 : 503).json({
    status: dbConnected ? 'Signal Service is running' : 'Signal Service starting',
    timestamp: new Date().toISOString(),
    database: dbConnected ? 'Connected' : 'Disconnected',
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

const startServer = async () => {
  try {
    await sequelize.authenticate();
    dbConnected = true;
    console.log('✓ Signal Database connected successfully');

    await sequelize.sync({ alter: true, force: false });
    console.log('✓ Signal Database tables synchronized');

    await seedSignalDatabase(sequelize);

    await SignalEventListener.initialize(sequelize);

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n🚀 Signal Service started on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 URL: http://localhost:${PORT}\n`);
    });
  } catch (error) {
    console.error('✗ Startup error:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
