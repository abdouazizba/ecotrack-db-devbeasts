const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const commonMiddleware = (app) => {
  app.use(helmet());
  app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));
};

module.exports = commonMiddleware;
