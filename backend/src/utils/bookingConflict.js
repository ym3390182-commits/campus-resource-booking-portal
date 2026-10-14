const { pool } = require('../config/database');

/**
 * Format a Date or SQL datetime string into a human-readable 12-hour time string (e.g., "02:00 PM")
 */
const formatTime12h = (dateInput) => {
  const d = new Date(dateInput);
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Formats a Date or SQL datetime string into YYYY-MM-DD
 */
const formatDate = (dateInput) => {
  const d = new Date(dateInput);
  return d.toISOString().split('T')[0];
};

/**
 * Normalizes Date objects or datetime strings into standard MySQL DATETIME format (YYYY-MM-DD HH:mm:ss)
 */
const formatToSqlDatetime = (dateInput) => {
  if (!dateInput) return null;
  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return null;
    const pad = (n) => String(n).padStart(2, '0');
    return `${dateInput.getFullYear()}-${pad(dateInput.getMonth() + 1)}-${pad(dateInput.getDate())} ${pad(dateInput.getHours())}:${pad(dateInput.getMinutes())}:${pad(dateInput.getSeconds())}`;
  }
  if (typeof dateInput === 'string') {
    const cleanStr = dateInput.trim().replace('T', ' ').replace(/\.\d+Z?$/, '').replace(/Z$/, '');
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(cleanStr)) {
      return cleanStr;
    }
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(cleanStr)) {
      return `${cleanStr}:00`;
    }
  }
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

/**
 * Checks if a requested time slot conflicts with any existing APPROVED or PENDING booking for a resource,
 * enforcing a MANDATORY ONE-HOUR BREAK after every event.
 * 
 * Rules:
 * - Two events cannot overlap: (S_req < E_exist) AND (E_req > S_exist)
 * - Event cannot start within 1 hour after existing event ends: (S_req >= E_exist) AND (S_req < E_exist + 1 hour)
 * - Event cannot end within 1 hour before existing event starts: (E_req <= S_exist) AND (E_req > S_exist - 1 hour)
 * 
 * Combined rule:
 * Conflict occurs if:
 * S_req < (E_exist + 1 hour) AND E_req > (S_exist - 1 hour)
 * 
 * @param {Number} resourceId - Venue ID
 * @param {String|Date} startTime - Requested start time
 * @param {String|Date} endTime - Requested end time
 * @param {Number|null} excludeBookingId - Booking ID to exclude (e.g. when updating a booking)
 * @param {Object} dbClient - mysql2 connection or pool
 * @param {Boolean} forUpdate - whether to use SELECT ... FOR UPDATE
 * @returns {Promise<Object>} { hasConflict, conflictType, message, earliestAvailableTime, conflictingBooking }
 */
