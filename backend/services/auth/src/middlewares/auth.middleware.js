const { JwtService } = require('../services');

// JWT authentication middleware
const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token manquant' });
    }

    const decoded = JwtService.verifyAccessToken(token);

    if (!decoded) {
      return res.status(401).json({ error: 'Token invalide ou expiré' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Erreur d\'authentification' });
  }
};

// Role verification middleware
const authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Accès refusé - rôle insuffisant' });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
};
