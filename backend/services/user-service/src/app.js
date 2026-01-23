const express = require('express');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const sequelize = require('./config/database');

// Import models to register them
require('./models');

const { userRoutes } = require('./routes');
const { seedUserDatabase } = require('./seeds/seed');

const app = express();
const PORT = process.env.SERVER_PORT || 3005;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/users', userRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'user-service',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'EcoTrack User Service',
    version: '1.0.0',
    status: 'running'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource does not exist',
    path: req.path
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    status: err.status || 500
  });
});

// Database synchronization and server start
async function start() {
  try {
    // Sync database (create tables if not exist)
    await sequelize.sync({ alter: true });
    console.log('Database synchronized successfully');

    // Seed database with test data
    await seedUserDatabase(sequelize);

    // Start server
    app.listen(PORT, () => {
      console.log(`User Service listening on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start service:', error);
    process.exit(1);
  }
}

start();

module.exports = app;
