const { successResponse, errorResponse } = require('../../utils/response');
const CategoryModel = require('../../models/category.model');
const { getCache, setCache, generateCacheKey } = require('../../utils/cache/redis');
const getProductTypesByCategoryID = require('../helpers/getProductTypesByCategoryID');
const { HTTP_STATUS } = require('../../config/constants');

/**
 * Controller to get categories with filtering, sorting, pagination, and caching.
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getCategory = async (req, res) => {
  try {
    // Extract query parameters
    const {
      status,
      category_name_vn,
      page = 1,
      limit = 10,
      sort_by = 'created_at',
      sort_order = 'DESC',
    } = req.query;

    // Prepare filter object
    const filters = {
      status,
      category_name_vn,
      page: Math.max(1, parseInt(page, 10) || 1),
      limit: Math.max(1, parseInt(limit, 10) || 10),
      sort_by,
      sort_order,
    };

    // Generate cache key
    const cacheKey = generateCacheKey('categories', filters);

    // Try to get from cache first
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res
        .status(HTTP_STATUS.OK)
        .json(successResponse(cachedData, 'Get categories from cache successfully', 'redis'));
    }

    // Get categories from model
    const result = await CategoryModel.getCategories(filters);

    // Get producttypes for each category
    for (const category of result.categories) {
      category.producttypes = await getProductTypesByCategoryID(category.category_id);
    }

    // Save to cache with 60 seconds TTL
    await setCache(cacheKey, result, 60);

    return res
      .status(HTTP_STATUS.OK)
      .json(successResponse(result, 'Get categories successfully', 'db'));
  } catch (error) {
    console.error('Error in getCategory:', error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json(errorResponse('Internal server error: ' + error.message));
  }
};

module.exports = getCategory;
