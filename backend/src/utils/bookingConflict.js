const { pool } = require('../config/database');

/**
 * Checks if a requested time slot conflicts with any existing APPROVED or PENDING booking for a resource.
 * Formula: Slot Overlap occurs if (start_time < existing_end_time) AND (end_time > existing_start_time)
 * 
 * @param {Number} resourceId - Resource ID
 * @param {String|Date} startTime - ISO Datetime or SQL Datetime string
 * @param {String|Date} endTime - ISO Datetime or SQL Datetime string
 * @param {Number|null} excludeBookingId - Optional booking ID to exclude (used when updating a booking)
 * @returns {Promise<Boolean>} Returns true if conflict exists, false if slot is available
 */
const checkBookingConflict = async (resourceId, startTime, endTime, excludeBookingId = null) => {
  let query = `
    SELECT id, booking_code, start_time, end_time, status 
    FROM bookings
    WHERE resource_id = ?
      AND status IN ('APPROVED', 'PENDING')
      AND start_time < ?
      AND end_time > ?
  `;

  const queryParams = [resourceId, endTime, startTime];

  if (excludeBookingId) {
    query += ` AND id != ?`;
    queryParams.push(excludeBookingId);
  }

  const [conflictingBookings] = await pool.query(query, queryParams);

  return conflictingBookings.length > 0;
};

module.exports = {
  checkBookingConflict,
};
