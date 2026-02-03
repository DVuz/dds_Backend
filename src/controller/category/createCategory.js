const { successResponse, errorResponse } = require('../../utils/response');
const db = require('../../database/connection');
const uploadToCloudinary = require('../../cloudinary/uploadToCloudinary');
const deleteFromCloudinary = require('../../cloudinary/deleteFromCloudinary');
const logger = require('../../utils/logger');
const CLOUDINARY_FOLDER = require('../../config/folderStucture');
const { HTTP_STATUS } = require('../../config/constants');

/**
 * Controller tạo mới danh mục
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */

const createCategory = async (req, res) => {
  // Middleware đã tự động convert camelCase → snake_case
  console.log('Creating category with data:', req.body);

  // Track uploaded image for cleanup if error occurs
  let uploadedImageUrl = null;

  try {
    // Kiểm tra danh mục đã tồn tại chưa
    const checkExistQuery = `SELECT COUNT(*) AS count FROM categories WHERE category_name_vn = ?`;
    const [existRows] = await db.execute(checkExistQuery, [req.body.category_name_vn]);

    if (existRows[0].count > 0) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json(errorResponse('Category name in Vietnamese already exists'));
    }

    // Upload ảnh nếu có
    let imageUrl = null;
    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file.buffer, CLOUDINARY_FOLDER.CATEGORY, {
        resource_type: 'image',
      });
      uploadedImageUrl = imageUrl; // Track uploaded image
      req.body.image_url = imageUrl;
    }

    // Thêm category vào database
    const insertQuery = `
      INSERT INTO categories (category_name_vn, description_vn, image_url, status, created_at)
      VALUES (?, ?, ?, ?, NOW())
    `;

    await db.execute(insertQuery, [
      req.body.category_name_vn,
      req.body.description_vn || null,
      req.body.image_url || null,
      req.body.status || 'active',
    ]);

    return res
      .status(HTTP_STATUS.CREATED)
      .json(successResponse({ image_url: imageUrl }, 'Category created successfully', 'db'));
  } catch (error) {
    logger.error(`Error creating category: ${error.message}`);

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
      .json(errorResponse('An error occurred while creating the category'));
  }
};

module.exports = createCategory;
