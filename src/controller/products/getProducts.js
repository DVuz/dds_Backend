const { successResponse, errorResponse } = require('../../utils/response');
const ProductModel = require('../../models/product.model');
const { getCache, setCache, generateCacheKey } = require('../../utils/cache/redis');
const { HTTP_STATUS } = require('../../config/constants');

/**
 * Controller to get products with filtering, sorting, pagination, and caching.
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getProducts = async (req, res) => {
  try {
    console.log('[GET PRODUCTS] Original req.query:', req.query);

    const {
      status,
      product_code,
      product_name_vn,
      product_type_id,
      category_id,
      color_vn,
      min_price,
      max_price,
      page = 1,
      limit = 10,
      sort_by = 'created_at',
      sort_order = 'DESC',
    } = req.query;

    const filters = {
      status,
      product_code,
      product_name_vn,
      product_type_id: product_type_id ? parseInt(product_type_id, 10) : undefined,
      category_id: category_id ? parseInt(category_id, 10) : undefined,
      color_vn,
      min_price: min_price ? parseFloat(min_price) : undefined,
      max_price: max_price ? parseFloat(max_price) : undefined,
      page: Math.max(1, parseInt(page, 10) || 1),
      limit: Math.max(1, parseInt(limit, 10) || 10),
      sort_by,
      sort_order,
    };

    console.log('[GET PRODUCTS] Filters in controller:', filters);
    // Generate cache key
    const cacheKey = generateCacheKey('products', filters);

    // Try to get from cache first
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res
        .status(HTTP_STATUS.OK)
        .json(successResponse(cachedData, 'Get products from cache successfully', 'redis'));
    }

    // Get products from model
    const result = await ProductModel.getProducts(filters);

    // Save to cache with 60 seconds TTL
    await setCache(cacheKey, result, 60);

    return res
      .status(HTTP_STATUS.OK)
      .json(successResponse(result, 'Get products successfully', 'db'));
  } catch (error) {
    console.error(`Error in getProducts controller: ${error.message}`);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json(errorResponse('Internal server error', error.message));
  }
};

module.exports = getProducts;
