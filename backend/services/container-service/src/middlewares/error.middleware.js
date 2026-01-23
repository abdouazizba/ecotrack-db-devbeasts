const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      details: err.errors.map(e => ({ field: e.path, message: e.message })),
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      error: 'This value already exists',
      field: err.errors[0]?.path,
    });
  }

  return res.status(500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
  });
};

const notFound = (req, res) => {
  return res.status(404).json({ error: 'Route not found' });
};

module.exports = {
  errorHandler,
  notFound,
};
