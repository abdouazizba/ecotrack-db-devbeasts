const helmet = require('helmet');
const cors = require('cors');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
  optionsSuccessStatus: 200,
};

// Security middleware
const securityMiddleware = [
  helmet(),
  cors(corsOptions),
];

// Parsing middleware
const parsingMiddleware = [
  bodyParser.json({ limit: '10mb' }),
  bodyParser.urlencoded({ limit: '10mb', extended: true }),
];

const isDev = process.env.NODE_ENV !== 'production';

// General rate limit: relaxed in dev, strict in prod
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 2000 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// Auth rate limit: relaxed in dev, strict in prod
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 500 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again later.' },
});

module.exports = {
  securityMiddleware,
  parsingMiddleware,
  corsOptions,
  rateLimiter,
  authRateLimiter,
};
