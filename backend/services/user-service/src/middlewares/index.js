const authMiddleware = require('./auth.middleware');
const commonMiddleware = require('./common.middleware');

module.exports = {
  ...authMiddleware,
  ...commonMiddleware
};
