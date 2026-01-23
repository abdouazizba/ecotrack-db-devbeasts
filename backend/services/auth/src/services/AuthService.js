const { User } = require('../models');
const HashService = require('./HashService');
const JwtService = require('./JwtService');

class AuthService {
  // Register new credentials only (called by User Service)
  static async register(email, password) {
    try {
      // Validate password strength
      const passwordValidation = HashService.validatePasswordStrength(password);
      if (!passwordValidation.valid) {
        throw new Error(passwordValidation.message);
      }

      // Check if email already exists
      const existingUser = await User.findOne({
        where: { email: email.toLowerCase() },
      });
      if (existingUser) {
        throw new Error('Email already exists');
      }

      // Hash the password
      const hashedPassword = await HashService.hashPassword(password);

      // Create credentials record
      const newUser = await User.create({
        email: email.toLowerCase(),
        password: hashedPassword,
      });

      // Return without password
      return {
        user: {
          id: newUser.id,
          email: newUser.email,
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Authenticate a user
  static async login(email, password) {
    try {
      const user = await User.findOne({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        throw new Error('Email or password incorrect');
      }

      // Verify the password
      const isPasswordValid = await HashService.comparePassword(password, user.password);
      if (!isPasswordValid) {
        throw new Error('Email or password incorrect');
      }

      // Update last_login
      await user.update({ last_login: new Date() });

      // Generate the tokens
      const accessToken = JwtService.generateAccessToken(user);
      const refreshToken = JwtService.generateRefreshToken(user);

      return {
        accessToken,
        refreshToken,
        user: this.sanitizeUser(user),
      };
    } catch (error) {
      throw error;
    }
  }

  // Verify token
  static async verifyToken(token) {
    try {
      const decoded = JwtService.verifyAccessToken(token);
      return decoded;
    } catch (error) {
      throw error;
    }
  }

  // Refresh the token
  static async refreshAccessToken(refreshToken) {
    try {
      const decoded = JwtService.verifyRefreshToken(refreshToken);
      if (!decoded) {
        throw new Error('Invalid refresh token');
      }

      // Find the user
      const user = await User.findByPk(decoded.id);
      if (!user) {
        throw new Error('User not found');
      }

      // Generate a new access token
      const newAccessToken = JwtService.generateAccessToken(user);

      return {
        accessToken: newAccessToken,
      };
    } catch (error) {
      throw error;
    }
  }

  // Sanitize user data (without password)
  static sanitizeUser(user) {
    const { password, ...sanitized } = user.dataValues;
    return sanitized;
  }
}

module.exports = AuthService;
