const { pool } = require('../config/database');

class ResourceService {
  /**
   * Fetch all resources with optional type, capacity, search, and status filters
   */
  static async getAllResources(filters = {}) {
    const { resourceTypeId, minCapacity, search, status } = filters;

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
    return resources;
  }

  /**
   * Get single resource details by ID along with its upcoming bookings
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

    // Fetch upcoming approved & pending bookings for availability timeline
    const [upcomingBookings] = await pool.query(
      `SELECT id, booking_code, event_title, start_time, end_time, status
       FROM bookings
       WHERE resource_id = ? AND status IN ('APPROVED', 'PENDING') AND end_time >= NOW()
       ORDER BY start_time ASC`,
      [resourceId]
    );

    resource.upcoming_bookings = upcomingBookings;
    return resource;
  }

  /**
   * Add a new resource (Admin Only)
   */
  static async createResource({ name, resourceTypeId, building, roomNumber, capacity, amenities, status }) {
    const [result] = await pool.query(
      `INSERT INTO resources (name, resource_type_id, building, room_number, capacity, amenities, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, resourceTypeId, building, roomNumber || null, capacity, amenities || '', status || 'AVAILABLE']
    );

    return this.getResourceById(result.insertId);
  }

  /**
   * Update resource details or toggle maintenance status (Admin Only)
   */
  static async updateResource(resourceId, updateData) {
    const existingResource = await this.getResourceById(resourceId);

    const name = updateData.name || existingResource.name;
    const resourceTypeId = updateData.resourceTypeId || existingResource.resource_type_id;
    const building = updateData.building || existingResource.building;
    const roomNumber = updateData.roomNumber !== undefined ? updateData.roomNumber : existingResource.room_number;
    const capacity = updateData.capacity || existingResource.capacity;
    const amenities = updateData.amenities !== undefined ? updateData.amenities : existingResource.amenities;
    const status = updateData.status || existingResource.status;

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
    await this.getResourceById(resourceId); // Throws 404 if not found
    await pool.query('DELETE FROM resources WHERE id = ?', [resourceId]);
    return { id: resourceId, message: 'Resource deleted successfully.' };
  }

  /**
   * Get all resource categories (Auditorium, Lab, etc.)
   */
  static async getResourceTypes() {
    const [types] = await pool.query('SELECT * FROM resource_types ORDER BY id ASC');
    return types;
  }
}

module.exports = ResourceService;
