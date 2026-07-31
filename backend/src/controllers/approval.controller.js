const ApprovalService = require('../services/approval.service');
const { sendSuccess } = require('../utils/responseHandler');

class ApprovalController {
  /**
   * GET /api/v1/approvals/pending (Admin Only)
   */
  static async getPending(req, res, next) {
    try {
      const pendingBookings = await ApprovalService.getPendingApprovals();
      return sendSuccess(res, 'Pending approval queue retrieved successfully.', pendingBookings, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/approvals/:id/action (Admin Only)
   */
  static async processAction(req, res, next) {
    try {
      const bookingId = req.params.id;
      const adminUserId = req.user.id;
      const { action, adminRemark } = req.body;

      if (!action) {
        return res.status(400).json({
          success: false,
          message: 'Action field (APPROVED or REJECTED) is required.',
        });
      }

      const result = await ApprovalService.processApprovalAction(bookingId, action, adminRemark, adminUserId);
      return sendSuccess(res, `Booking request ${action.toLowerCase()} successfully!`, result, 200);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ApprovalController;
