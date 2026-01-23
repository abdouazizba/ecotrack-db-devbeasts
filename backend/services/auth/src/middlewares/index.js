const { authenticate, authorize } = require('./auth.middleware');
const { requireAdmin, requireAgent, requireCitoyen } = require('./authorization.middleware');
const { errorHandler, notFound } = require('./error.middleware');
const { securityMiddleware, parsingMiddleware } = require('./common.middleware');

module.exports = {
  authenticate,
  authorize,
  requireAdmin,
  requireAgent,
  requireCitoyen,
  errorHandler,
  notFound,
  securityMiddleware,
  parsingMiddleware,
};
