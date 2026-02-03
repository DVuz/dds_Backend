const { successResponse, errorResponse } = require('../../utils/response');
const db = require('../../database/connection');
const uploadToCloudinary = require('../../cloudinary/uploadToCloudinary');
const deleteFromCloudinary = require('../../cloudinary/deleteFromCloudinary');
const logger = require('../../utils/logger');
const CLOUDINARY_FOLDER = require('../../config/folderStucture');
const { HTTP_STATUS } = require('../../config/constants');

/**
 * Controller tạo mới product type
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */

const createProductType = async (req, res) => {
  // Middleware đã tự động convert camelCase → snake_case
  console.log('[CREATE PRODUCT TYPE] Creating with data:', req.body);

  // Track uploaded image for cleanup if error occurs
  let uploadedImageUrl = null;

  try {
    // Kiểm tra category có tồn tại không
    const checkCategoryQuery = `SELECT COUNT(*) AS count FROM categories WHERE category_id = ?`;
    const [categoryRows] = await db.execute(checkCategoryQuery, [req.body.category_id]);

    if (categoryRows[0].count === 0) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json(errorResponse('Category not found'));
    }

    // Kiểm tra product type đã tồn tại chưa
    const checkExistQuery = `SELECT COUNT(*) AS count FROM producttypes WHERE product_type_name_vn = ?`;
    const [existRows] = await db.execute(checkExistQuery, [req.body.product_type_name_vn]);

    if (existRows[0].count > 0) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json(errorResponse('Product type name in Vietnamese already exists'));
    }

    // Upload ảnh nếu có
    let imageUrl = null;
    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file.buffer, CLOUDINARY_FOLDER.PRODUCTTYPE, {
        resource_type: 'image',
      });
      uploadedImageUrl = imageUrl; // Track uploaded image
      req.body.image_url = imageUrl;
    }

    // Thêm product type vào database
    const insertQuery = `
      INSERT INTO producttypes (category_id, product_type_name_vn, description_vn, image_url, status, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `;

    await db.execute(insertQuery, [
      req.body.category_id,
      req.body.product_type_name_vn,
      req.body.description_vn || null,
      req.body.image_url || null,
      req.body.status || 'active',
    ]);

    return res
      .status(HTTP_STATUS.CREATED)
      .json(successResponse({ image_url: imageUrl }, 'Product type created successfully', 'db'));
  } catch (error) {
    logger.error(`Error creating product type: ${error.message}`);

    // Cleanup: Delete uploaded image from Cloudinary if exists
    if (uploadedImageUrl) {
      console.log('[CLEANUP] Deleting uploaded image from Cloudinary:', uploadedImageUrl);
      try {
        await deleteFromCloudinary(uploadedImageUrl);
        console.log('[CLEANUP] Deleted:', uploadedImageUrl);
      } catch (deleteError) {
        logger.error(`[CLEANUP ERROR] Failed to delete image: ${deleteError.message}`);
      }
    }

    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json(errorResponse('An error occurred while creating the product type'));
  }
};

module.exports = createProductType;
