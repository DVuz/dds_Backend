const logger = require('../utils/logger');
const { errorResponse } = require('../utils/response');
const { HTTP_STATUS } = require('../config/constants');

/**
 * Global error handling middleware
 */
const errorMiddleware = (err, req, res, next) => {
  // Log error
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  // Default error
  let statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = err.message || 'Internal server error';
  let errors = err.errors || null;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = HTTP_STATUS.UNPROCESSABLE_ENTITY;
    message = 'Validation error';
  }

  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = HTTP_STATUS.CONFLICT;
    message = 'Duplicate entry';
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = 'Referenced record not found';
  }

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production') {
    if (statusCode === HTTP_STATUS.INTERNAL_SERVER_ERROR) {
      message = 'Something went wrong';
    }
    errors = null;
  }

  res.status(statusCode).json(errorResponse(message, errors));
};

module.exports = errorMiddleware;
