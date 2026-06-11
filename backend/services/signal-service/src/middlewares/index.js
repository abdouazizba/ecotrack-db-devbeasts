const commonMiddleware = require('./common.middleware');
const errorMiddleware = require('./error.middleware');
const { authenticate, authorize } = require('./auth.middleware');

module.exports = {
  commonMiddleware,
  errorMiddleware,
  authenticate,
  authorize,
};
