const express = require('express');
const userRoutes = require('./routes/user.routes');
const cors = require('cors');
require ('dotenv').config();
const { timestamp } = require('node:console');

module.exports = function(app) {
  const router = express.Router();

  router.use('/users', userRoutes);

  app.use('/api', router);
};
