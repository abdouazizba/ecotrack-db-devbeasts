const express = require('express');
const sequelize = require('./config/database');

// Import models to register them
require('./models');

const routes = require('./routes');
const { commonMiddleware, errorMiddleware } = require('./middlewares');

// Import seed data
const { seedTourDatabase } = require('./seeds/seed');

const app = express();

// Initialize database connection
sequelize.authenticate()
  .then(() => {
    console.log('✓ Tour Database connected successfully');
  })
  .catch((error) => {
    console.error('✗ Unable to connect to the database:', error);
  });

// Force synchronize database (create/update tables)
sequelize.sync({ alter: true, force: false })
  .then(async () => {
    console.log('✓ Tour Database tables synchronized');
    // Seed database with test data
    await seedTourDatabase(sequelize);
  })
  .catch((error) => {
    console.error('✗ Error syncing database:', error);
  });

// Common middleware
commonMiddleware(app);

// Routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'Tour Service is running',
    timestamp: new Date().toISOString(),
    database: sequelize.authenticate() ? 'Connected' : 'Disconnected',
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Tour Service listening on port ${PORT}`);
});

module.exports = app;
