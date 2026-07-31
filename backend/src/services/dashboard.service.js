const { pool } = require('../config/database');

class DashboardService {
  /**
   * Aggregate real-time statistics for the frontend Showcase Dashboard
   */
  static async getDashboardStats(userId, userRole) {
    const isStudent = userRole.toUpperCase() === 'STUDENT';

    // 1. Total Bookings Count
    let totalQuery = `SELECT COUNT(*) AS count FROM bookings`;
    const totalParams = [];
    if (isStudent) {
      totalQuery += ` WHERE user_id = ?`;
      totalParams.push(userId);
    }
    const [[{ count: totalBookingsCount }]] = await pool.query(totalQuery, totalParams);

    // 2. Pending Approvals Count
    let pendingQuery = `SELECT COUNT(*) AS count FROM bookings WHERE status = 'PENDING'`;
    const pendingParams = [];
    if (isStudent) {
      pendingQuery += ` AND user_id = ?`;
      pendingParams.push(userId);
    }
    const [[{ count: pendingApprovalsCount }]] = await pool.query(pendingQuery, pendingParams);

    // 3. Approved Events Count
    let approvedQuery = `SELECT COUNT(*) AS count FROM bookings WHERE status = 'APPROVED'`;
    const approvedParams = [];
    if (isStudent) {
      approvedQuery += ` AND user_id = ?`;
      approvedParams.push(userId);
    }
    const [[{ count: approvedEventsCount }]] = await pool.query(approvedQuery, approvedParams);

    // 4. Active Resources Count
    const [[{ count: activeResourcesCount }]] = await pool.query(
      `SELECT COUNT(*) AS count FROM resources WHERE status = 'AVAILABLE'`
    );

    // 5. Today's Events Timeline
    const [[{ current_date_str }]] = await pool.query(`SELECT CURDATE() AS current_date_str`);
    const [todaysEvents] = await pool.query(
      `SELECT b.id, b.booking_code, b.event_title, b.start_time, b.end_time, b.status,
              r.name AS resource_name, r.building, u.full_name AS booked_by
       FROM bookings b
       JOIN resources r ON b.resource_id = r.id
       JOIN users u ON b.user_id = u.id
       WHERE DATE(b.start_time) = CURDATE()
         AND b.status IN ('APPROVED', 'PENDING')
       ORDER BY b.start_time ASC`
    );

    // 6. Recent Activity Feed
    let recentQuery = `
      SELECT b.id, b.booking_code, b.event_title, b.status, b.created_at, b.start_time,
             r.name AS resource_name, u.full_name AS user_name, u.department
      FROM bookings b
      JOIN resources r ON b.resource_id = r.id
      JOIN users u ON b.user_id = u.id
    `;
    const recentParams = [];
    if (isStudent) {
      recentQuery += ` WHERE b.user_id = ?`;
      recentParams.push(userId);
    }
    recentQuery += ` ORDER BY b.created_at DESC LIMIT 6`;

    const [recentActivity] = await pool.query(recentQuery, recentParams);

    // 7. Resource Quick Overview Cards
    const [resourceOverview] = await pool.query(
      `SELECT r.id, r.name, r.building, r.capacity, r.status, rt.name AS type_name, rt.icon_name
       FROM resources r
       JOIN resource_types rt ON r.resource_type_id = rt.id
       ORDER BY r.capacity DESC LIMIT 4`
    );

    return {
      metrics: {
        totalBookingsCount,
        pendingApprovalsCount,
        approvedEventsCount,
        activeResourcesCount,
      },
      todaysEvents,
      recentActivity,
      resourceOverview,
    };
  }
}

module.exports = DashboardService;
