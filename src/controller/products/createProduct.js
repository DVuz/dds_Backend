const { successResponse, errorResponse } = require('../../utils/response');
const db = require('../../database/connection');
const uploadToCloudinary = require('../../cloudinary/uploadToCloudinary');
const deleteFromCloudinary = require('../../cloudinary/deleteFromCloudinary');
const CLOUDINARY_FOLDER = require('../../config/folderStucture');
const { HTTP_STATUS } = require('../../config/constants');
const ProductModel = require('../../models/product.model');
const ProductTypeModel = require('../../models/producttype.model');

/**
 * Controller tạo mới sản phẩm
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const createProduct = async (req, res) => {
  // Middleware automatically converts camelCase → snake_case
  console.log('Creating product with data:', req.body);

  // Track uploaded images for cleanup if error occurs
  const uploadedImages = [];

  try {
    // check product code exists
    const productExists = await ProductModel.checkProductCodeExists(req.body.product_code);
    if (productExists) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(errorResponse('Product code already exists'));
    }

    // check product type exists
    const productTypeExists = await ProductTypeModel.checkProductTypeExistsById(
      req.body.product_type_id
    );
    if (!productTypeExists) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(errorResponse('Product type does not exist'));
    }

    // Upload images if provided
    let createdMainImageUrl = '';
    let createdSubImageUrls = [];

    console.log('[DEBUG] req.files:', req.files ? Object.keys(req.files) : 'no files');

    if (req.files && req.files.mainImage) {
      console.log('[DEBUG] Uploading mainImage:', req.files.mainImage[0].originalname);
      createdMainImageUrl = await uploadToCloudinary(
        req.files.mainImage[0].buffer,
        CLOUDINARY_FOLDER.PRODUCT,
        { resource_type: 'image' }
      );
      uploadedImages.push(createdMainImageUrl); // Track uploaded image
    }

    if (req.files && req.files.subImage) {
      console.log('[DEBUG] Uploading subImage:', req.files.subImage.length, 'files');
      for (const file of req.files.subImage) {
        const subImageUrl = await uploadToCloudinary(file.buffer, CLOUDINARY_FOLDER.PRODUCT, {
          resource_type: 'image',
        });
        createdSubImageUrls.push(subImageUrl);
        uploadedImages.push(subImageUrl); // Track uploaded image
      }
    }
    const productData = {
      product_code: req.body.product_code,
      product_name_vn: req.body.product_name_vn,
      main_image: createdMainImageUrl || null,
      sub_image: createdSubImageUrls.length > 0 ? JSON.stringify(createdSubImageUrls) : null,
      length: req.body.length || null,
      width: req.body.width || null,
      height: req.body.height || null,
      material_vn: req.body.material_vn || null,
      description_vn: req.body.description_vn || null,
      origin_vn: req.body.origin_vn || null,
      color_vn: req.body.color_vn || null,
      product_type_id: req.body.product_type_id,
      status: req.body.status || 'active',
      warranty_period: req.body.warranty_period || null,
      price: req.body.price || null,
    };

    console.log('[DEBUG] Product data to insert:', productData);

    // Insert product into database
    const result = await ProductModel.createProduct(productData);

    return res
      .status(HTTP_STATUS.CREATED)
      .json(successResponse({ product_id: result.insertId }, 'Product created successfully', 'db'));
  } catch (error) {
    console.error(`Error creating product: ${error.message}`);

    // Cleanup: Delete all uploaded images from Cloudinary
    if (uploadedImages.length > 0) {
      console.log('[CLEANUP] Deleting uploaded images from Cloudinary:', uploadedImages.length);
      for (const imageUrl of uploadedImages) {
        try {
          await deleteFromCloudinary(imageUrl);
          console.log('[CLEANUP] Deleted:', imageUrl);
        } catch (deleteError) {
          console.error('[CLEANUP ERROR] Failed to delete:', imageUrl, deleteError.message);
        }
      }
    }

    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json(errorResponse('An error occurred while creating the product'));
  }
};
module.exports = createProduct;
