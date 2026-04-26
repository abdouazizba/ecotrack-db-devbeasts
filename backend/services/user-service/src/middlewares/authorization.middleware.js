/**
 * Authorization Middleware for User Service
 * Vérifie l'authentification via JWT
 */

const jwt = require('jsonwebtoken');

/**
 * Middleware d'authentification (vérifie JWT)
 * Extrait le token du header Authorization et le valide
 * 
 * Ajoute req.user = { id, email, role, ... }
 * Retourne 401 si pas d'auth
 */
function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        statusCode: 401,
        message: 'No authentication token provided',
        timestamp: new Date().toISOString()
      });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      statusCode: 401,
      message: 'Invalid or expired token',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Middleware d'autorisation par rôle
 * @param {array} allowedRoles - Array de rôles autorisés. Ex: ['admin', 'agent']
 * @returns {function} Middleware Express
 */
function authorize(allowedRoles = []) {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          status: 'error',
          statusCode: 401,
          message: 'Authentication required'
        });
      }

      if (!req.user.role) {
        return res.status(403).json({
          status: 'error',
          statusCode: 403,
          message: 'User role not assigned'
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          status: 'error',
          statusCode: 403,
          message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        statusCode: 500,
        message: 'Authorization check failed',
        error: error.message
      });
    }
  };
}

module.exports = {
  auth,
  authorize
};
