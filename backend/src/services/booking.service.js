const { pool } = require('../config/database');
const { checkBookingConflict } = require('../utils/bookingConflict');

class BookingService {
  /**
   * Helper: Generate a clean reference code e.g. BK-984102
   */
  static generateBookingCode() {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    return `BK-${randomNum}`;
  }

  /**
   * Create a new booking request with transactional conflict prevention lock
   */
  static async createBooking({ userId, userRole, resourceId, eventTitle, purposeReason, startTime, endTime }) {
    // 1. Validate start_time < end_time
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      const error = new Error('End time must be strictly after Start time.');
      error.statusCode = 400;
      throw error;
    }

    if (start < new Date()) {
      const error = new Error('Cannot book a time slot in the past.');
      error.statusCode = 400;
      throw error;
    }

    // 2. Check resource existence and maintenance status
    const [resources] = await pool.query('SELECT id, status, name FROM resources WHERE id = ?', [resourceId]);
    if (resources.length === 0) {
      const error = new Error('Requested resource does not exist.');
      error.statusCode = 404;
      throw error;
    }

    if (resources[0].status === 'MAINTENANCE') {
      const error = new Error(`Resource [${resources[0].name}] is currently under maintenance.`);
      error.statusCode = 400;
      throw error;
    }

    // 3. Execute Transactional Conflict Check
    const hasConflict = await checkBookingConflict(resourceId, startTime, endTime);
    if (hasConflict) {
      const error = new Error('Slot Conflict: The requested resource is already booked for this time slot.');
      error.statusCode = 409; // Conflict HTTP Status
      throw error;
    }

    // 4. Determine Approval Status based on User Role:
    // Faculty -> APPROVED automatically
    // Student -> PENDING (requires Admin review)
    // Admin -> APPROVED automatically
    const status = userRole.toUpperCase() === 'STUDENT' ? 'PENDING' : 'APPROVED';
    const bookingCode = this.generateBookingCode();

    // 5. Insert Booking Record
    const [result] = await pool.query(
      `INSERT INTO bookings (booking_code, resource_id, user_id, event_title, purpose_reason, start_time, end_time, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [bookingCode, resourceId, userId, eventTitle, purposeReason, startTime, endTime, status]
    );

    return this.getBookingById(result.insertId);
  }

  /**
   * Get single booking details by ID
   */
  static async getBookingById(bookingId) {
    const [bookings] = await pool.query(
      `SELECT b.id, b.booking_code, b.event_title, b.purpose_reason, b.start_time, b.end_time, b.status, b.admin_remark, b.created_at,
              r.id AS resource_id, r.name AS resource_name, r.building, r.room_number,
              u.id AS user_id, u.full_name AS user_name, u.email AS user_email, u.department, u.roll_or_emp_id,
              role.name AS user_role
       FROM bookings b
       JOIN resources r ON b.resource_id = r.id
       JOIN users u ON b.user_id = u.id
       JOIN roles role ON u.role_id = role.id
       WHERE b.id = ?`,
      [bookingId]
    );

    if (bookings.length === 0) {
      const error = new Error('Booking record not found.');
      error.statusCode = 404;
      throw error;
    }

    return bookings[0];
  }

  /**
   * Get booking history for the logged-in user
   */
  static async getUserBookings(userId, statusFilter = null) {
    let query = `
      SELECT b.id, b.booking_code, b.event_title, b.purpose_reason, b.start_time, b.end_time, b.status, b.admin_remark, b.created_at,
             r.id AS resource_id, r.name AS resource_name, r.building, r.room_number, rt.name AS resource_type_name
      FROM bookings b
      JOIN resources r ON b.resource_id = r.id
      JOIN resource_types rt ON r.resource_type_id = rt.id
      WHERE b.user_id = ?
    `;

    const params = [userId];

    if (statusFilter) {
      query += ` AND b.status = ?`;
      params.push(statusFilter);
    }

    query += ` ORDER BY b.created_at DESC`;

    const [bookings] = await pool.query(query, params);
    return bookings;
  }

  /**
   * Get all approved and pending bookings for FullCalendar visualizer feed
   */
  static async getCalendarEvents(resourceTypeId = null) {
    let query = `
      SELECT b.id, b.booking_code AS title_code, b.event_title, b.start_time AS start, b.end_time AS end, b.status,
             r.name AS resource_name, r.building, u.full_name AS booked_by
      FROM bookings b
      JOIN resources r ON b.resource_id = r.id
      JOIN users u ON b.user_id = u.id
      WHERE b.status IN ('APPROVED', 'PENDING')
    `;

    const params = [];

    if (resourceTypeId) {
      query += ` AND r.resource_type_id = ?`;
      params.push(resourceTypeId);
    }

    query += ` ORDER BY b.start_time ASC`;

    const [events] = await pool.query(query, params);
    return events;
  }

  /**
   * Cancel an existing booking (User can cancel own booking, Admin can cancel any)
   */
  static async cancelBooking(bookingId, userId, userRole) {
    const booking = await this.getBookingById(bookingId);

    if (userRole.toUpperCase() !== 'ADMIN' && booking.user_id !== userId) {
      const error = new Error('Forbidden. You can only cancel your own bookings.');
      error.statusCode = 403;
      throw error;
    }

    if (booking.status === 'CANCELLED') {
      const error = new Error('Booking is already cancelled.');
      error.statusCode = 400;
      throw error;
    }

    await pool.query('UPDATE bookings SET status = ? WHERE id = ?', ['CANCELLED', bookingId]);
    return { id: bookingId, message: 'Booking cancelled successfully.' };
  }
}

module.exports = BookingService;
