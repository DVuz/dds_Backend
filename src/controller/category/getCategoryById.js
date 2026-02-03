const { successResponse, errorResponse } = require('../../utils/response');
const CategoryModel = require('../../models/category.model');
const logger = require('../../utils/logger');
const { HTTP_STATUS } = require('../../config/constants');
const { getCache, setCache } = require('../../utils/cache/redis');

/**
 * Controller lấy category theo ID
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getCategoryById = async (req, res) => {
  try {
    const { category_id } = req.params;

    // Tạo cache key
    const cacheKey = `category:${category_id}`;

    // Kiểm tra cache
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      console.log('[CACHE HIT] Category found in cache');
      return res
        .status(HTTP_STATUS.OK)
        .json(successResponse(cachedData, 'Get category successfully', 'cache'));
    }

    // Lấy category từ database
    const category = await CategoryModel.getCategoryById(category_id);

    if (!category) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(errorResponse('Category not found'));
    }

    // Lấy danh sách product types của category
    const db = require('../../database/connection');
    const productTypesQuery = `
      SELECT
        product_type_id,
        product_type_name_vn,
        description_vn,
        image_url,
        status,
        created_at
      FROM producttypes
      WHERE category_id = ?
      ORDER BY created_at DESC
    `;
    const [productTypes] = await db.execute(productTypesQuery, [category_id]);
    category.producttypes = productTypes;

    // Lưu vào cache (TTL: 10 phút)
    await setCache(cacheKey, category, 600);

    return res
      .status(HTTP_STATUS.OK)
      .json(successResponse(category, 'Get category successfully', 'db'));
  } catch (error) {
    logger.error(`Error getting category by ID: ${error.message}`);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json(errorResponse('An error occurred while getting the category'));
  }
};

module.exports = getCategoryById;
