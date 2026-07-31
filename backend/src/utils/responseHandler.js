/**
 * Unified API Response Helper for Standardized RESTful Responses
 */

const sendSuccess = (res, message = 'Success', data = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const sendError = (res, message = 'Internal Server Error', errorDetails = null, statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error: errorDetails,
  });
};

module.exports = {
  sendSuccess,
  sendError,
};
