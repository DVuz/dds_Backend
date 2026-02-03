const express = require('express');
const authController = require('../controller/auth');
const validate = require('../middleware/validate.middleware');
const { loginSchema } = require('../validators/auth.validator');

const router = express.Router();

/**
  * @route POST /auth/login
  * @desc User login
  * @access Public
  */
router.post('/login', validate(loginSchema), authController.login);
/**
  * @route POST /auth/refresh
  * @desc Refresh access token
  * @access Public
  */
router.post('/refresh', authController.refresh);


module.exports = router;
