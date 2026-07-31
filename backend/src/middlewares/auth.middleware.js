const { verifyToken } = require('../config/jwt');
const { sendError } = require('../utils/responseHandler');

/**
 * Authentication Middleware: Validates Bearer JWT in Authorization Header
 */
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Access Denied. No token provided.', null, 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decodedPayload = verifyToken(token);
    req.user = decodedPayload; // Attach user details (id, email, role_name) to Request object
    next();
  } catch (error) {
    return sendError(res, 'Invalid or expired token.', error.message, 403);
  }
};

module.exports = authenticateJWT;
