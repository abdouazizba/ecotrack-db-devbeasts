/**
 * Common middleware for error handling and validation
 */

const { validationResult } = require('express-validator');

/**
 * Validation error handler middleware
 * Returns formatted error response for any validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Error',
      details: errors.array()
    });
  }
  next();
};

/**
 * Not found handler middleware
 * Returns 404 for undefined routes
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource does not exist',
    path: req.path
  });
};

/**
 * Global error handler middleware
 * Catches all errors and returns formatted response
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message
    });
  }

  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      error: 'Database Validation Error',
      message: err.message,
      details: err.errors
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    status: err.status || 500
  });
};

module.exports = {
  handleValidationErrors,
  notFoundHandler,
  errorHandler
};
