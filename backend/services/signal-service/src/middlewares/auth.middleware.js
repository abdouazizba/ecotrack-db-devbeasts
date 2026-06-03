const axios = require('axios');

async function authenticate(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, error: 'Access token required' });
    }

    // Auth-service /verify expects the token in the Authorization header
    const response = await axios.post(
      `${process.env.AUTH_SERVICE_URL || 'http://auth-service:3001'}/api/auth/verify`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (response.data.valid) {
      req.user = response.data.data; // auth-service returns decoded token in .data
      return next();
    }

    return res.status(401).json({ success: false, error: 'Invalid token' });
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Token verification failed' });
  }
}

module.exports = { authenticate };
