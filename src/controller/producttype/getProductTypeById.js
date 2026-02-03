const { successResponse, errorResponse } = require('../../utils/response');
const ProductTypeModel = require('../../models/producttype.model');
const logger = require('../../utils/logger');
const { HTTP_STATUS } = require('../../config/constants');
const { getCache, setCache } = require('../../utils/cache/redis');

/**
 * Controller lấy product type theo ID
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getProductTypeById = async (req, res) => {
  try {
    const { product_type_id } = req.params;

    // Tạo cache key
    const cacheKey = `producttype:${product_type_id}`;

    // Kiểm tra cache
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      console.log('[CACHE HIT] Product type found in cache');
      return res
        .status(HTTP_STATUS.OK)
        .json(successResponse(cachedData, 'Get product type successfully', 'cache'));
    }

    // Lấy product type từ database
    const productType = await ProductTypeModel.getProductTypeById(product_type_id);

    if (!productType) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(errorResponse('Product type not found'));
    }

    // Lấy thông tin category nếu có
    if (productType.category_id) {
      const db = require('../../database/connection');
      const categoryQuery = `
        SELECT
          *
        FROM categories
        WHERE category_id = ?
      `;
      const [categoryRows] = await db.execute(categoryQuery, [productType.category_id]);
      productType.category = categoryRows[0] || null;
    }

    // Lưu vào cache (TTL: 10 phút)
    await setCache(cacheKey, productType, 600);

    return res
      .status(HTTP_STATUS.OK)
      .json(successResponse(productType, 'Get product type successfully', 'db'));
  } catch (error) {
    logger.error(`Error getting product type by ID: ${error.message}`);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json(errorResponse('An error occurred while getting the product type'));
  }
};

module.exports = getProductTypeById;
