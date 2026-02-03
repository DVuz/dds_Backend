const express = require('express');
const categoryController = require('../controller/category');
const validate = require('../middleware/validate.middleware');
const {
  categorySchema,
  categoryUpdateSchema,
  categoryQuerySchema,
} = require('../validators/category.validator');
const { convertMultipartBodyToSnakeCase } = require('../middleware/caseConverter.middleware');
const upload = require('../config/multer');

const router = express.Router();

/**
 * @route GET /categories
 * @desc Get categories with filtering, sorting, and pagination
 * @access Public
 */
router.get('/', validate(categoryQuerySchema, { source: 'query' }), categoryController.getCategory);

/**
 * @route GET /categories/:category_id
 * @desc Get a category by ID
 * @access Public
 */
router.get('/:category_id', categoryController.getCategoryById);

/**
 * @route POST /categories
 * @desc Create a new category
 * @access Private
 * @role Admin
 */
router.post(
  '/',
  upload.image('categoryImage', { maxCount: 1, maxSize: 5 * 1024 * 1024 }),
  convertMultipartBodyToSnakeCase, // ← Convert body sau khi multer parse xong
  validate(categorySchema, { source: 'body' }),
  categoryController.createCategory
);

/**
 * @route PUT /categories/:category_id
 * @desc Update a category by ID
 * @access Private
 * @role Admin
 */
router.put(
  '/:category_id',
  upload.image('categoryImage', { maxCount: 1, maxSize: 5 * 1024 * 1024 }),
  convertMultipartBodyToSnakeCase, // ← Convert body sau khi multer parse xong
  validate(categoryUpdateSchema, { source: 'body' }),
  categoryController.updateCategory
);

/**
 * @route DELETE /categories/:category_id
 * @desc Delete a category by ID
 * @access Private
 * @role Admin
 */
router.delete('/:category_id', categoryController.deleteCategory);

module.exports = router;
