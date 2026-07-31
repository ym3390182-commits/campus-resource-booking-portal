const { sendError } = require('../utils/responseHandler');

/**
 * Role-Based Access Control (RBAC) Middleware
 * @param  {...String} allowedRoles - Allowed role names e.g. ('ADMIN', 'FACULTY')
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role_name) {
      return sendError(res, 'Unauthorized action. User identity missing.', null, 401);
    }

    if (!allowedRoles.includes(req.user.role_name)) {
      return sendError(
        res,
        `Forbidden. Required role [${allowedRoles.join(', ')}], but you have role [${req.user.role_name}].`,
        null,
        403
      );
    }

    next();
  };
};

module.exports = authorizeRoles;
