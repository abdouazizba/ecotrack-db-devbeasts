const axios = require('axios');

async function authenticate(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, error: 'Access token required' });
    }

    const response = await axios.post(
      `${process.env.AUTH_SERVICE_URL || 'http://auth-service:3001'}/api/auth/verify`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (response.data.valid) {
      req.user = response.data.data;
      return next();
    }

    return res.status(401).json({ success: false, error: 'Invalid token' });
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Token verification failed' });
  }
}

/**
 * Middleware d'autorisation par rôle
 * @param {array} allowedRoles - Array de rôles autorisés. Ex: ['admin', 'agent']
 * @returns {function} Middleware Express
 */
function authorize(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    if (!req.user.role) {
      return res.status(401).json({ success: false, error: 'User role not found' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
      });
    }
    return next();
  };
}

/**
 * Middleware pour vérifier que l'utilisateur est propriétaire de la ressource
 * Useful pour PUT /users/:id où l'user peut que modifier son propre profil
 * 
 * @param {function} getResourceOwnerId - Fonction qui extrait l'owner id de req
 * @returns {function} Middleware Express
 * 
 * Usage:
 * // User ne peut modifier que son propre profil
 * router.put('/:id', auth, isOwnerOrAdmin((req) => req.params.id), controller.update)
 */
function isOwnerOrAdmin(getResourceOwnerId) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    const resourceOwnerId = getResourceOwnerId(req);
    const isOwner = req.user.id === resourceOwnerId;
    const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Access denied. You can only modify your own data' });
    }
    return next();
  };
}

/**
 * RÔLES ECOTRACK
 * Documenter les rôles disponibles pour référence
 */
const ROLES = {
  SUPER_ADMIN: 'super_admin',  // Administrateur système (tous services)
  ADMIN: 'admin',              // Superviseur (lire tous, modifier sien)
  AGENT: 'agent',              // Collecteur (tournées, rapports)
  CITOYEN: 'citoyen'           // Interface mobile (signale, visualise)
};

module.exports = {
  authenticate,
  authorize,
  isOwnerOrAdmin,
  ROLES
};
