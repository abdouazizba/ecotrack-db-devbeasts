/**
 * Global Error Handler Middleware
 * Doit être utilisé en DERNIER position dans app.js
 * app.use(globalErrorHandler)
 * 
 * Capture TOUS les erreurs et retourne du JSON standard
 */

const { AppError, InternalServerError } = require('../errors/AppError');

/**
 * Format erreur standard retourné au client
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Message erreur
 * @param {object} details - Détails supplémentaires (validation errors, etc)
 * @returns {object} Réponse JSON
 */
function formatErrorResponse(statusCode, message, details = null) {
  const response = {
    status: 'error',
    statusCode,
    message,
    timestamp: new Date().toISOString()
  };

  if (details) {
    response.details = details;
  }

  return response;
}

/**
 * Global Error Handler
 */
const globalErrorHandler = (err, req, res, next) => {
  // Logguer l'erreur (important pour debug)
  console.error('[ERROR]', {
    name: err.name,
    message: err.message,
    statusCode: err.statusCode || 500,
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Si c'est une AppError (erreur métier qu'on contrôle)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(
      formatErrorResponse(err.statusCode, err.message, err.details)
    );
  }

  // Si c'est une erreur Sequelize (DB)
  if (err.name === 'SequelizeValidationError') {
    const details = err.errors.map(e => ({
      field: e.path,
      message: e.message
    }));
    return res.status(400).json(
      formatErrorResponse(400, 'Validation error', details)
    );
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = Object.keys(err.fields)[0];
    return res.status(409).json(
      formatErrorResponse(409, `${field} already exists`, { field })
    );
  }

  // Erreur JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json(
      formatErrorResponse(401, 'Invalid token')
    );
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json(
      formatErrorResponse(401, 'Token expired')
    );
  }

  // Erreur non gérée = 500
  console.error('[UNHANDLED ERROR]', err);
  return res.status(500).json(
    formatErrorResponse(
      500,
      'Internal server error',
      process.env.NODE_ENV === 'development' ? err.message : null
    )
  );
};

module.exports = globalErrorHandler;
