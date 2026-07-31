const ResourceService = require('../services/resource.service');
const { sendSuccess } = require('../utils/responseHandler');

class ResourceController {
  /**
   * GET /api/v1/resources
   */
  static async getAll(req, res, next) {
    try {
      const { resourceTypeId, minCapacity, search, status } = req.query;
      const resources = await ResourceService.getAllResources({ resourceTypeId, minCapacity, search, status });
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
   * POST /api/v1/resources (Admin Only)
   */
  static async create(req, res, next) {
    try {
      const { name, resourceTypeId, building, roomNumber, capacity, amenities, status } = req.body;

      if (!name || !resourceTypeId || !building || !capacity) {
        return res.status(400).json({
          success: false,
          message: 'Resource Name, Type ID, Building, and Capacity are mandatory.',
        });
      }

      const newResource = await ResourceService.createResource({
        name,
        resourceTypeId,
        building,
        roomNumber,
        capacity,
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
