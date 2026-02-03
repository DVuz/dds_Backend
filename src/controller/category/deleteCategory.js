const {successResponse, errorResponse} = require('../../utils/response');
const CategoryModel = require('../../models/category.model');
const {deleteCache, deleteCachePattern} = require('../../utils/cache/redis');
const {HTTP_STATUS} = require('../../config/constants');
const deleteFromCloudinary = require('../../cloudinary/deleteFromCloudinary');

const deleteCategory = async (req, res) => {
  try{
    const {category_id} = req.params;

    // Check if category exists
    const existingCategory = await CategoryModel.getCategoryById(category_id);
    if (!existingCategory) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse('Category not found'));
    }
    //check if category has associated product types
    const hasProductTypes =  await CategoryModel.hasAssociatedProductTypes(category_id);
    if (hasProductTypes) {
      return  res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json(errorResponse('Cannot delete category with associated product types'));
    }

    // get image to delete
    const {image} = existingCategory;

    // Delete category from database
    await CategoryModel.deleteCategoryById(category_id);

    // Delete image from Cloudinary
    if (image) {
      try {
        await deleteFromCloudinary(image);
      } catch (err) {
        console.error(
          `[DELETE CATEGORY] Failed to delete image from Cloudinary: ${image}`,
          err
        );
      }
    }

    // Invalidate related cache entries
    await deleteCachePattern('categories*');

    return res
      .status(HTTP_STATUS.OK)
      .json(successResponse(null, 'Category deleted successfully'));
  }catch (error) {
    console.error('[DELETE CATEGORY] Error:', error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json(errorResponse('An error occurred while deleting the category'));
  }
}

module.exports = deleteCategory;