const { pool } = require('../config/database');
const { checkBookingConflict, getVenueScheduleForDate } = require('../utils/bookingConflict');

class ResourceService {
  /**
   * Fetch all resources with optional type, capacity, search, status, and dynamic date/time availability filters
   */
  static async getAllResources(filters = {}) {
    const { resourceTypeId, minCapacity, search, status, date, startTime, endTime } = filters;

    let query = `
      SELECT r.id, r.name, r.building, r.room_number, r.capacity, r.amenities, r.status, r.created_at,
             rt.id AS resource_type_id, rt.name AS resource_type_name, rt.icon_name
      FROM resources r
      JOIN resource_types rt ON r.resource_type_id = rt.id
      WHERE 1=1
    `;

    const params = [];

    if (resourceTypeId) {
      query += ` AND r.resource_type_id = ?`;
      params.push(resourceTypeId);
    }

    if (minCapacity) {
      query += ` AND r.capacity >= ?`;
      params.push(parseInt(minCapacity, 10));
    }

    if (status) {
      query += ` AND r.status = ?`;
      params.push(status);
    }

    if (search) {
      query += ` AND (r.name LIKE ? OR r.building LIKE ? OR r.room_number LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    query += ` ORDER BY r.name ASC`;

    const [resources] = await pool.query(query, params);

    // If a time interval or date is provided, compute dynamic availability status for each venue
    if (startTime && endTime) {
      for (const res of resources) {
        if (res.status === 'MAINTENANCE') {
          res.computed_status = 'MAINTENANCE';
          res.availability_message = 'Venue is currently under maintenance.';
          res.earliest_available_time = null;
        } else {
          const conflict = await checkBookingConflict(res.id, startTime, endTime);
          if (conflict.hasConflict) {
            res.computed_status = conflict.conflictType === 'BREAK_AFTER' || conflict.conflictType === 'BREAK_BEFORE'
              ? 'BREAK_PERIOD'
              : 'BOOKED';
            res.availability_message = conflict.message;
            res.earliest_available_time = conflict.earliestAvailableTime;
          } else {
            res.computed_status = 'AVAILABLE';
            res.availability_message = 'Available for full-venue booking.';
            res.earliest_available_time = null;
          }
        }
      }
    } else {
      for (const res of resources) {
        res.computed_status = res.status;
        res.availability_message = res.status === 'AVAILABLE' ? 'Available' : 'Under Maintenance';
      }
    }

    return resources;
  }

  /**
   * Get single resource details by ID along with its upcoming bookings and full details
   */
  static async getResourceById(resourceId) {
    const [resources] = await pool.query(
      `SELECT r.id, r.name, r.building, r.room_number, r.capacity, r.amenities, r.status, r.created_at,
              rt.id AS resource_type_id, rt.name AS resource_type_name, rt.icon_name
       FROM resources r
       JOIN resource_types rt ON r.resource_type_id = rt.id
       WHERE r.id = ?`,
      [resourceId]
    );

    if (resources.length === 0) {
      const error = new Error('Resource not found.');
      error.statusCode = 404;
      throw error;
    }

    const resource = resources[0];

    // Fetch upcoming approved & pending bookings
    const [upcomingBookings] = await pool.query(
      `SELECT id, booking_code, event_title, start_time, end_time, expected_attendees, status
       FROM bookings
       WHERE resource_id = ? AND status IN ('APPROVED', 'PENDING') AND end_time >= NOW()
       ORDER BY start_time ASC`,
      [resourceId]
    );

    resource.upcoming_bookings = upcomingBookings;
    return resource;
  }

  /**
   * Get detailed day schedule and break periods for a resource on a specific date
   */
  static async getResourceSchedule(resourceId, dateString) {
    // Verify resource exists
    const resource = await this.getResourceById(resourceId);
    const schedule = await getVenueScheduleForDate(resourceId, dateString);
    return {
      resource: {
        id: resource.id,
        name: resource.name,
        capacity: resource.capacity,
        building: resource.building,
        status: resource.status,
      },
      ...schedule,
    };
  }

  /**
   * Add a new resource (Admin Only)
   */
  static async createResource({ name, resourceTypeId, building, roomNumber, capacity, amenities, status }) {
    const parsedCapacity = capacity !== undefined ? parseInt(capacity, 10) : 0;

    const [result] = await pool.query(
      `INSERT INTO resources (name, resource_type_id, building, room_number, capacity, amenities, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, resourceTypeId, building, roomNumber || null, parsedCapacity, amenities || '', status || 'AVAILABLE']
    );

    return this.getResourceById(result.insertId);
  }

  /**
   * Update resource details, capacity configuration, or toggle maintenance status (Admin Only)
   */
  static async updateResource(resourceId, updateData) {
    const existingResource = await this.getResourceById(resourceId);

    const name = updateData.name !== undefined ? updateData.name : existingResource.name;
    const resourceTypeId = updateData.resourceTypeId !== undefined ? updateData.resourceTypeId : existingResource.resource_type_id;
    const building = updateData.building !== undefined ? updateData.building : existingResource.building;
    const roomNumber = updateData.roomNumber !== undefined ? updateData.roomNumber : existingResource.room_number;
    let capacity = existingResource.capacity;
    if (updateData.capacity !== undefined) {
      const parsedCapacity = parseInt(updateData.capacity, 10);
      if (isNaN(parsedCapacity) || parsedCapacity <= 0) {
        const error = new Error('Capacity must be a positive integer greater than zero.');
        error.statusCode = 400;
        throw error;
      }
      capacity = parsedCapacity;
    }

    let status = existingResource.status;
    if (updateData.status !== undefined) {
      const normalizedStatus = updateData.status.toUpperCase();
      if (!['AVAILABLE', 'MAINTENANCE'].includes(normalizedStatus)) {
        const error = new Error('Invalid venue status. Status must be AVAILABLE or MAINTENANCE.');
        error.statusCode = 400;
        throw error;
      }
      status = normalizedStatus;
    }

    const amenities = updateData.amenities !== undefined ? updateData.amenities : existingResource.amenities;

    await pool.query(
      `UPDATE resources 
       SET name = ?, resource_type_id = ?, building = ?, room_number = ?, capacity = ?, amenities = ?, status = ?
       WHERE id = ?`,
      [name, resourceTypeId, building, roomNumber, capacity, amenities, status, resourceId]
    );

    return this.getResourceById(resourceId);
  }

  /**
   * Delete a resource (Admin Only)
   */
  static async deleteResource(resourceId) {
    await this.getResourceById(resourceId);
    await pool.query('DELETE FROM resources WHERE id = ?', [resourceId]);
    return { id: resourceId, message: 'Resource deleted successfully.' };
  }

  /**
   * Get all resource categories (Auditorium, Seminar Hall, Lab, etc.)
   */
  static async getResourceTypes() {
    const [types] = await pool.query('SELECT * FROM resource_types ORDER BY id ASC');
    return types;
  }
}

module.exports = ResourceService;
