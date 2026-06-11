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

// General rate limit: 200 requests per 15 minutes per IP
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// Strict rate limit for auth endpoints: 20 requests per 15 minutes per IP
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
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
