const AuthService = require('../services/auth.service');
const { sendSuccess } = require('../utils/responseHandler');

class AuthController {
  /**
   * POST /api/v1/auth/register
   */
  static async register(req, res, next) {
    try {
      const { fullName, email, password, roleName, department, rollOrEmpId } = req.body;

      if (!fullName || !email || !password || !roleName) {
        return res.status(400).json({
          success: false,
          message: 'Full Name, Email, Password, and Role are mandatory.',
        });
      }

      const authData = await AuthService.registerUser({
        fullName,
        email,
        password,
        roleName,
        department,
        rollOrEmpId,
      });

      return sendSuccess(res, 'User registered successfully!', authData, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/login
   */
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required.',
        });
      }

      const authData = await AuthService.loginUser({ email, password });
      return sendSuccess(res, 'Login successful!', authData, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/auth/me
   */
  static async getMe(req, res, next) {
    try {
      const userId = req.user.id;
      const userProfile = await AuthService.getUserProfile(userId);
      return sendSuccess(res, 'User profile retrieved successfully.', userProfile, 200);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
