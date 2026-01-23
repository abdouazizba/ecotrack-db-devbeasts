const helmet = require('helmet');
const cors = require('cors');
const bodyParser = require('body-parser');

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

module.exports = {
  securityMiddleware,
  parsingMiddleware,
  corsOptions,
};
