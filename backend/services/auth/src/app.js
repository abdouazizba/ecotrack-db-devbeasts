const express = require('express');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// Import configuration
const sequelize = require('./config/database');

// Import models to register them
require('./models');

// Import middlewares
const {
  securityMiddleware,
  parsingMiddleware,
  errorHandler,
  notFound,
} = require('./middlewares');

// Import routes
const { authRoutes } = require('./routes');

// Import seed data
const { seedAuthDatabase } = require('./seeds/seed');

const app = express();

// Port configuration
const PORT = process.env.SERVER_PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Security and parsing middlewares
app.use(...securityMiddleware);
app.use(...parsingMiddleware);
app.use(cookieParser());

// Health routes
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'auth-service' });
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Handle not found routes
app.use(notFound);

// Centralized error handling
app.use(errorHandler);

// Initialize database and start server
const startServer = async () => {
  try {
    // Authenticate and sync database
    await sequelize.authenticate();
    console.log('✓ Database connection successful');

    // Force synchronize database (create/update tables)
    await sequelize.sync({ alter: true, force: false });//cree ou modifie la base de donnee
    console.log('✓ Database tables synchronized');

    // Seed database with test data
    await seedAuthDatabase(sequelize);//remplie ma base de donnee

    // Start the server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n🚀 Auth Service started on port ${PORT}`);
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
