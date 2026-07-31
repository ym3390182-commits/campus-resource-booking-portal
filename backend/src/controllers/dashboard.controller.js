const DashboardService = require('../services/dashboard.service');
const { sendSuccess } = require('../utils/responseHandler');

class DashboardController {
  /**
   * GET /api/v1/dashboard/stats
   */
  static async getStats(req, res, next) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role_name;

      const dashboardData = await DashboardService.getDashboardStats(userId, userRole);
      return sendSuccess(res, 'Dashboard statistics retrieved successfully.', dashboardData, 200);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = DashboardController;