const checkBookingConflict = async (
  resourceId,
  startTime,
  endTime,
  excludeBookingId = null,
  dbClient = pool,
  forUpdate = false
) => {
  const reqStart = new Date(startTime);
  const reqEnd = new Date(endTime);

  if (isNaN(reqStart.getTime()) || isNaN(reqEnd.getTime())) {
    return {
      hasConflict: true,
      conflictType: 'INVALID_TIMES',
      message: 'Invalid start time or end time format.',
      earliestAvailableTime: null,
      conflictingBooking: null,
    };
  }

  if (reqStart >= reqEnd) {
    return {
      hasConflict: true,
      conflictType: 'INVALID_TIMES',
      message: 'The selected end time must be later than the start time.',
      earliestAvailableTime: null,
      conflictingBooking: null,
    };
  }

  const sqlStartTime = formatToSqlDatetime(startTime) || formatToSqlDatetime(reqStart);
  const sqlEndTime = formatToSqlDatetime(endTime) || formatToSqlDatetime(reqEnd);

  let query = `
    SELECT id, booking_code, event_title, start_time, end_time, status,
           DATE_ADD(end_time, INTERVAL 1 HOUR) AS break_end,
           DATE_SUB(start_time, INTERVAL 1 HOUR) AS break_start
    FROM bookings
    WHERE resource_id = ?
      AND status IN ('APPROVED', 'PENDING')
      AND start_time < DATE_ADD(?, INTERVAL 1 HOUR)
      AND end_time > DATE_SUB(?, INTERVAL 1 HOUR)
  `;

  const queryParams = [resourceId, sqlEndTime, sqlStartTime];

  if (excludeBookingId) {
    query += ` AND id != ?`;
    queryParams.push(excludeBookingId);
  }

  query += ` ORDER BY start_time ASC`;

  if (forUpdate) {
    query += ` FOR UPDATE`;
  }

  const [conflicts] = await dbClient.query(query, queryParams);

  if (conflicts.length === 0) {
    return {
      hasConflict: false,
      conflictType: null,
      message: 'Time slot is available.',
      earliestAvailableTime: null,
      conflictingBooking: null,
    };
  }

  // Analyze the first/most relevant conflicting booking to give an exact explanation
  const conflict = conflicts[0];
  const existStart = new Date(conflict.start_time);
  const existEnd = new Date(conflict.end_time);
  const breakEnd = new Date(existEnd.getTime() + 60 * 60 * 1000);
  const breakStart = new Date(existStart.getTime() - 60 * 60 * 1000);

  const formattedExistStart = formatTime12h(existStart);
  const formattedExistEnd = formatTime12h(existEnd);
  const formattedBreakEnd = formatTime12h(breakEnd);
  const formattedBreakStart = formatTime12h(breakStart);

  // 1. Direct Overlap
  if (reqStart < existEnd && reqEnd > existStart) {
    return {
      hasConflict: true,
      conflictType: 'DIRECT_OVERLAP',
      message: `This venue is already booked during the selected time for '${conflict.event_title}' (${formattedExistStart} - ${formattedExistEnd}). The next available time is ${formattedBreakEnd}.`,
      earliestAvailableTime: formattedBreakEnd,
      conflictingBooking: conflict,
    };
  }

  // 2. Break violation AFTER existing event
  if (reqStart >= existEnd && reqStart < breakEnd) {
    return {
      hasConflict: true,
      conflictType: 'BREAK_AFTER',
      message: `A compulsory one-hour break is required after '${conflict.event_title}' (${formattedExistStart} - ${formattedExistEnd}). The earliest next available time is ${formattedBreakEnd}.`,
      earliestAvailableTime: formattedBreakEnd,
      conflictingBooking: conflict,
    };
  }

  // 3. Break violation BEFORE existing event
  if (reqEnd <= existStart && reqEnd > breakStart) {
    return {
      hasConflict: true,
      conflictType: 'BREAK_BEFORE',
      message: `A compulsory one-hour break is required before subsequent event '${conflict.event_title}' starting at ${formattedExistStart}. Your event must end by ${formattedBreakStart}.`,
      earliestAvailableTime: null,
      conflictingBooking: conflict,
    };
  }

  // General fallback conflict message
  return {
    hasConflict: true,
    conflictType: 'BUFFER_CONFLICT',
    message: `Time slot conflicts with an existing booking or its compulsory 1-hour break period for '${conflict.event_title}'. Earliest next available time is ${formattedBreakEnd}.`,
    earliestAvailableTime: formattedBreakEnd,
    conflictingBooking: conflict,
  };
};

/**
 * Retrieves the full day's scheduled timeline for a venue on a given date:
 * returning booked periods, mandatory 1-hour break periods, and free slots.
 */
const getVenueScheduleForDate = async (resourceId, dateString, dbClient = pool) => {
  // Query all bookings on this calendar date
  const [bookings] = await dbClient.query(
    `SELECT id, booking_code, event_title, start_time, end_time, status, expected_attendees
     FROM bookings
     WHERE resource_id = ?
       AND status IN ('APPROVED', 'PENDING')
       AND (DATE(start_time) = ? OR DATE(end_time) = ?)
     ORDER BY start_time ASC`,
    [resourceId, dateString, dateString]
  );

  const events = [];
  const breaks = [];

  bookings.forEach((b) => {
    const s = new Date(b.start_time);
    const e = new Date(b.end_time);
    const breakEnd = new Date(e.getTime() + 60 * 60 * 1000);

    events.push({
      id: b.id,
      booking_code: b.booking_code,
      event_title: b.event_title,
      start_time: b.start_time,
      end_time: b.end_time,
      formatted_start: formatTime12h(s),
      formatted_end: formatTime12h(e),
      status: b.status,
      expected_attendees: b.expected_attendees,
    });

    breaks.push({
      after_booking_id: b.id,
      after_event_title: b.event_title,
      break_start: b.end_time,
      break_end: breakEnd.toISOString(),
      formatted_break_start: formatTime12h(e),
      formatted_break_end: formatTime12h(breakEnd),
    });
  });

  return {
    date: dateString,
    events,
    breaks,
  };
};

module.exports = {
  checkBookingConflict,
  getVenueScheduleForDate,
  formatTime12h,
  formatDate,
  formatToSqlDatetime,
};
