require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const axios = require('axios');
const http = require('http');
const fs = require('fs');
const path = require('path');
const yaml = require('yaml');
const swaggerUi = require('swagger-ui-express');

const { setupMetrics } = require('./metrics');
const { globalLimiter, authLimiter, strictLimiter } = require('./rateLimiter');

const app = express();
const PORT = process.env.GATEWAY_PORT || 3000;

// Prometheus metrics — must be before routes
setupMetrics(app, 'gateway');

// Service URLs
const SERVICES = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  container: process.env.CONTAINER_SERVICE_URL || 'http://localhost:3002',
  tour: process.env.TOUR_SERVICE_URL || 'http://localhost:3003',
  signal: process.env.SIGNAL_SERVICE_URL || 'http://localhost:3004',
  iot: process.env.IOT_SERVICE_URL || 'http://localhost:3006',
  user: process.env.USER_SERVICE_URL || 'http://localhost:3005',
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

// Rate limiting — global (200 req/min per IP)
app.use(globalLimiter);

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

// ============ SWAGGER API DOCUMENTATION ============

try {
  const swaggerFile = fs.readFileSync(path.join(__dirname, '../../swagger.yaml'), 'utf8');
  const swaggerDoc = yaml.parse(swaggerFile);

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'EcoTrack API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
      tagsSorter: 'alpha',
    },
  }));

  app.get('/swagger-spec', (req, res) => {
    res.json(swaggerDoc);
  });

  console.log('✓ Swagger UI available at http://localhost:3000/api-docs');
} catch (err) {
  console.warn('⚠ Swagger UI configuration failed:', err.message);
}

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

// ============ PROXY FUNCTIONS ============

// Pipe raw request stream to target — required for multipart/form-data (file uploads)
const pipeMultipartRequest = (req, res, serviceUrl) => {
  const target = new URL(`${serviceUrl}${req.path}`);
  const queryString = new URLSearchParams(req.query).toString();
  const targetPath = queryString ? `${target.pathname}?${queryString}` : target.pathname;

  const proxyReq = http.request(
    {
      method: req.method,
      hostname: target.hostname,
      port: parseInt(target.port) || 80,
      path: targetPath,
      headers: { ...req.headers, host: target.host },
    },
    (proxyRes) => {
      let body = '';
      proxyRes.on('data', (chunk) => { body += chunk; });
      proxyRes.on('end', () => {
        try {
          res.status(proxyRes.statusCode).json(JSON.parse(body));
        } catch {
          res.status(proxyRes.statusCode).send(body);
        }
      });
    }
  );

  proxyReq.on('error', (err) => {
    if (err.code === 'ECONNREFUSED') {
      res.status(503).json({ success: false, message: 'Service unavailable' });
    } else {
      res.status(502).json({ success: false, message: 'Bad gateway', error: err.message });
    }
  });

  req.pipe(proxyReq);
};

