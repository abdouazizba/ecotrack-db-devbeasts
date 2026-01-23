// Middleware para verificar permiso específico
const authorize = (requiredRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }

    if (requiredRoles.length === 0) {
      return next();
    }

    if (!requiredRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Accès refusé - rôle insuffisant',
        requiredRoles,
        userRole: req.user.role,
      });
    }

    next();
  };
};

// Middleware específico para Admin
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Utilisateur non authentifié' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès admin requis' });
  }

  next();
};

// Middleware específico para Agent
const requireAgent = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Utilisateur non authentifié' });
  }

  if (req.user.role !== 'agent') {
    return res.status(403).json({ error: 'Accès agent requis' });
  }

  next();
};

// Middleware específico para Citoyen
const requireCitoyen = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Utilisateur non authentifié' });
  }

  if (req.user.role !== 'citoyen') {
    return res.status(403).json({ error: 'Accès citoyen requis' });
  }

  next();
};

module.exports = {
  authorize,
  requireAdmin,
  requireAgent,
  requireCitoyen,
};
