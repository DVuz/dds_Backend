const express = require('express');
const productTypeController = require('../controller/producttype');
const validate = require('../middleware/validate.middleware');
const {
  productTypeSchema,
  productTypeUpdateSchema,
  productTypeQuerySchema,
} = require('../validators/producttype.validator');
const { convertMultipartBodyToSnakeCase } = require('../middleware/caseConverter.middleware');
const upload = require('../config/multer');

const router = express.Router();

/**
 * @route GET /api/product-types
 * @desc Get product types with filtering, sorting, and pagination
 * @access Public
 * @query {string} [product_type_name_vn] - Filter by product type name (partial match)
 * @query {number} [category_id] - Filter by category ID
 * @query {string} [status=active] - Filter by status (active, inactive, all)
 * @query {number} [page=1] - Page number
 * @query {number} [limit=10] - Items per page (max 100)
 * @query {string} [sort_by=created_at] - Sort field (product_type_name_vn, created_at, updated_at)
 * @query {string} [sort_order=DESC] - Sort order (ASC, DESC)
 */
router.get(
  '/',
  validate(productTypeQuerySchema, { source: 'query' }),
  productTypeController.getProductType
);

/**
 * @route GET /api/product-types/:product_type_id
 * @desc Get a product type by ID
 * @access Public
 */
router.get('/:product_type_id', productTypeController.getProductTypeById);

/**
 * @route POST /api/product-types
 * @desc Create a new product type
 * @access Private
 * @role Admin
 */
router.post(
  '/',
  upload.image('productTypeImage', { maxCount: 1, maxSize: 5 * 1024 * 1024 }),
  convertMultipartBodyToSnakeCase, // ← Convert body sau khi multer parse xong
  validate(productTypeSchema, { source: 'body' }),
  productTypeController.createProductType
);

/**
 * @route PUT /api/product-types/:product_type_id
 * @desc Update a product type by ID
 * @access Private
 * @role Admin
 */
router.put(
  '/:product_type_id',
  upload.image('productTypeImage', { maxCount: 1, maxSize: 5 * 1024 * 1024 }),
  convertMultipartBodyToSnakeCase, // ← Convert body sau khi multer parse xong
  validate(productTypeUpdateSchema, { source: 'body' }),
  productTypeController.updateProductType
);

/**
 * @route DELETE /api/product-types/:product_type_id
 * @desc Delete a product type by ID
 * @access Private
 * @role Admin
 */
router.delete('/:product_type_id', productTypeController.deleteProductType);

module.exports = router;
