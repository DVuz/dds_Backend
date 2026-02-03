const express = require('express');
const productController = require('../controller/products');
const validate = require('../middleware/validate.middleware');
const { productQuerySchema, productCreateSchema, productUpdateSchema } = require('../validators/product.validator');
const { convertMultipartBodyToSnakeCase } = require('../middleware/caseConverter.middleware');
const upload = require('../config/multer');

const router = express.Router();

/**
 * @route GET /products
 * @desc Get products with filtering, sorting, and pagination
 * @access Public
 */
router.get('/', validate(productQuerySchema, { source: 'query' }), productController.getProducts);

/**
  * @route GET /products/:product_id
  * @desc Get a product by ID
  * @access Public
  */
router.get('/:productId', productController.getProductById);



/**
 * @route POST /products
 * @desc Create a new product
 * @access Private
 * @role Admin
 */
router.post(
  '/',
  upload.files([
    { name: 'mainImage', type: 'IMAGE', maxCount: 1, maxSize: 10 * 1024 * 1024 },
    { name: 'subImage', type: 'IMAGE', maxCount: 5, maxSize: 10 * 1024 * 1024 },
  ]),
  convertMultipartBodyToSnakeCase, // ← Convert body sau khi multer parse xong
  validate(productCreateSchema),
  productController.createProduct
);

/**
 * @route PUT /products/:product_id
 * @desc Update a product by ID
 * @access Private
 * @role Admin
 */
router.put(
  '/:product_id',
  upload.files([
    { name: 'mainImage', type: 'IMAGE', maxCount: 1, maxSize: 10 * 1024 * 1024 },
    { name: 'subImage', type: 'IMAGE', maxCount: 5, maxSize: 10 * 1024 * 1024 },
  ]),
  convertMultipartBodyToSnakeCase, // ← Convert body sau khi multer parse xong
  validate(productUpdateSchema),
  productController.updateProduct
);

/**
 * @route DELETE /products/:product_id
 * @desc Delete a product by ID
 * @access Private
 * @role Admin
 */
router.delete('/:product_id', productController.deleteProduct);


module.exports = router;
