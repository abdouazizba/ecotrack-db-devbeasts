const axios = require('axios');

// Verify JWT by calling auth-service
async function authenticate(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Call auth-service to verify token
    const response = await axios.post(
      `${process.env.AUTH_SERVICE_URL}/api/auth/verify`,
      { token }
    );

    if (response.data.valid) {
      req.user = response.data.decoded;
      return next();
    }

    return res.status(401).json({ error: 'Invalid token' });
  } catch (error) {
    return res.status(401).json({ error: 'Token verification failed' });
  }
}

// Middleware to check Admin role (admin or super_admin)
function requireAdmin(req, res, next) {
  if (!['admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  return next();
}

// Middleware to check Super Admin role only
function requireSuperAdmin(req, res, next) {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Super admin access required' });
  }
  return next();
}

module.exports = {
  authenticate,
  requireAdmin,
  requireSuperAdmin,
};
