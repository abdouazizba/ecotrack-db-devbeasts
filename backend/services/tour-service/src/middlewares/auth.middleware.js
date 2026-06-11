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

function authorize(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
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

module.exports = { authenticate, authorize };
