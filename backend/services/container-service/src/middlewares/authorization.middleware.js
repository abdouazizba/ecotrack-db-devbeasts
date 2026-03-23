/**
 * RBAC Authorization Middleware
 * Vérifie que req.user.role est autoriser à accéder à la ressource
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
 */
function auth(req, res, next) {
  try {
    // Extraire le token du header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No authentication token provided');
    }

    const token = authHeader.substring(7); // Enlever "Bearer "
    
    // Vérifier le token (vous avez déjà jwt.verify quelque part)
    // Pour maintenant, on suppose que req.user est déjà défini par un autre middleware
    // (auth-service JWT middleware)
    
    if (!req.user) {
      throw new UnauthorizedError('Invalid authentication token');
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware d'autorisation par rôle
 * @param {array} allowedRoles - Array de rôles autorisés. Ex: ['admin', 'manager']
 * @returns {function} Middleware Express
 * 
 * Usage:
 * router.delete('/:id', auth, authorize(['admin']), controller.delete)
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
      const isAdmin = ['admin', 'super_admin'].includes(req.user.role);

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

module.exports = {
  auth,
  authorize,
  isOwnerOrAdmin,
  ROLES
};
