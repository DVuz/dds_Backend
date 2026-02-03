const { errorResponse } = require('../utils/response');
const { HTTP_STATUS } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * Zod-only validation middleware
 * - schema: Zod schema (must have safeParse)
 * - options.source: 'body' | 'params' | 'query' (default: 'body')
 */
const validate = (schema, options = { source: 'body' }) => {
  return (req, res, next) => {
    console.log('[VALIDATE] Starting validation...');

    // Nếu response đã được gửi (từ multer error), bỏ qua validation
    if (res.headersSent) {
      console.log('[VALIDATE] Headers already sent, skipping');
      return;
    }

    const source = options.source || 'body';
    const data = req[source] || {};
    console.log(`[VALIDATE] Validating request ${source}:`, JSON.stringify(data).slice(0, 200));

    // If no schema provided, skip validation
    if (!schema || typeof schema.safeParse !== 'function') {
      console.log('[VALIDATE] No schema provided, skipping');
      return next();
    }

    const result = schema.safeParse(data);
    if (!result.success) {
      const errors = {};

      // Safely handle errors array
      const errorArray = result.error?.errors || result.error?.issues || [];
      console.log('Validation errors:', errorArray);
      errorArray.forEach(e => {
        const key = e.path && e.path.length ? e.path.join('.') : '_';
        if (!errors[key]) errors[key] = [];
        errors[key].push(e.message);
      });

      return res.status(HTTP_STATUS.BAD_REQUEST).json(errorResponse('Validation error', errors));
    }

    // Attach parsed/validated data back to the request
    req[source] = result.data;
    console.log('[VALIDATE] Validation passed, calling next()');
    return next();
  };
};

module.exports = validate;
