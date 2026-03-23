/**
 * RBAC Authorization Middleware
 * Vérifie que req.user.role est autorizer à accéder à la ressource
 * 
 * Usage:
 * router.delete('/:id', auth, authorize(['admin']), controller.delete)
 * // Seulement les admins peuvent supprimer
 */

const { ForbiddenError, UnauthorizedError } = require('../errors/AppError');

/**
 * Middleware d'authentification (vérifie JWT)
 * Doit être appliqué AVANT authorize()
 * 
 * Ajoute req.user = { id, email, role }
 * Retourne 401 si pas d'auth
 * 
 * NOTE: In auth-service, this might be redundant with existing auth.middleware.js
 * But we keep it for consistency across services
 */
function auth(req, res, next) {
  try {
    // Dans auth-service, req.user est déjà défini par auth.middleware.js
    // on fait juste vérifier qu'il existe
    if (!req.user) {
      throw new UnauthorizedError('No authentication token provided');
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware d'autorisation par rôle
 * @param {array} allowedRoles - Array de rôles autorisés. Ex: ['super_admin', 'admin']
 * @returns {function} Middleware Express
 * 
 * Usage:
 * router.delete('/:id', auth, authorize(['super_admin']), controller.delete)
 */
function authorize(allowedRoles = []) {
  return (req, res, next) => {
    try {
      // Vérifier que l'utilisateur existe et a un rôle
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      if (!req.user.role) {
        throw new UnauthorizedError('User role not found');
      }

      // Vérifier que le rôle est dans la liste autorisée
      if (!allowedRoles.includes(req.user.role)) {
        throw new ForbiddenError(
          `Access denied. Required role: ${allowedRoles.join(' or ')}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
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
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const resourceOwnerId = getResourceOwnerId(req);
      const isOwner = req.user.id === resourceOwnerId;
      const isAdmin = req.user.role === 'admin';

      if (!isOwner && !isAdmin) {
        throw new ForbiddenError('Access denied. You can only modify your own data');
      }

      next();
    } catch (error) {
      next(error);
    }
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

// Legacy exports for backward compatibility
const requireAdmin = authorize([ROLES.ADMIN]);
const requireAgent = authorize(['agent']);
const requireCitoyen = authorize(['citoyen']);

module.exports = {
  auth,
  authorize,
  isOwnerOrAdmin,
  ROLES,
  // Legacy
  requireAdmin,
  requireAgent,
  requireCitoyen
};
