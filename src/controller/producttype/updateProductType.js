const { successResponse, errorResponse } = require('../../utils/response');
const ProductTypeModel = require('../../models/producttype.model');
const uploadToCloudinary = require('../../cloudinary/uploadToCloudinary');
const deleteFromCloudinary = require('../../cloudinary/deleteFromCloudinary');
const logger = require('../../utils/logger');
const CLOUDINARY_FOLDER = require('../../config/folderStucture');
const { HTTP_STATUS } = require('../../config/constants');
const { deleteCachePattern } = require('../../utils/cache/redis');
const db = require('../../database/connection');

/**
 * Controller cập nhật product type
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */

const updateProductType = async (req, res) => {
  console.log('[UPDATE PRODUCT TYPE] Updating with data:', req.body);
  console.log('[UPDATE PRODUCT TYPE] Product Type ID:', req.params.product_type_id);

  // Track uploaded image for cleanup if error occurs
  let uploadedImageUrl = null;
  let oldImageUrl = null;

  try {
    const { product_type_id } = req.params;

    // Kiểm tra product type có tồn tại không
    const existingProductType = await ProductTypeModel.getProductTypeById(product_type_id);
    if (!existingProductType) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse('Product type not found'));
    }

    // Lưu URL ảnh cũ để xóa sau nếu có upload ảnh mới
    oldImageUrl = existingProductType.image_url;

    // Nếu có category_id mới, kiểm tra category có tồn tại không
    if (req.body.category_id && req.body.category_id !== existingProductType.category_id) {
      const checkCategoryQuery = `SELECT COUNT(*) AS count FROM categories WHERE category_id = ?`;
      const [categoryRows] = await db.execute(checkCategoryQuery, [req.body.category_id]);

      if (categoryRows[0].count === 0) {
        return res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json(errorResponse('Category not found'));
      }
    }

    // Nếu có tên mới, kiểm tra xem tên đã tồn tại chưa (trừ product type hiện tại)
    if (req.body.product_type_name_vn && req.body.product_type_name_vn !== existingProductType.product_type_name_vn) {
      const checkExistQuery = `SELECT COUNT(*) AS count FROM producttypes WHERE product_type_name_vn = ? AND product_type_id != ?`;
      const [existRows] = await db.execute(checkExistQuery, [req.body.product_type_name_vn, product_type_id]);

      if (existRows[0].count > 0) {
        return res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json(errorResponse('Product type name in Vietnamese already exists'));
      }
    }

    // Upload ảnh mới nếu có
    if (req.file) {
      uploadedImageUrl = await uploadToCloudinary(req.file.buffer, CLOUDINARY_FOLDER.PRODUCTTYPE, {
        resource_type: 'image',
      });
      req.body.image_url = uploadedImageUrl;
    }

    // Chuẩn bị dữ liệu cập nhật (chỉ cập nhật các trường được gửi lên)
    const updateData = {};

    if (req.body.category_id !== undefined) {
      updateData.category_id = req.body.category_id;
    }
    if (req.body.product_type_name_vn !== undefined) {
      updateData.product_type_name_vn = req.body.product_type_name_vn;
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

    // Cập nhật product type trong database
    const result = await ProductTypeModel.updateProductType(product_type_id, updateData);

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
        .json(errorResponse('Product type not found or no changes made'));
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
    await deleteCachePattern('producttypes*');
    await deleteCachePattern('product_types*');

    return res
      .status(HTTP_STATUS.OK)
      .json(successResponse(
        {
          image_url: uploadedImageUrl || oldImageUrl,
          updated_fields: Object.keys(updateData)
        },
        'Product type updated successfully',
        'db'
      ));
  } catch (error) {
    logger.error(`Error updating product type: ${error.message}`);

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
      .json(errorResponse('An error occurred while updating the product type'));
  }
};

module.exports = updateProductType;
