const { pool } = require('../config/database');

class ApprovalService {
  /**
   * Fetch all pending booking requests awaiting Admin review
   */
  static async getPendingApprovals() {
    const [pendingBookings] = await pool.query(
      `SELECT b.id, b.booking_code, b.event_title, b.purpose_reason, b.start_time, b.end_time, b.status, b.created_at,
              r.id AS resource_id, r.name AS resource_name, r.building, r.room_number, r.capacity,
              u.id AS user_id, u.full_name AS student_name, u.email AS student_email, u.department, u.roll_or_emp_id
       FROM bookings b
       JOIN resources r ON b.resource_id = r.id
       JOIN users u ON b.user_id = u.id
       WHERE b.status = 'PENDING'
       ORDER BY b.created_at ASC`
    );

    return pendingBookings;
  }

  /**
   * Process an Admin Approval or Rejection decision
   * @param {Number} bookingId - Target booking ID
   * @param {String} action - 'APPROVED' or 'REJECTED'
   * @param {String} adminRemark - Optional or mandatory rejection reason
   * @param {Number} adminUserId - ID of approving admin
   */
  static async processApprovalAction(bookingId, action, adminRemark, adminUserId) {
    const uppercaseAction = action.toUpperCase();

    if (!['APPROVED', 'REJECTED'].includes(uppercaseAction)) {
      const error = new Error('Action must be either APPROVED or REJECTED.');
      error.statusCode = 400;
      throw error;
    }

    if (uppercaseAction === 'REJECTED' && (!adminRemark || adminRemark.trim() === '')) {
      const error = new Error('Mandatory Reason Required: You must provide a remark when rejecting a booking request.');
      error.statusCode = 400;
      throw error;
    }

    // Fetch existing booking record
    const [bookings] = await pool.query('SELECT id, status, booking_code FROM bookings WHERE id = ?', [bookingId]);
    if (bookings.length === 0) {
      const error = new Error('Booking request not found.');
      error.statusCode = 404;
      throw error;
    }

    const booking = bookings[0];

    if (booking.status !== 'PENDING') {
      const error = new Error(`Cannot process approval. Booking is already in [${booking.status}] state.`);
      error.statusCode = 400;
      throw error;
    }

    // Execute status update
    await pool.query(
      `UPDATE bookings 
       SET status = ?, admin_remark = ?
       WHERE id = ?`,
      [uppercaseAction, adminRemark || null, bookingId]
    );

    // Return updated record
    const [updated] = await pool.query(
      `SELECT b.id, b.booking_code, b.event_title, b.status, b.admin_remark,
              u.full_name AS student_name, r.name AS resource_name
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN resources r ON b.resource_id = r.id
       WHERE b.id = ?`,
      [bookingId]
    );

    return updated[0];
  }
}

module.exports = ApprovalService;