const proxyRequest = async (req, res, serviceUrl, pathOverride) => {
  try {
    const targetPath = pathOverride || req.path;
    const fwdHeaders = {
      host: new URL(serviceUrl).host,
      'content-type': req.headers['content-type'] || 'application/json',
    };
    if (req.headers.authorization) fwdHeaders.authorization = req.headers.authorization;
    if (req.headers.accept)        fwdHeaders.accept = req.headers.accept;

    const config = {
      method: req.method,
      url: `${serviceUrl}${targetPath}`,
      params: req.query,
      headers: fwdHeaders,
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

app.post('/api/auth/register', authLimiter, (req, res) => proxyRequest(req, res, SERVICES.auth));
app.post('/api/auth/login', authLimiter, (req, res) => proxyRequest(req, res, SERVICES.auth));
app.post('/api/auth/logout', (req, res) => proxyRequest(req, res, SERVICES.auth));
app.post('/api/auth/verify', (req, res) => proxyRequest(req, res, SERVICES.auth));
app.post('/api/auth/refresh-token', (req, res) => proxyRequest(req, res, SERVICES.auth));
app.post('/api/auth/refresh', (req, res) => proxyRequest(req, res, SERVICES.auth));
app.get('/api/auth/me', (req, res) => proxyRequest(req, res, SERVICES.auth));

// ============ ROUTES - USER SERVICE ============

app.get('/api/users', (req, res) => proxyRequest(req, res, SERVICES.user));
app.get('/api/users/me', (req, res) => proxyRequest(req, res, SERVICES.user));
// Static sub-routes before /:id to avoid capture by the dynamic param
app.get('/api/users/:id/profile', (req, res) => proxyRequest(req, res, SERVICES.user));
app.put('/api/users/:id/role', (req, res) => proxyRequest(req, res, SERVICES.user));
app.get('/api/users/:id', (req, res) => proxyRequest(req, res, SERVICES.user));
app.put('/api/users/:id', (req, res) => proxyRequest(req, res, SERVICES.user));
app.delete('/api/users/:id', strictLimiter, (req, res) => proxyRequest(req, res, SERVICES.user));

// POST /api/users → admin user creation via auth service register
app.post('/api/users', async (req, res) => {
  try {
    const response = await axios({
      method: 'POST',
      url: `${SERVICES.auth}/api/auth/register`,
      data: req.body,
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers.authorization ? { Authorization: req.headers.authorization } : {}),
      },
      timeout: 30000,
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      res.status(503).json({ success: false, message: 'Auth service unavailable' });
    } else {
      res.status(500).json({ success: false, message: 'Gateway error', error: error.message });
    }
  }
});

// ============ ROUTES - CONTAINER SERVICE ============

app.get('/api/zones', (req, res) => proxyRequest(req, res, SERVICES.container));
app.post('/api/zones', (req, res) => proxyRequest(req, res, SERVICES.container));
app.get('/api/zones/:id', (req, res) => proxyRequest(req, res, SERVICES.container));
app.put('/api/zones/:id', (req, res) => proxyRequest(req, res, SERVICES.container));
app.delete('/api/zones/:id', (req, res) => proxyRequest(req, res, SERVICES.container));

app.get('/api/conteneurs', (req, res) => proxyRequest(req, res, SERVICES.container));
app.post('/api/conteneurs', (req, res) => proxyRequest(req, res, SERVICES.container));
// Routes statiques avant /:id pour éviter la capture par le param dynamique
app.get('/api/conteneurs/needs-service', (req, res) => proxyRequest(req, res, SERVICES.container));
app.get('/api/conteneurs/nearby', (req, res) => proxyRequest(req, res, SERVICES.container));
app.get('/api/conteneurs/:id', (req, res) => proxyRequest(req, res, SERVICES.container));
app.put('/api/conteneurs/:id', (req, res) => proxyRequest(req, res, SERVICES.container));
app.delete('/api/conteneurs/:id', strictLimiter, (req, res) => proxyRequest(req, res, SERVICES.container));

// ============ ROUTES - CAPTEURS (via container-service) ============

app.post('/api/capteurs', (req, res) => proxyRequest(req, res, SERVICES.container));
app.get('/api/capteurs', (req, res) => proxyRequest(req, res, SERVICES.container));
app.get('/api/capteurs/conteneur/:conteneurId', (req, res) => proxyRequest(req, res, SERVICES.container));
app.get('/api/capteurs/:id', (req, res) => proxyRequest(req, res, SERVICES.container));
app.put('/api/capteurs/:id', (req, res) => proxyRequest(req, res, SERVICES.container));
app.delete('/api/capteurs/:id', (req, res) => proxyRequest(req, res, SERVICES.container));
app.patch('/api/capteurs/:id/conteneur', (req, res) => proxyRequest(req, res, SERVICES.container));
app.patch('/api/capteurs/:id/batterie', (req, res) => proxyRequest(req, res, SERVICES.container));

// GET /api/iot/device/:capteur_id → résolu via container-service
app.get('/api/iot/device/:capteur_id', async (req, res) => {
  try {
    const response = await axios({
      method: 'GET',
      url: `${SERVICES.container}/api/capteurs/${req.params.capteur_id}`,
      headers: { ...req.headers, host: new URL(SERVICES.container).host },
      timeout: 10000,
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(503).json({ success: false, message: 'Container service unavailable' });
    }
  }
});

app.get('/api/mesures', (req, res) => proxyRequest(req, res, SERVICES.container));
app.post('/api/mesures', (req, res) => proxyRequest(req, res, SERVICES.container));
app.get('/api/mesures/container/:containerId', (req, res) => proxyRequest(req, res, SERVICES.container));
app.get('/api/mesures/analytics/average-fill', (req, res) => proxyRequest(req, res, SERVICES.container));

// Container stats — rewrite /api/container-stats/* → /api/stats/* for container-service
app.get('/api/container-stats/dashboard', (req, res) => proxyRequest(req, res, SERVICES.container, '/api/stats/dashboard'));
app.get('/api/container-stats/breakdown/status', (req, res) => proxyRequest(req, res, SERVICES.container, '/api/stats/breakdown/status'));
app.get('/api/container-stats/breakdown/type', (req, res) => proxyRequest(req, res, SERVICES.container, '/api/stats/breakdown/type'));

// ============ ROUTES - TOUR SERVICE ============

app.get('/api/tournees', (req, res) => proxyRequest(req, res, SERVICES.tour));
app.post('/api/tournees', (req, res) => proxyRequest(req, res, SERVICES.tour));
// Static sub-routes BEFORE /:id to avoid route collision
app.get('/api/tournees/agent/:agentId', (req, res) => proxyRequest(req, res, SERVICES.tour));
app.get('/api/tournees/:id', (req, res) => proxyRequest(req, res, SERVICES.tour));
app.put('/api/tournees/:id', (req, res) => proxyRequest(req, res, SERVICES.tour));
app.delete('/api/tournees/:id', (req, res) => proxyRequest(req, res, SERVICES.tour));
app.post('/api/tournees/:id/agents', (req, res) => proxyRequest(req, res, SERVICES.tour));
app.delete('/api/tournees/:id/agents/:agentId', (req, res) => proxyRequest(req, res, SERVICES.tour));
app.patch('/api/tournees/:id/statut', (req, res) => proxyRequest(req, res, SERVICES.tour));
app.get('/api/tournees/:id/stats', (req, res) => proxyRequest(req, res, SERVICES.tour));

// GET /api/tournees/:id/signalements → list signalements for this tour (signal-service)
app.get('/api/tournees/:id/signalements', async (req, res) => {
  try {
    const response = await axios({
      method: 'GET',
      url: `${SERVICES.signal}/api/signalements/tournee/${req.params.id}`,
      headers: {
        ...(req.headers.authorization ? { Authorization: req.headers.authorization } : {}),
      },
      timeout: 10000,
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      res.status(503).json({ success: false, message: 'Signal service unavailable' });
    } else {
      res.status(500).json({ success: false, message: 'Gateway error', error: error.message });
    }
  }
});

// POST /api/tournees/:tourneeId/signalements → forward to signal-service
app.post('/api/tournees/:tourneeId/signalements', async (req, res) => {
  try {
    const response = await axios({
      method: 'POST',
      url: `${SERVICES.signal}/api/signalements`,
      data: { ...req.body, id_tournee: req.params.tourneeId },
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers.authorization ? { Authorization: req.headers.authorization } : {}),
      },
      timeout: 30000,
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      res.status(503).json({ success: false, message: 'Signal service unavailable' });
    } else {
      res.status(500).json({ success: false, message: 'Gateway error', error: error.message });
    }
  }
});

app.get('/api/vehicules', (req, res) => proxyRequest(req, res, SERVICES.tour));
app.post('/api/vehicules', (req, res) => proxyRequest(req, res, SERVICES.tour));
app.get('/api/vehicules/maintenance-due', (req, res) => proxyRequest(req, res, SERVICES.tour));
app.get('/api/vehicules/agent/:agentId', (req, res) => proxyRequest(req, res, SERVICES.tour));
app.get('/api/vehicules/:id', (req, res) => proxyRequest(req, res, SERVICES.tour));
app.put('/api/vehicules/:id', (req, res) => proxyRequest(req, res, SERVICES.tour));
app.delete('/api/vehicules/:id', (req, res) => proxyRequest(req, res, SERVICES.tour));
app.post('/api/vehicules/:id/maintenance', (req, res) => proxyRequest(req, res, SERVICES.tour));

// Tour stats — rewrite /api/tour-stats/* → /api/stats/* for tour-service
app.get('/api/tour-stats/dashboard', (req, res) => proxyRequest(req, res, SERVICES.tour, '/api/stats/dashboard'));
app.get('/api/tour-stats/in-progress', (req, res) => proxyRequest(req, res, SERVICES.tour, '/api/stats/in-progress'));
app.get('/api/tour-stats/completed', (req, res) => proxyRequest(req, res, SERVICES.tour, '/api/stats/completed'));
app.get('/api/tour-stats/breakdown/status', (req, res) => proxyRequest(req, res, SERVICES.tour, '/api/stats/breakdown/status'));

// ============ ROUTES - SIGNAL SERVICE ============

app.get('/api/signalements', (req, res) => proxyRequest(req, res, SERVICES.signal));
app.post('/api/signalements', (req, res) => proxyRequest(req, res, SERVICES.signal));
app.get('/api/signalements/open', (req, res) => proxyRequest(req, res, SERVICES.signal));
app.post('/api/signalements/auto-assign', (req, res) => proxyRequest(req, res, SERVICES.signal));
// Static sub-routes BEFORE /:id to avoid route collision
app.get('/api/signalements/citoyen/:citoyenId', (req, res) => proxyRequest(req, res, SERVICES.signal));
app.get('/api/signalements/container/:containerId', (req, res) => proxyRequest(req, res, SERVICES.signal));
app.get('/api/signalements/tournee/:tourneeId', (req, res) => proxyRequest(req, res, SERVICES.signal));
// Dynamic :id routes after static sub-routes
app.get('/api/signalements/:id', (req, res) => proxyRequest(req, res, SERVICES.signal));
app.put('/api/signalements/:id', (req, res) => proxyRequest(req, res, SERVICES.signal));
app.delete('/api/signalements/:id', (req, res) => proxyRequest(req, res, SERVICES.signal));
app.patch('/api/signalements/:id/tournee', (req, res) => proxyRequest(req, res, SERVICES.signal));
app.post('/api/signalements/:id/in-progress', (req, res) => proxyRequest(req, res, SERVICES.signal));
// close uses multipart/form-data (photo obligatoire) → pipe raw stream
app.post('/api/signalements/:id/close', (req, res) => pipeMultipartRequest(req, res, SERVICES.signal));
app.post('/api/signalements/:id/photo', (req, res) => pipeMultipartRequest(req, res, SERVICES.signal));
app.post('/api/signalements/:id/reject', (req, res) => proxyRequest(req, res, SERVICES.signal));

// Serve uploaded signal photos — proxy to signal-service static files
app.get('/uploads/signals/:filename', (req, res) => {
  proxyRequest(req, res, SERVICES.signal);
});

// Signal stats — rewrite /api/signal-stats/* → /api/stats/* for signal-service
app.get('/api/signal-stats/dashboard', (req, res) => proxyRequest(req, res, SERVICES.signal, '/api/stats/dashboard'));
app.get('/api/signal-stats/open', (req, res) => proxyRequest(req, res, SERVICES.signal, '/api/stats/open'));
app.get('/api/signal-stats/breakdown/status', (req, res) => proxyRequest(req, res, SERVICES.signal, '/api/stats/breakdown/status'));
app.get('/api/signal-stats/breakdown/priority', (req, res) => proxyRequest(req, res, SERVICES.signal, '/api/stats/breakdown/priority'));

// ============ ROUTES - AGENT (user-service) ============

// Static sub-routes BEFORE /:id/zone to avoid collision
app.get('/api/agents/:id/zone/containers', (req, res) => proxyRequest(req, res, SERVICES.user));
app.get('/api/agents/:id/zone', (req, res) => proxyRequest(req, res, SERVICES.user));

// ============ ROUTES - IOT SERVICE ============

app.post('/api/iot/measure', (req, res) => proxyRequest(req, res, SERVICES.iot));
app.post('/api/iot/device/register', (req, res) => proxyRequest(req, res, SERVICES.iot));
// GET /api/iot/device/:capteur_id → handled above (custom handler → container-service)
app.get('/api/iot/status', (req, res) => proxyRequest(req, res, SERVICES.iot));

// ============ DASHBOARD STATS ============

app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const authHeader = req.headers.authorization ? { Authorization: req.headers.authorization } : {};
    const [containerStats, tourStats, signalStats] = await Promise.all([
      axios.get(`${SERVICES.container}/api/stats/dashboard`, { timeout: 5000, headers: authHeader }).catch(() => ({ data: { data: {} } })),
      axios.get(`${SERVICES.tour}/api/stats/dashboard`, { timeout: 5000, headers: authHeader }).catch(() => ({ data: { data: {} } })),
      axios.get(`${SERVICES.signal}/api/stats/dashboard`, { timeout: 5000, headers: authHeader }).catch(() => ({ data: { data: {} } })),
    ]);

    const aggregatedStats = {
      containers: containerStats.data?.data?.containers || 0,
      zones: containerStats.data?.data?.zones || 0,
      tours: tourStats.data?.data?.totalTours || 0,
      toursInProgress: tourStats.data?.data?.toursInProgress || 0,
      averageFillRate: containerStats.data?.data?.averageFillRate || 0,
      criticalContainers: containerStats.data?.data?.criticalContainers || 0,
      openSignals: signalStats.data?.data?.openSignals || 0,
      totalSignals: signalStats.data?.data?.totalSignals || 0,
      containerBreakdown: {
        status: containerStats.data?.data?.statusBreakdown || {},
        type: containerStats.data?.data?.typeBreakdown || {}
      },
      tourBreakdown: tourStats.data?.data?.statusBreakdown || {},
      signalBreakdown: {
        status: signalStats.data?.data?.statusBreakdown || {},
        priority: signalStats.data?.data?.priorityBreakdown || {}
      }
    };

    res.status(200).json({
      success: true,
      message: 'Dashboard statistics retrieved',
      timestamp: new Date().toISOString(),
      data: aggregatedStats
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard statistics',
      error: error.message
    });
  }
});

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
║   MOUNIB                              ║
║   VALENTIN                            ║
╚═══════════════════════════════════════╝
  `);
  
  console.log('Services configured:');
  Object.entries(SERVICES).forEach(([name, url]) => {
    console.log(`  ✓ ${name}: ${url}`);
  });
});

module.exports = app;
