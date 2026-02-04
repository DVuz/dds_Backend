const { successResponse, errorResponse } = require('../../utils/response');
const ProductModel = require('../../models/product.model');
const { getCache, setCache, generateCacheKey } = require('../../utils/cache/redis');
const { HTTP_STATUS } = require('../../config/constants');
const { RECOMMENDED_TTL } = require('../../config/cache.config');

/**
 * Controller to get a product by its ID with caching.
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getProductById = async (req, res) => {
  try {
    const { productId } = req.params;

    // Generate cache key
    const cacheKey = generateCacheKey('product', { productId });

    // Try to get from cache first
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res
        .status(HTTP_STATUS.OK)
        .json(successResponse(cachedData, 'Get product by ID from cache successfully', 'redis'));
    }

    // Get product from model
    const product = await ProductModel.getProductById(productId);
    if (!product) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(errorResponse('Product not found'));
    }

    // Store in cache with 10 minutes TTL
    await setCache(cacheKey, product, RECOMMENDED_TTL.PRODUCT_DETAIL);

    return res
      .status(HTTP_STATUS.OK)
      .json(successResponse(product, 'Get product by ID successfully', 'database'));
  } catch (error) {
    console.error('Error in getProductById controller:', error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json(errorResponse('Internal server error'));
  }
};

module.exports = getProductById;
