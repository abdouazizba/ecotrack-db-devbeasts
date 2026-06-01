require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const iotRoutes = require('./routes/iot.routes');
const errorMiddleware = require('./middlewares/error');
const EventService = require('./services/EventService');
const IoTMeasurementSimulator = require('./services/IoTMeasurementSimulator');

const app = express();
const PORT = process.env.PORT || 3006;
const SERVICE_NAME = 'iot-service';

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/iot', iotRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: SERVICE_NAME,
    timestamp: new Date().toISOString(),
    container_service: process.env.CONTAINER_SERVICE_URL
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    method: req.method,
    path: req.path
  });
});

// Error middleware
app.use(errorMiddleware);

// Initialize RabbitMQ EventService
const initializeEventService = async () => {
  await EventService.initialize();
};

// Initialize IoT Measurement Simulator (cron job)
let measurementSimulator;
const initializeMeasurementSimulator = async () => {
  try {
    const containerServiceUrl = process.env.CONTAINER_SERVICE_URL || 'http://localhost:3002';
    measurementSimulator = new IoTMeasurementSimulator(containerServiceUrl);
    
    // Start the simulator (it will run every 30 seconds)
    if (process.env.IOT_SIMULATOR_ENABLED !== 'false') {
      await measurementSimulator.start();
    }
  } catch (error) {
    console.warn('⚠️  IoT Simulator initialization failed (non-critical):', error.message);
    console.warn('Continuing without automatic measurement generation...');
  }
};

// Expose simulator stats endpoint for monitoring
app.get('/api/iot/simulator/stats', (req, res) => {
  if (!measurementSimulator) {
    return res.status(503).json({ error: 'Simulator not initialized' });
  }
  res.json(measurementSimulator.getStats());
});

// Start server
app.listen(PORT, async () => {
  console.log(`✓ ${SERVICE_NAME} running on port ${PORT}`);
  console.log(`✓ Container Service URL: ${process.env.CONTAINER_SERVICE_URL}`);
  console.log(`✓ API Key required: ${process.env.API_KEY_REQUIRED === 'true' ? 'YES' : 'NO'}`);
  console.log(`✓ IoT Simulator: ${process.env.IOT_SIMULATOR_ENABLED !== 'false' ? 'ENABLED' : 'DISABLED'}\n`);
  
  // Initialize event service after server starts
  await initializeEventService();
  
  // Initialize IoT measurement simulator (cron job)
  await initializeMeasurementSimulator();
});

module.exports = app;
