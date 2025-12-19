const express = require('express');
const userRoutes = require('./routes/user.routes');

module.exports = function(app) {
  const router = express.Router();

  router.use('/users', userRoutes);

  app.use('/api', router);
};
