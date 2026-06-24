const Redis = require('ioredis');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let redis;
try {
  redis = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 1,
    connectTimeout: 3000,
    lazyConnect: true,
  });
  redis.connect().catch(() => {
    console.warn('⚠ Redis not available — rate limiting disabled (in-memory fallback)');
    redis = null;
  });
} catch {
  redis = null;
}

const memoryStore = new Map();
const MEMORY_CLEANUP_INTERVAL = 60000;
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memoryStore) {
    if (now > entry.resetAt) memoryStore.delete(key);
  }
}, MEMORY_CLEANUP_INTERVAL);

async function getRedisCount(key, windowMs) {
  if (!redis) return null;
  try {
    const multi = redis.multi();
    multi.incr(key);
    multi.pttl(key);
    const results = await multi.exec();
    const count = results[0][1];
    const ttl = results[1][1];
    if (ttl < 0) await redis.pexpire(key, windowMs);
    return count;
  } catch {
    return null;
  }
}

function getMemoryCount(key, windowMs) {
  const now = Date.now();
  let entry = memoryStore.get(key);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
    memoryStore.set(key, entry);
  }
  entry.count++;
  return entry.count;
}

function rateLimiter({ windowMs = 60000, max = 100, keyPrefix = 'rl', message = 'Too many requests', skip } = {}) {
  return async (req, res, next) => {
    if (skip && skip(req)) return next();

    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const key = `${keyPrefix}:${ip}`;

    let count = await getRedisCount(key, windowMs);
    if (count === null) count = getMemoryCount(key, windowMs);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - count));

    if (count > max) {
      return res.status(429).json({
        success: false,
        message,
        retryAfter: Math.ceil(windowMs / 1000),
      });
    }

    next();
  };
}

const isDev = process.env.NODE_ENV !== 'production';

const globalLimiter = rateLimiter({
  windowMs: 60000,
  max: isDev ? 5000 : 200,
  keyPrefix: 'rl:global',
  message: 'Too many requests — please slow down',
  skip: (req) =>
    req.path === '/health' ||
    req.path === '/api-docs' ||
    req.path === '/api/auth/login' ||
    req.path === '/api/auth/register',
});

const authLimiter = rateLimiter({
  windowMs: isDev ? 300000 : 900000,
  max: isDev ? 100 : 20,
  keyPrefix: 'rl:auth',
  message: 'Too many login attempts — try again later',
});

const strictLimiter = rateLimiter({
  windowMs: 60000,
  max: isDev ? 200 : 30,
  keyPrefix: 'rl:strict',
  message: 'Too many write requests',
});

module.exports = { rateLimiter, globalLimiter, authLimiter, strictLimiter };
