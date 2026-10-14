const { pool } = require('../config/database');

class ApprovalService {
  /**
   * Fetch all pending booking requests awaiting Admin review
   */
  static async getPendingApprovals() {
    const [pendingBookings] = await pool.query(
      `SELECT b.id, b.booking_code, b.event_title, b.purpose_reason, b.start_time, b.end_time,
              b.expected_attendees, b.status, b.created_at,
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
   * Process an Admin Approval or Rejection decision with concurrency locking
   * @param {Number} bookingId - Target booking ID
   * @param {String} action - 'APPROVED' or 'REJECTED'
   * @param {String} adminRemark - Mandatory remark if rejecting, optional if approving
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

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Lock the booking row for update
      const [bookings] = await connection.query(
        'SELECT * FROM bookings WHERE id = ? FOR UPDATE',
        [bookingId]
      );

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

      if (uppercaseAction === 'APPROVED') {
        // Enforce concurrency safety: Verify no other APPROVED booking conflicts (including 1-hour break)
        const [approvedConflicts] = await connection.query(
          `SELECT id, booking_code, event_title, start_time, end_time
           FROM bookings
           WHERE resource_id = ?
             AND id != ?
             AND status = 'APPROVED'
             AND start_time < DATE_ADD(?, INTERVAL 1 HOUR)
             AND end_time > DATE_SUB(?, INTERVAL 1 HOUR)
           FOR UPDATE`,
          [booking.resource_id, booking.id, booking.end_time, booking.start_time]
        );

        if (approvedConflicts.length > 0) {
          const conf = approvedConflicts[0];
          const error = new Error(
            `Cannot approve request: This venue already has an approved event '${conf.event_title}' (${conf.booking_code}) during this time or within the mandatory 1-hour break period.`
          );
          error.statusCode = 409;
          throw error;
        }

        // Set this booking to APPROVED
        await connection.query(
          'UPDATE bookings SET status = ?, admin_remark = ? WHERE id = ?',
          ['APPROVED', adminRemark || null, bookingId]
        );

        // Automatically reject any other conflicting PENDING requests for this venue
        await connection.query(
          `UPDATE bookings
           SET status = 'REJECTED',
               admin_remark = CONCAT('Automatically rejected: Conflicting event [', ?, '] was approved for this venue.')
           WHERE resource_id = ?
             AND id != ?
             AND status = 'PENDING'
             AND start_time < DATE_ADD(?, INTERVAL 1 HOUR)
             AND end_time > DATE_SUB(?, INTERVAL 1 HOUR)`,
          [booking.event_title, booking.resource_id, booking.id, booking.end_time, booking.start_time]
        );
      } else {
        // REJECTED
        await connection.query(
          'UPDATE bookings SET status = ?, admin_remark = ? WHERE id = ?',
          ['REJECTED', adminRemark, bookingId]
        );
      }

      await connection.commit();

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
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }
}

module.exports = ApprovalService;
