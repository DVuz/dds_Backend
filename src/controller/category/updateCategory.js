const { successResponse, errorResponse } = require('../../utils/response');
const CategoryModel = require('../../models/category.model');
const uploadToCloudinary = require('../../cloudinary/uploadToCloudinary');
const deleteFromCloudinary = require('../../cloudinary/deleteFromCloudinary');
const logger = require('../../utils/logger');
const CLOUDINARY_FOLDER = require('../../config/folderStucture');
const { HTTP_STATUS } = require('../../config/constants');
const { deleteCachePattern } = require('../../utils/cache/redis');

/**
 * Controller cập nhật danh mục
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */

const updateCategory = async (req, res) => {
  // Middleware đã tự động convert camelCase → snake_case
  console.log('Updating category with data:', req.body);
  console.log('Category ID:', req.params.category_id);

  // Track uploaded image for cleanup if error occurs
  let uploadedImageUrl = null;
  let oldImageUrl = null;

  try {
    const { category_id } = req.params;

    // Kiểm tra category có tồn tại không
    const existingCategory = await CategoryModel.getCategoryById(category_id);
    if (!existingCategory) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse('Category not found'));
    }

    // Lưu URL ảnh cũ để xóa sau nếu có upload ảnh mới
    oldImageUrl = existingCategory.image_url;

    // Nếu có tên mới, kiểm tra xem tên đã tồn tại chưa (trừ category hiện tại)
    if (req.body.category_name_vn && req.body.category_name_vn !== existingCategory.category_name_vn) {
      const checkExistQuery = `SELECT COUNT(*) AS count FROM categories WHERE category_name_vn = ? AND category_id != ?`;
      const db = require('../../database/connection');
      const [existRows] = await db.execute(checkExistQuery, [req.body.category_name_vn, category_id]);

      if (existRows[0].count > 0) {
        return res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json(errorResponse('Category name in Vietnamese already exists'));
      }
    }

    // Upload ảnh mới nếu có
    if (req.file) {
      uploadedImageUrl = await uploadToCloudinary(req.file.buffer, CLOUDINARY_FOLDER.CATEGORY, {
        resource_type: 'image',
      });
      req.body.image_url = uploadedImageUrl;
    }

    // Chuẩn bị dữ liệu cập nhật (chỉ cập nhật các trường được gửi lên)
    const updateData = {};

    if (req.body.category_name_vn !== undefined) {
      updateData.category_name_vn = req.body.category_name_vn;
    }
    if (req.body.description_vn !== undefined) {
      updateData.description_vn = req.body.description_vn;
    }
    if (req.body.image_url !== undefined) {
      updateData.image_url = req.body.image_url;
    }
    if (req.body.status !== undefined) {
      updateData.status = req.body.status;
    }

    // Cập nhật category trong database
    const result = await CategoryModel.updateCategory(category_id, updateData);

    if (result.affectedRows === 0) {
      // Rollback: xóa ảnh mới nếu đã upload
      if (uploadedImageUrl) {
        try {
          await deleteFromCloudinary(uploadedImageUrl);
        } catch (deleteError) {
          logger.error(`[ROLLBACK ERROR] Failed to delete new image: ${deleteError.message}`);
        }
      }

      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse('Category not found or no changes made'));
    }

    // Xóa ảnh cũ từ Cloudinary nếu đã upload ảnh mới
    if (uploadedImageUrl && oldImageUrl) {
      try {
        await deleteFromCloudinary(oldImageUrl);
        console.log('[CLEANUP] Deleted old image:', oldImageUrl);
      } catch (deleteError) {
        logger.error(`[CLEANUP ERROR] Failed to delete old image: ${deleteError.message}`);
      }
    }

    // Invalidate cache
    await deleteCachePattern('categories*');

    return res
      .status(HTTP_STATUS.OK)
      .json(successResponse(
        {
          image_url: uploadedImageUrl || oldImageUrl,
          updated_fields: Object.keys(updateData)
        },
        'Category updated successfully',
        'db'
      ));
  } catch (error) {
    logger.error(`Error updating category: ${error.message}`);

    // Cleanup: Delete uploaded new image from Cloudinary if exists
    if (uploadedImageUrl) {
      console.log('[CLEANUP] Deleting uploaded new image from Cloudinary:', uploadedImageUrl);
      try {
        await deleteFromCloudinary(uploadedImageUrl);
        console.log('[CLEANUP] Deleted:', uploadedImageUrl);
      } catch (deleteError) {
        logger.error(`[CLEANUP ERROR] Failed to delete new image: ${deleteError.message}`);
      }
    }

    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json(errorResponse('An error occurred while updating the category'));
  }
};

module.exports = updateCategory;
