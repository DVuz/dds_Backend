const { successResponse, errorResponse } = require('../../utils/response');
const ProductTypeModel = require('../../models/producttype.model');
const { deleteCachePattern } = require('../../utils/cache/redis');
const { HTTP_STATUS } = require('../../config/constants');
const deleteFromCloudinary = require('../../cloudinary/deleteFromCloudinary');

const deleteProductType = async (req, res) => {
  try {
    const { product_type_id } = req.params;

    // Check if product type exists
    const existingProductType = await ProductTypeModel.getProductTypeById(product_type_id);
    if (!existingProductType) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse('Product type not found'));
    }

    // Check if product type has associated products
    const hasProducts = await ProductTypeModel.hasAssociatedProducts(product_type_id);
    if (hasProducts) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json(errorResponse('Cannot delete product type with associated products'));
    }

    // Get image to delete
    const { image_url } = existingProductType;

    // Delete product type from database
    await ProductTypeModel.deleteProductTypeById(product_type_id);

    // Delete image from Cloudinary
    if (image_url) {
      try {
        await deleteFromCloudinary(image_url);
      } catch (err) {
        console.error(
          `[DELETE PRODUCT TYPE] Failed to delete image from Cloudinary: ${image_url}`,
          err
        );
      }
    }

    // Invalidate related cache entries
    await deleteCachePattern('producttypes*');
    await deleteCachePattern('products*');

    return res
      .status(HTTP_STATUS.OK)
      .json(successResponse(null, 'Product type deleted successfully'));
  } catch (error) {
    console.error('[DELETE PRODUCT TYPE] Error:', error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json(errorResponse('An error occurred while deleting the product type'));
  }
};

module.exports = deleteProductType;
