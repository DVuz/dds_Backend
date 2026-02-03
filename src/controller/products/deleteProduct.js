const {successResponse, errorResponse} = require('../../utils/response');
const ProductModel = require('../../models/product.model');
const {deleteCache, deleteCachePattern} = require('../../utils/cache/redis');
const {HTTP_STATUS} = require('../../config/constants');
const deleteFromCloudinary = require('../../cloudinary/deleteFromCloudinary');
const deleteProduct = async (req, res) => {
  try {
    const {product_id} = req.params;

    // Check if product exists
    const existingProduct = await ProductModel.getProductById(product_id);
    if (!existingProduct) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse('Product not found'));
    }
    // get mainImage and subImage to delete
    const {main_image, sub_image} = existingProduct;

    // Delete product from database
    await ProductModel.deleteProductById(product_id);

    // Delete images from Cloudinary
    const imagesToDelete = [];
    if (main_image) {
      imagesToDelete.push(main_image);
    }
    if (sub_image) {
      const subImages = JSON.parse(sub_image);
      imagesToDelete.push(...subImages);
    }
    for (const imageUrl of imagesToDelete) {
      try {
        await deleteFromCloudinary(imageUrl);
      } catch (err) {
        console.error(
          `[DELETE PRODUCT] Failed to delete image from Cloudinary: ${imageUrl}`,
          err
        );
      }
    }

    // Invalidate related cache entries
    await deleteCachePattern('products*');

    return res
      .status(HTTP_STATUS.OK)
      .json(successResponse(null, 'Product deleted successfully'));
  } catch (error) {
    console.error('[DELETE PRODUCT] Error:', error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json(errorResponse('An error occurred while deleting the product'));
  }
}
module.exports = deleteProduct;