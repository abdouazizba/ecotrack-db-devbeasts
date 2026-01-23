const { validationResult } = require('express-validator');
const { AuthService } = require('../services');

class AuthController {
  // Register - Create new credentials (called by User Service)
  static async register(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;
      const result = await AuthService.register(email, password);

      return res.status(201).json({
        message: 'Credentials registered successfully',
        user: result.user,
      });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  // Login - Generic (all roles)
  static async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;
      const result = await AuthService.login(email, password);

      // Store refresh token in secure cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return res.status(200).json({
        message: 'Login successful',
        accessToken: result.accessToken,
        user: result.user,
      });
    } catch (error) {
      return res.status(401).json({ error: error.message });
    }
  }

  // Logout
  static async logout(req, res) {
    try {
      res.clearCookie('refreshToken');
      return res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  // Verify token
  static async verify(req, res) {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ error: 'Token required' });
      }

      const decoded = await AuthService.verifyToken(token);
      return res.status(200).json({
        valid: true,
        decoded,
      });
    } catch (error) {
      return res.status(401).json({ valid: false, error: error.message });
    }
  }

  // Refresh token
  static async refreshToken(req, res) {
    try {
      const { refreshToken } = req.cookies;
      if (!refreshToken) {
        return res.status(401).json({ error: 'Refresh token required' });
      }

      const result = await AuthService.refreshAccessToken(refreshToken);

      return res.status(200).json({
        message: 'Token refreshed',
        accessToken: result.accessToken,
      });
    } catch (error) {
      return res.status(401).json({ error: error.message });
    }
  }
}

module.exports = AuthController;
