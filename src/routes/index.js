const express = require('express');
const validate = require('../middleware/validate.middleware');
const { loginSchema } = require('../validators/auth.validator');
const { successResponse } = require('../utils/response');

const authRoutes = require('./auth.routes');
const categoryRoutes = require('./category.routes');
const productRoutes = require('./product.routes');
const productTypeRoutes = require('./producttype.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/product-types', productTypeRoutes);

//API info
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to the API!',
    version: '1.0.0',
    documentation: '/api/docs',
  });
});



module.exports = router;
