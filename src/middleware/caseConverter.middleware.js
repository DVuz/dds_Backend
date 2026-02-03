const { camelObjToSnakeObj, snakeObjToCamelObj } = require('../utils/camelObjToSnakeObj');

/**
 * Middleware to convert request body, query, and params from camelCase to snake_case
 * Use this BEFORE your route handlers
 */
const convertRequestToSnakeCase = (req, res, next) => {
  try {
    // Skip conversion for multipart/form-data (sẽ được xử lý sau khi multer parse)
    const contentType = req.headers['content-type'] || '';
    if (contentType.includes('multipart/form-data')) {
      console.log('[CASE CONVERTER] Skipping request conversion for multipart/form-data');
      return next();
    }

    // Convert body (POST, PUT, PATCH requests)
    if (req.body && typeof req.body === 'object') {
      req.body = camelObjToSnakeObj(req.body);
    }

    // Convert query parameters (GET requests)
    if (req.query && typeof req.query === 'object') {
      req.query = camelObjToSnakeObj(req.query);
    }

    // Convert URL parameters
    if (req.params && typeof req.params === 'object') {
      req.params = camelObjToSnakeObj(req.params);
    }
    console.log('[CASE CONVERTER] Converted to snake_case:', {
      body: Object.keys(req.body || {}),
      query: Object.keys(req.query || {}),
      params: Object.keys(req.params || {}),
    });

    next();
  } catch (error) {
    console.error('Error in convertRequestToSnakeCase middleware:', error);
    next(error);
  }
};

/**
 * Middleware to convert response data from snake_case to camelCase
 * Use this AFTER your route handlers (intercept res.json)
 */
const convertResponseToCamelCase = (req, res, next) => {
  try {
    const originalJson = res.json.bind(res);

    // Override res.json method
    res.json = function (data) {
      // Convert data to camelCase before sending
      const convertedData = snakeObjToCamelObj(data);
      return originalJson(convertedData);
    };

    next();
  } catch (error) {
    console.error('Error in convertResponseToCamelCase middleware:', error);
    next(error);
  }
};

/**
 * Middleware to convert multipart/form-data body to snake_case AFTER multer parses it
 * Use this AFTER multer middleware
 */
const convertMultipartBodyToSnakeCase = (req, res, next) => {
  try {
    // Chỉ convert body (multer đã parse)
    if (req.body && typeof req.body === 'object') {
      console.log('[CASE CONVERTER] BEFORE convert:', JSON.stringify(req.body));
      req.body = camelObjToSnakeObj(req.body);
      console.log('[CASE CONVERTER] AFTER convert:', JSON.stringify(req.body));
    }
    next();
  } catch (error) {
    console.error('Error in convertMultipartBodyToSnakeCase middleware:', error);
    next(error);
  }
};

/**
 * Combined middleware for both request and response conversion
 */
const autoCaseConverter = (req, res, next) => {
  convertRequestToSnakeCase(req, res, () => {
    convertResponseToCamelCase(req, res, next);
  });
};

module.exports = {
  convertRequestToSnakeCase,
  convertResponseToCamelCase,
  convertMultipartBodyToSnakeCase,
  autoCaseConverter,
};
