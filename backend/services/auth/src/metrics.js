const promClient = require('prom-client');

function setupMetrics(app, serviceName) {
  promClient.collectDefaultMetrics({
    prefix: 'ecotrack_',
    labels: { service: serviceName },
  });

  const httpDuration = new promClient.Histogram({
    name: 'ecotrack_http_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code', 'service'],
    buckets: [0.005, 0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  });

  const httpTotal = new promClient.Counter({
    name: 'ecotrack_http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code', 'service'],
  });

  const activeRequests = new promClient.Gauge({
    name: 'ecotrack_http_active_requests',
    help: 'Number of in-flight HTTP requests',
    labelNames: ['service'],
  });

  app.use((req, res, next) => {
    if (req.path === '/metrics' || req.path === '/health') return next();

    activeRequests.inc({ service: serviceName });
    const end = httpDuration.startTimer();

    res.on('finish', () => {
      const route = req.route?.path || req.baseUrl || req.path;
      const labels = {
        method: req.method,
        route,
        status_code: res.statusCode,
        service: serviceName,
      };
      end(labels);
      httpTotal.inc(labels);
      activeRequests.dec({ service: serviceName });
    });

    next();
  });

  app.get('/metrics', async (_req, res) => {
    res.set('Content-Type', promClient.register.contentType);
    res.end(await promClient.register.metrics());
  });

  return promClient;
}

module.exports = { setupMetrics };
