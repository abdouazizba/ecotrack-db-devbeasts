// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error(err);

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      error: 'Erreur de validation',
      details: err.errors.map(e => ({ field: e.path, message: e.message })),
    });
  }

  // Unique constraint error
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      error: 'Cette valeur existe déjà',
      field: err.errors[0]?.path,
    });
  }

  // Generic error
  return res.status(500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Erreur serveur interne' 
      : err.message,
  });
};

// 404 middleware
const notFound = (req, res) => {
  return res.status(404).json({ error: 'Route non trouvée' });
};

module.exports = {
  errorHandler,
  notFound,
};
