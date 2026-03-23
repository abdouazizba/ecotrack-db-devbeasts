/**
 * Base Application Error Class
 * Tous les erreurs métier héritent de celle-ci
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    
    // Capture la stack
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation Error - 400 Bad Request
 * Quand les données du client sont invalides
 */
class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400);
    this.details = details; // Array d'erreurs Joi
  }
}

/**
 * Not Found Error - 404 Not Found
 * Quand une ressource n'existe pas
 */
class NotFoundError extends AppError {
  constructor(message) {
    super(message, 404);
  }
}

/**
 * Unauthorized Error - 401 Unauthorized
 * Quand pas de token ou token invalide
 */
class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401);
  }
}

/**
 * Forbidden Error - 403 Forbidden
 * Quand utilisateur authentifié mais pas d'accès
 */
class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403);
  }
}

/**
 * Conflict Error - 409 Conflict
 * Quand unique constraint violation (ex: email existing)
 */
class ConflictError extends AppError {
  constructor(message) {
    super(message, 409);
  }
}

/**
 * Rate Limit Error - 429 Too Many Requests
 * Quand utilisateur dépasse les limites
 */
class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429);
  }
}

/**
 * Internal Server Error - 500 Internal Server Error
 * Erreurs non prévues
 */
class InternalServerError extends AppError {
  constructor(message = 'Internal server error', originalError = null) {
    super(message, 500);
    this.originalError = originalError;
  }
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  RateLimitError,
  InternalServerError
};
