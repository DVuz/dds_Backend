const { successResponse, errorResponse } = require('../../utils/response');
const ProductTypeModel = require('../../models/producttype.model');
const { getCache, setCache, generateCacheKey } = require('../../utils/cache/redis');
const logger = require('../../utils/logger');
const { HTTP_STATUS } = require('../../config/constants');
const { RECOMMENDED_TTL } = require('../../config/cache.config');

/**
 * Controller to get product types with filtering, sorting, pagination, and caching.
 * @route GET /api/product-types
 * @access Public
 */
const getProductType = async (req, res) => {
  try {
    // Query parameters are already validated by middleware
    const filters = {
      product_type_name_vn: req.query.product_type_name_vn,
      category_id: req.query.category_id,
      status: req.query.status || 'active',
      page: req.query.page || 1,
      limit: req.query.limit || 10,
      sort_by: req.query.sort_by || 'created_at',
      sort_order: req.query.sort_order || 'DESC',
    };

    // Generate cache key
    const cacheKey = generateCacheKey('product_types', filters);

    // Try to get from cache
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      logger.info('Product types retrieved from cache');
      return res
        .status(HTTP_STATUS.OK)
        .json(
          successResponse(cachedData, 'Get product types from cache successfully', 'redis_Backend')
        );
    }

    // Get from database
    const result = await ProductTypeModel.getProductTypes(filters);

    const responseData = {
      product_types: result.productTypes,
      pagination: result.pagination,
    };

    // Cache the result for 1 hour (product types change rarely)
    await setCache(cacheKey, responseData, RECOMMENDED_TTL.PRODUCT_TYPES);

    logger.info(`Product types retrieved successfully: ${result.productTypes.length} items`);
    return res
      .status(HTTP_STATUS.OK)
      .json(successResponse(responseData, 'Get product types successfully', 'db'));
  } catch (error) {
    logger.error(`Error in getProductType controller: ${error.message}`);
    return errorResponse(res, {}, 500, 'Internal server error');
  }
};

module.exports = getProductType;
