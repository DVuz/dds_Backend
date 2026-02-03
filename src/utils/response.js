/**
 *  standard success response formatter
 *  @param {Object} data - The data to be sent in the response
 *  @param {string} message - A message describing the response
 *  @param {string} source - The source of the response data
 *  @returns {Object} - Formatted success response object
 */
const successResponse = (data, message, source) => {
  return {
    status: 'success',
    message,
    source,
    data,
  };
};

/**
 *  standard error response formatter
 *  @param {string} errorMessage - A message describing the error
 *  @param {Object} [errors=null] - Additional error details
 *  @returns {Object} - Formatted error response object
 */
const errorResponse = (errorMessage, errors = null) => {
  return {
    status: 'error',
    message: errorMessage,
    errors,
  };
}

module.exports = {
  successResponse,
  errorResponse,
};
