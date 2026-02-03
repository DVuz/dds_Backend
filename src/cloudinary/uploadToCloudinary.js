const streamifier = require('streamifier');
const cloudinary = require('../config/cloudinary');
const logger = require('../utils/logger');

/**
 * Upload file lên Cloudinary (không validate size - đã validate ở Multer)
 * @param {Buffer} fileBuffer - Buffer của file
 * @param {string} folderName - Tên folder trên Cloudinary
 * @param {Object} options - Tùy chọn upload Cloudinary
 * @param {string} options.resource_type - Loại resource: 'image', 'video', 'raw', 'auto' (default: 'auto')
 * @returns {Promise<string>} URL của file đã upload
 */
const uploadToCloudinary = (fileBuffer, folderName, options = {}) => {
  return new Promise((resolve, reject) => {
    // 1. Kiểm tra buffer có hợp lệ không
    if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) {
      logger.error('Invalid buffer provided');
      return reject(new Error('Buffer không hợp lệ'));
    }

    // 2. Lấy kích thước file (chỉ để log)
    const fileSize = fileBuffer.length;
    const sizeMB = (fileSize / 1024 / 1024).toFixed(2);

    // 3. Log thông tin
    logger.info(`Uploading file (${sizeMB}MB) to ${folderName}`);

    // 4. Upload lên Cloudinary
    const uploadOptions = {
      folder: folderName,
      resource_type: options.resource_type || 'auto',
      ...options, // Cho phép override các options khác
    };

    const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (result) {
        logger.info(`Upload success: ${result.secure_url}`);
        resolve(result.secure_url);
      } else {
        logger.error(`Upload error: ${error?.message}`);
        reject(error);
      }
    });

    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

module.exports = uploadToCloudinary;
