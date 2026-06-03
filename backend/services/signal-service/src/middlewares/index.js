const commonMiddleware = require('./common.middleware');
const errorMiddleware = require('./error.middleware');
const { authenticate } = require('./auth.middleware');

module.exports = {
  commonMiddleware,
  errorMiddleware,
  authenticate,
};
