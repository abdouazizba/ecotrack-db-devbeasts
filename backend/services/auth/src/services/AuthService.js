const UserRepository = require('../repositories/User.repository');
const HashService = require('./HashService');
const JwtService = require('./JwtService');
const { UnauthorizedError, ValidationError, ConflictError } = require('../errors/AppError');

class AuthService {
  /**
   * Register new credentials (create new User)
   * @param {object} userData - { email, password, nom?, prenom?, role? }
   * @returns {object} { user, accessToken, refreshToken }
   * @throws ValidationError, ConflictError
   */
  static async register(userData) {
    try {
      const { email, password, nom, prenom, role } = userData;

      // Validate password strength
      const passwordValidation = HashService.validatePasswordStrength(password);
      if (!passwordValidation.valid) {
        throw new ValidationError(passwordValidation.message);
      }

      // Check if email already exists (via Repository)
      const emailExists = await UserRepository.emailExists(email);
      if (emailExists) {
        throw new ConflictError(`Email ${email} already exists`);
      }

      // Hash the password
      const hashedPassword = await HashService.hashPassword(password);

      // Create user via Repository
      const newUser = await UserRepository.create({
        email: email.toLowerCase(),
        password: hashedPassword,
        nom,
        prenom,
        role: role || 'citoyen'
      });

      // Generate tokens
      const accessToken = JwtService.generateAccessToken(newUser);
      const refreshToken = JwtService.generateRefreshToken(newUser);

      return {
        user: {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role
        },
        accessToken,
        refreshToken
      };
    } catch (error) {
      throw error; // AppError will be caught by globalErrorHandler
    }
  }

  /**
   * Authenticate a user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {object} { user, accessToken, refreshToken }
   * @throws UnauthorizedError
   */
  static async login(email, password) {
    try {
      // Find user by email (includes password for comparison)
      let user;
      try {
        user = await UserRepository.findByEmail(email);
      } catch (err) {
        // Don't reveal if email exists
        throw new UnauthorizedError('Email or password incorrect');
      }

      // Verify password
      const isPasswordValid = await HashService.comparePassword(password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedError('Email or password incorrect');
      }

      // Update last login time
      await UserRepository.update(user.id, { last_login: new Date() });

      // Generate tokens
      const accessToken = JwtService.generateAccessToken(user);
      const refreshToken = JwtService.generateRefreshToken(user);

      return {
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        },
        accessToken,
        refreshToken
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verify JWT token
   * @param {string} token - Access token
   * @returns {object} Decoded token
   * @throws UnauthorizedError
   */
  static async verifyToken(token) {
    try {
      const decoded = JwtService.verifyAccessToken(token);
      return decoded;
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired token');
    }
  }

  /**
   * Refresh access token
   * @param {string} refreshToken - Refresh token
   * @returns {object} { accessToken, refreshToken }
   * @throws UnauthorizedError
   */
  static async refreshAccessToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = JwtService.verifyRefreshToken(refreshToken);
      if (!decoded) {
        throw new UnauthorizedError('Invalid refresh token');
      }

      // Find user
      const user = await UserRepository.findById(decoded.id);

      // Generate new tokens
      const newAccessToken = JwtService.generateAccessToken(user);
      const newRefreshToken = JwtService.generateRefreshToken(user);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      if (error instanceof UnauthorizedError) throw error;
      throw new UnauthorizedError('Token refresh failed');
    }
  }
}

module.exports = AuthService;
