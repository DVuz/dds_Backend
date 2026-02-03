const { successResponse, errorResponse } = require('../../utils/response');
const ProductModel = require('../../models/product.model');
const ProductTypeModel = require('../../models/producttype.model');
const uploadToCloudinary = require('../../cloudinary/uploadToCloudinary');
const deleteFromCloudinary = require('../../cloudinary/deleteFromCloudinary');
const logger = require('../../utils/logger');
const CLOUDINARY_FOLDER = require('../../config/folderStucture');
const { HTTP_STATUS } = require('../../config/constants');
const { deleteCachePattern } = require('../../utils/cache/redis');

/**
 * Controller cập nhật sản phẩm
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */

const updateProduct = async (req, res) => {
  console.log('[UPDATE PRODUCT] Updating with data:', req.body);
  console.log('[UPDATE PRODUCT] Product ID:', req.params.product_id);

  // Track uploaded images for cleanup if error occurs
  const uploadedImages = [];
  let oldMainImage = null;
  let oldSubImages = [];

  try {
    const { product_id } = req.params;

    // Kiểm tra product có tồn tại không
    const existingProduct = await ProductModel.getProductById(product_id);
    if (!existingProduct) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse('Product not found'));
    }

    // Lưu URLs ảnh cũ để xóa sau nếu có upload ảnh mới
    oldMainImage = existingProduct.main_image;
    try {
      oldSubImages = existingProduct.sub_image ? JSON.parse(existingProduct.sub_image) : [];
    } catch (e) {
      oldSubImages = [];
    }

    // Nếu có product_code mới, kiểm tra xem đã tồn tại chưa (trừ product hiện tại)
    if (req.body.product_code && req.body.product_code !== existingProduct.product_code) {
      const productExists = await ProductModel.checkProductCodeExists(req.body.product_code);
      if (productExists) {
        return res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json(errorResponse('Product code already exists'));
      }
    }

    // Nếu có product_type_id mới, kiểm tra product type có tồn tại không
    if (req.body.product_type_id && req.body.product_type_id !== existingProduct.product_type_id) {
      const productTypeExists = await ProductTypeModel.checkProductTypeExistsById(req.body.product_type_id);
      if (!productTypeExists) {
        return res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json(errorResponse('Product type does not exist'));
      }
    }

    // Upload main image mới nếu có
    let newMainImageUrl = null;
    if (req.files && req.files.mainImage) {
      console.log('[DEBUG] Uploading new mainImage');
      newMainImageUrl = await uploadToCloudinary(
        req.files.mainImage[0].buffer,
        CLOUDINARY_FOLDER.PRODUCT,
        { resource_type: 'image' }
      );
      uploadedImages.push(newMainImageUrl);
      req.body.main_image = newMainImageUrl;
    }

    // Upload sub images mới nếu có
    let newSubImageUrls = [];
    if (req.files && req.files.subImage) {
      console.log('[DEBUG] Uploading new subImages:', req.files.subImage.length, 'files');
      for (const file of req.files.subImage) {
        const subImageUrl = await uploadToCloudinary(file.buffer, CLOUDINARY_FOLDER.PRODUCT, {
          resource_type: 'image',
        });
        newSubImageUrls.push(subImageUrl);
        uploadedImages.push(subImageUrl);
      }
      req.body.sub_image = JSON.stringify(newSubImageUrls);
    }

    // Chuẩn bị dữ liệu cập nhật (chỉ cập nhật các trường được gửi lên)
    const updateData = {};

    if (req.body.product_code !== undefined) {
      updateData.product_code = req.body.product_code;
    }
    if (req.body.product_name_vn !== undefined) {
      updateData.product_name_vn = req.body.product_name_vn;
    }
    if (req.body.main_image !== undefined) {
      updateData.main_image = req.body.main_image;
    }
    if (req.body.sub_image !== undefined) {
      updateData.sub_image = req.body.sub_image;
    }
    if (req.body.length !== undefined) {
      updateData.length = req.body.length;
    }
    if (req.body.width !== undefined) {
      updateData.width = req.body.width;
    }
    if (req.body.height !== undefined) {
      updateData.height = req.body.height;
    }
    if (req.body.material_vn !== undefined) {
      updateData.material_vn = req.body.material_vn;
    }
    if (req.body.description_vn !== undefined) {
      updateData.description_vn = req.body.description_vn;
    }
    if (req.body.origin_vn !== undefined) {
      updateData.origin_vn = req.body.origin_vn;
    }
    if (req.body.color_vn !== undefined) {
      updateData.color_vn = req.body.color_vn;
    }
    if (req.body.product_type_id !== undefined) {
      updateData.product_type_id = req.body.product_type_id;
    }
    if (req.body.status !== undefined) {
      updateData.status = req.body.status;
    }
    if (req.body.warranty_period !== undefined) {
      updateData.warranty_period = req.body.warranty_period;
    }
    if (req.body.price !== undefined) {
      updateData.price = req.body.price;
    }

    // Cập nhật product trong database
    const result = await ProductModel.updateProduct(product_id, updateData);

    if (result.affectedRows === 0) {
      // Rollback: xóa ảnh mới nếu đã upload
      if (uploadedImages.length > 0) {
        console.log('[ROLLBACK] Deleting newly uploaded images');
        for (const imageUrl of uploadedImages) {
          try {
            await deleteFromCloudinary(imageUrl);
          } catch (deleteError) {
            logger.error(`[ROLLBACK ERROR] Failed to delete image: ${deleteError.message}`);
          }
        }
      }

      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse('Product not found or no changes made'));
    }

    // Xóa ảnh cũ từ Cloudinary nếu đã upload ảnh mới
    if (newMainImageUrl && oldMainImage) {
      try {
        await deleteFromCloudinary(oldMainImage);
        console.log('[CLEANUP] Deleted old main image:', oldMainImage);
      } catch (deleteError) {
        logger.error(`[CLEANUP ERROR] Failed to delete old main image: ${deleteError.message}`);
      }
    }

    if (newSubImageUrls.length > 0 && oldSubImages.length > 0) {
      for (const oldSubImage of oldSubImages) {
        try {
          await deleteFromCloudinary(oldSubImage);
          console.log('[CLEANUP] Deleted old sub image:', oldSubImage);
        } catch (deleteError) {
          logger.error(`[CLEANUP ERROR] Failed to delete old sub image: ${deleteError.message}`);
        }
      }
    }

    // Invalidate cache
    await deleteCachePattern('products*');

    return res
      .status(HTTP_STATUS.OK)
      .json(successResponse(
        {
          main_image: newMainImageUrl || oldMainImage,
          sub_images: newSubImageUrls.length > 0 ? newSubImageUrls : oldSubImages,
          updated_fields: Object.keys(updateData)
        },
        'Product updated successfully',
        'db'
      ));
  } catch (error) {
    logger.error(`Error updating product: ${error.message}`);

    // Cleanup: Delete all uploaded new images from Cloudinary
    if (uploadedImages.length > 0) {
      console.log('[CLEANUP] Deleting uploaded new images from Cloudinary:', uploadedImages.length);
      for (const imageUrl of uploadedImages) {
        try {
          await deleteFromCloudinary(imageUrl);
          console.log('[CLEANUP] Deleted:', imageUrl);
        } catch (deleteError) {
          logger.error(`[CLEANUP ERROR] Failed to delete image: ${deleteError.message}`);
        }
      }
    }

    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json(errorResponse('An error occurred while updating the product'));
  }
};

module.exports = updateProduct;
