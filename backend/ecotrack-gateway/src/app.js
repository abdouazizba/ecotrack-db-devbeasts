require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const axios = require('axios');

const app = express();
const PORT = process.env.GATEWAY_PORT || 3000;

// Service URLs
const SERVICES = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  container: process.env.CONTAINER_SERVICE_URL || 'http://localhost:3002',
  tour: process.env.TOUR_SERVICE_URL || 'http://localhost:3003',
  signal: process.env.SIGNAL_SERVICE_URL || 'http://localhost:3004',
};

// ============ MIDDLEWARE ============

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  optionsSuccessStatus: 200,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  
  next();
});

// ============ HEALTH CHECK ============

app.get('/health', async (req, res) => {
  try {
    const serviceHealth = {};
    
    // Check each service health
    for (const [name, url] of Object.entries(SERVICES)) {
      try {
        await axios.get(`${url}/health`, { timeout: 3000 });
        serviceHealth[name] = 'healthy';
      } catch (error) {
        serviceHealth[name] = 'unhealthy';
      }
    }

    const allHealthy = Object.values(serviceHealth).every(s => s === 'healthy');
    
    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      services: serviceHealth,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

// ============ PROXY FUNCTION ============

const proxyRequest = async (req, res, serviceUrl) => {
  try {
    const config = {
      method: req.method,
      url: `${serviceUrl}${req.path}`,
      headers: {
        ...req.headers,
        'host': new URL(serviceUrl).host, // Update host header
      },
      data: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
      timeout: 30000,
    };

    // Forward the request to the service
    const response = await axios(config);
    
    // Return the response
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      // Service returned an error
      res.status(error.response.status).json(error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      res.status(503).json({
        success: false,
        message: 'Service unavailable',
        error: 'Cannot connect to service',
      });
    } else if (error.code === 'ENOTFOUND') {
      res.status(503).json({
        success: false,
        message: 'Service not found',
        error: 'DNS resolution failed',
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Gateway error',
        error: error.message,
      });
    }
  }
};

// ============ ROUTES - AUTH SERVICE ============

app.post('/api/auth/register', (req, res) => proxyRequest(req, res, SERVICES.auth));
app.post('/api/auth/login', (req, res) => proxyRequest(req, res, SERVICES.auth));
app.post('/api/auth/refresh', (req, res) => proxyRequest(req, res, SERVICES.auth));
app.get('/api/users', (req, res) => proxyRequest(req, res, SERVICES.auth));
app.get('/api/users/:id', (req, res) => proxyRequest(req, res, SERVICES.auth));
app.put('/api/users/:id', (req, res) => proxyRequest(req, res, SERVICES.auth));
app.delete('/api/users/:id', (req, res) => proxyRequest(req, res, SERVICES.auth));

// ============ ROUTES - CONTAINER SERVICE ============

app.get('/api/zones', (req, res) => proxyRequest(req, res, SERVICES.container));
app.post('/api/zones', (req, res) => proxyRequest(req, res, SERVICES.container));
app.get('/api/zones/:id', (req, res) => proxyRequest(req, res, SERVICES.container));
app.put('/api/zones/:id', (req, res) => proxyRequest(req, res, SERVICES.container));
app.delete('/api/zones/:id', (req, res) => proxyRequest(req, res, SERVICES.container));

app.get('/api/conteneurs', (req, res) => proxyRequest(req, res, SERVICES.container));
app.post('/api/conteneurs', (req, res) => proxyRequest(req, res, SERVICES.container));
app.get('/api/conteneurs/needing-service', (req, res) => proxyRequest(req, res, SERVICES.container));
app.get('/api/conteneurs/:id', (req, res) => proxyRequest(req, res, SERVICES.container));
app.put('/api/conteneurs/:id', (req, res) => proxyRequest(req, res, SERVICES.container));
app.delete('/api/conteneurs/:id', (req, res) => proxyRequest(req, res, SERVICES.container));

app.get('/api/mesures', (req, res) => proxyRequest(req, res, SERVICES.container));
app.post('/api/mesures', (req, res) => proxyRequest(req, res, SERVICES.container));
app.get('/api/mesures/container/:containerId', (req, res) => proxyRequest(req, res, SERVICES.container));
app.get('/api/mesures/analytics/average-fill', (req, res) => proxyRequest(req, res, SERVICES.container));

// ============ ROUTES - TOUR SERVICE ============

app.get('/api/tournees', (req, res) => proxyRequest(req, res, SERVICES.tour));
app.post('/api/tournees', (req, res) => proxyRequest(req, res, SERVICES.tour));
app.get('/api/tournees/:id', (req, res) => proxyRequest(req, res, SERVICES.tour));
app.put('/api/tournees/:id', (req, res) => proxyRequest(req, res, SERVICES.tour));
app.delete('/api/tournees/:id', (req, res) => proxyRequest(req, res, SERVICES.tour));
app.get('/api/tournees/agent/:agentId', (req, res) => proxyRequest(req, res, SERVICES.tour));
app.post('/api/tournees/:id/agents', (req, res) => proxyRequest(req, res, SERVICES.tour));
app.delete('/api/tournees/:id/agents/:agentId', (req, res) => proxyRequest(req, res, SERVICES.tour));
app.get('/api/tournees/:id/stats', (req, res) => proxyRequest(req, res, SERVICES.tour));

app.get('/api/collecteurs', (req, res) => proxyRequest(req, res, SERVICES.tour));
app.post('/api/collecteurs', (req, res) => proxyRequest(req, res, SERVICES.tour));
app.get('/api/collecteurs/:id', (req, res) => proxyRequest(req, res, SERVICES.tour));
app.get('/api/collecteurs/agent/:agentId', (req, res) => proxyRequest(req, res, SERVICES.tour));
app.get('/api/collecteurs/low-battery', (req, res) => proxyRequest(req, res, SERVICES.tour));
app.put('/api/collecteurs/:id', (req, res) => proxyRequest(req, res, SERVICES.tour));
app.delete('/api/collecteurs/:id', (req, res) => proxyRequest(req, res, SERVICES.tour));
app.post('/api/collecteurs/:id/maintenance', (req, res) => proxyRequest(req, res, SERVICES.tour));

// ============ ROUTES - SIGNAL SERVICE ============

app.get('/api/signalements', (req, res) => proxyRequest(req, res, SERVICES.signal));
app.post('/api/signalements', (req, res) => proxyRequest(req, res, SERVICES.signal));
app.get('/api/signalements/open', (req, res) => proxyRequest(req, res, SERVICES.signal));
app.get('/api/signalements/:id', (req, res) => proxyRequest(req, res, SERVICES.signal));
app.put('/api/signalements/:id', (req, res) => proxyRequest(req, res, SERVICES.signal));
app.delete('/api/signalements/:id', (req, res) => proxyRequest(req, res, SERVICES.signal));
app.get('/api/signalements/citoyen/:citoyenId', (req, res) => proxyRequest(req, res, SERVICES.signal));
app.get('/api/signalements/container/:containerId', (req, res) => proxyRequest(req, res, SERVICES.signal));
app.post('/api/signalements/:id/in-progress', (req, res) => proxyRequest(req, res, SERVICES.signal));
app.post('/api/signalements/:id/close', (req, res) => proxyRequest(req, res, SERVICES.signal));
app.post('/api/signalements/:id/reject', (req, res) => proxyRequest(req, res, SERVICES.signal));

// ============ ERROR HANDLING ============

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.path,
    method: req.method,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Server error',
  });
});

// ============ START SERVER ============

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔═══════════════════════════════════════╗
║   EcoTrack API Gateway                ║
║   Port: ${PORT}                       ║
║   Status: RUNNING                     ║
║   ABDOU AZIZ BA                       ║
║   GALDY                               ║
╚═══════════════════════════════════════╝
  `);
  
  console.log('Services configured:');
  Object.entries(SERVICES).forEach(([name, url]) => {
    console.log(`  ✓ ${name}: ${url}`);
  });
});

module.exports = app;
