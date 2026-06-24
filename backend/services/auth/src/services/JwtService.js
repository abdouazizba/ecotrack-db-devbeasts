const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

if (!JWT_SECRET || !REFRESH_TOKEN_SECRET) {
  throw new Error('JWT_SECRET and REFRESH_TOKEN_SECRET environment variables are required');
}

class JwtService {
  static generateAccessToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      nom: user.nom,
      prenom: user.prenom,
    };

    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRY || '15m',
      issuer: 'auth-service',
      audience: 'ecotrack-api',
    });
  }

  static generateRefreshToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
    };

    return jwt.sign(payload, REFRESH_TOKEN_SECRET, {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '2d',
      issuer: 'auth-service',
    });
  }

  static verifyAccessToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET, {
        issuer: 'auth-service',
        audience: 'ecotrack-api',
      });
    } catch (error) {
      return null;
    }
  }

  static verifyRefreshToken(token) {
    try {
      return jwt.verify(token, REFRESH_TOKEN_SECRET, {
        issuer: 'auth-service',
      });
    } catch (error) {
      return null;
    }
  }

  static decodeToken(token) {
    return jwt.decode(token);
  }
}

module.exports = JwtService;
