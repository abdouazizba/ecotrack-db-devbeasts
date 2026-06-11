const express = require('express');
const fs = require('fs');
const path = require('path');
const sequelize = require('./config/database');

// Import models to register them
require('./models');

const routes = require('./routes');
const { commonMiddleware, errorMiddleware } = require('./middlewares');

const { seedSignalDatabase } = require('./seeds/seed');
const SignalEventListener = require('./services/SignalEventListener');

const app = express();
const PORT = process.env.SERVER_PORT || 3004;

// Ensure upload directory exists
const UPLOAD_DIR = process.env.UPLOAD_DIR || '/app/uploads/signals';
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Middleware
commonMiddleware(app);

// Serve uploaded photos
app.use('/uploads/signals', express.static(UPLOAD_DIR));

// Routes
app.use('/api', routes);

// Health check — sequelize.authenticate() est async, on retourne le statut connu
let dbConnected = false;
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'signal-service',
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

if (require.main === module) {
  startServer();
}

module.exports = app;
