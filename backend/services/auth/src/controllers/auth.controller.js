const { AuthService } = require('../services');

class AuthController {
  /**
   * POST /api/auth/register
   * Register new user credentials
   * 
   * Body: { email, password, nom?, prenom?, role? }
   * Returns: { status, data: { id, email, role }, accessToken, refreshToken }
   */
  static async register(req, res, next) {
    try {
      const { email, password, nom, prenom, role } = req.body;
      
      const result = await AuthService.register({
        email,
        password,
        nom,
        prenom,
        role: role || 'citoyen'
      });

      res.status(201).json({
        status: 'success',
        statusCode: 201,
        message: 'User registered successfully',
        data: result.user,
        tokens: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/login
   * Login user and issue JWT tokens
   * 
   * Body: { email, password }
   * Returns: { status, data: { id, email, role }, accessToken, refreshToken }
   */
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      
      const result = await AuthService.login(email, password);

      // Store refresh token in secure cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(200).json({
        status: 'success',
        statusCode: 200,
        message: 'Login successful',
        data: result.user,
        tokens: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/logout
   * Logout current user (clear refresh token)
   * 
   * Returns: { status, message }
   */
  static async logout(req, res, next) {
    try {
      res.clearCookie('refreshToken');
      
      res.status(200).json({
        status: 'success',
        statusCode: 200,
        message: 'Logout successful'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/verify
   * Verify JWT token validity
   * 
   * Body: { token }
   * Returns: { status, valid: boolean, data: { decoded token } }
   */
  static async verify(req, res, next) {
    try {
      // req.body.token is already validated by middleware
      // If we're here, the token was valid
      const decoded = req.user; // Set by auth middleware
      
      res.status(200).json({
        status: 'success',
        statusCode: 200,
        valid: true,
        data: decoded
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/refresh-token
   * Refresh access token using refresh token
   * 
   * Body: { refreshToken }
   * Returns: { status, accessToken }
   */
  static async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      
      const result = await AuthService.refreshAccessToken(refreshToken);

      res.status(200).json({
        status: 'success',
        statusCode: 200,
        message: 'Token refreshed successfully',
        data: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken // Return new refresh token too
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
