const ResourceService = require('../services/resource.service');
const { sendSuccess } = require('../utils/responseHandler');

class ResourceController {
  /**
   * GET /api/v1/resources
   * Supports filtering by type, minimum capacity, search keyword, status, date, startTime, endTime
   */
  static async getAll(req, res, next) {
    try {
      const { resourceTypeId, minCapacity, search, status, date, startTime, endTime } = req.query;
      const resources = await ResourceService.getAllResources({
        resourceTypeId,
        minCapacity,
        search,
        status,
        date,
        startTime,
        endTime,
      });
      return sendSuccess(res, 'Resources retrieved successfully.', resources, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/resources/types
   */
  static async getTypes(req, res, next) {
    try {
      const types = await ResourceService.getResourceTypes();
      return sendSuccess(res, 'Resource types retrieved successfully.', types, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/resources/:id
   */
  static async getById(req, res, next) {
    try {
      const resourceId = req.params.id;
      const resource = await ResourceService.getResourceById(resourceId);
      return sendSuccess(res, 'Resource details retrieved successfully.', resource, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/resources/:id/schedule?date=YYYY-MM-DD
   */
  static async getSchedule(req, res, next) {
    try {
      const resourceId = req.params.id;
      const dateString = req.query.date || new Date().toISOString().split('T')[0];
      const schedule = await ResourceService.getResourceSchedule(resourceId, dateString);
      return sendSuccess(res, 'Resource schedule retrieved successfully.', schedule, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/resources (Admin Only)
   */
  static async create(req, res, next) {
    try {
      const { name, resourceTypeId, building, roomNumber, capacity, amenities, status } = req.body;

      if (!name || !resourceTypeId || !building) {
        return res.status(400).json({
          success: false,
          message: 'Resource Name, Type ID, and Building are mandatory.',
        });
      }

      const newResource = await ResourceService.createResource({
        name,
        resourceTypeId,
        building,
        roomNumber,
        capacity: capacity !== undefined ? capacity : 0,
        amenities,
        status,
      });

      return sendSuccess(res, 'Resource created successfully!', newResource, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/resources/:id (Admin Only)
   * Supports updating name, capacity, building, status, amenities
   */
  static async update(req, res, next) {
    try {
      const resourceId = req.params.id;
      const updatedResource = await ResourceService.updateResource(resourceId, req.body);
      return sendSuccess(res, 'Resource updated successfully.', updatedResource, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/resources/:id (Admin Only)
   */
  static async delete(req, res, next) {
    try {
      const resourceId = req.params.id;
      const result = await ResourceService.deleteResource(resourceId);
      return sendSuccess(res, result.message, null, 200);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ResourceController;
