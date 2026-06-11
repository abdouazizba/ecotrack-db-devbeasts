const { securityMiddleware, parsingMiddleware, rateLimiter } = require('./common.middleware');
const { errorHandler, notFound } = require('./error.middleware');

module.exports = {
  securityMiddleware,
  parsingMiddleware,
  rateLimiter,
  errorHandler,
  notFound,
};
