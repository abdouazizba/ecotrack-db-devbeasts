const { securityMiddleware, parsingMiddleware } = require('./common.middleware');
const { errorHandler, notFound } = require('./error.middleware');

module.exports = {
  securityMiddleware,
  parsingMiddleware,
  errorHandler,
  notFound,
};
