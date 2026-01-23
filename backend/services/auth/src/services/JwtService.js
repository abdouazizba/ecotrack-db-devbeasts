const jwt = require('jsonwebtoken');
require('dotenv').config();

class JwtService {
  // Generate an access token
  static generateAccessToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      nom: user.nom,
      prenom: user.prenom,
    };

    return jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', {
      expiresIn: process.env.JWT_EXPIRY || '15m',
      issuer: 'auth-service',
      audience: 'ecotrack-api',
    });
  }

  // Generate a refresh token
  static generateRefreshToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
    };

    return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret', {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d',
      issuer: 'auth-service',
    });
  }

  // Verify and decode an access token
  static verifyAccessToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', {
        issuer: 'auth-service',
        audience: 'ecotrack-api',
      });
    } catch (error) {
      return null;
    }
  }

  // Verify and decode a refresh token
  static verifyRefreshToken(token) {
    try {
      return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret', {
        issuer: 'auth-service',
      });
    } catch (error) {
      return null;
    }
  }

  // Decode a token without verifying the signature
  static decodeToken(token) {
    return jwt.decode(token);
  }
}

module.exports = JwtService;
