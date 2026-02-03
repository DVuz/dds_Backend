const multer = require('multer');
const { FILE_LIMIT_SIZES } = require('./constants');
const { errorResponse } = require('../utils/response');

/**
 * ============================================
 * MULTER CONFIG - THỐNG NHẤT VÀ DỄ SỬ DỤNG
 * ============================================
 * Sử dụng:
 * - upload.image('fieldName', { maxCount: 5, maxSize: 5MB })
 * - upload.video('fieldName', { maxCount: 1, maxSize: 50MB })
 * - upload.files([...]) - cho nhiều fields khác loại
 */

const storage = multer.memoryStorage();

// ============================================
// FILE TYPE DEFINITIONS
// ============================================
const FILE_TYPES = {
  IMAGE: {
    mimeTypes: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/avif',
      'image/bmp',
      'image/svg+xml',
    ],
    defaultMaxSize: FILE_LIMIT_SIZES.IMAGE_MAX_SIZE,
    errorMessage: 'Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WEBP, AVIF, BMP, SVG)',
  },
  VIDEO: {
    mimeTypes: [
      'video/mp4',
      'video/mpeg',
      'video/quicktime',
      'video/x-msvideo',
      'video/webm',
      'video/x-flv',
      'video/x-ms-wmv',
    ],
    defaultMaxSize: FILE_LIMIT_SIZES.VIDEO_MAX_SIZE,
    errorMessage: 'Chỉ chấp nhận file video (MP4, MPEG, MOV, AVI, WEBM, FLV, WMV)',
  },
  AUDIO: {
    mimeTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/flac'],
    defaultMaxSize: FILE_LIMIT_SIZES.AUDIO_MAX_SIZE,
    errorMessage: 'Chỉ chấp nhận file âm thanh (MP3, WAV, OGG, AAC, FLAC)',
  },
  DOCUMENT: {
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.ms-excel',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
    ],
    defaultMaxSize: FILE_LIMIT_SIZES.DOCUMENT_MAX_SIZE,
    errorMessage: 'Chỉ chấp nhận file tài liệu (PDF, DOC, XLS, PPT, TXT, CSV)',
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Tạo file filter cho các loại file cụ thể
 */
const createFileFilter = allowedTypes => {
  console.log('[MULTER] Creating file filter for types:', allowedTypes);
  return (req, file, cb) => {
    console.log('[MULTER FILE FILTER] Checking file:', {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype,
      encoding: file.encoding,
    });

    const isValid = allowedTypes.some(type => {
      const mimeTypes = FILE_TYPES[type].mimeTypes;
      const matches = mimeTypes.includes(file.mimetype);
      if (!matches) {
        console.log(
          `[MULTER FILE FILTER] ${type} check: MISS (checking ${mimeTypes.length} types)`
        );
      } else {
        console.log(`[MULTER FILE FILTER] ${type} check: MATCH`);
      }
      return matches;
    });

    console.log('[MULTER FILE FILTER] Final result:', isValid ? 'ACCEPTED' : 'REJECTED');

    if (isValid) {
      cb(null, true);
    } else {
      // Reject nhưng KHÔNG throw error - để multer tiếp tục parse các file khác
      console.log('[MULTER FILE FILTER] Rejecting file silently');
      cb(null, false);
    }
  };
};

/**
 * Xử lý lỗi multer thống nhất
 */
const handleMulterError = (err, res) => {
  console.log('=== MULTER ERROR ===', err.code, err.message);
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json(errorResponse('Số lượng file vượt quá giới hạn'));
    }
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json(errorResponse('Kích thước file vượt quá giới hạn'));
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json(errorResponse('Tên trường file không đúng'));
    }
    return res.status(400).json(errorResponse(`Lỗi upload: ${err.message}`));
  } else if (err) {
    return res.status(400).json(errorResponse(err.message));
  }
};

// ============================================
// MAIN UPLOAD API
// ============================================

const upload = {
  /**
   * Upload IMAGE
   * @param {string} fieldName - Tên field
   * @param {Object} options - { maxCount: 1, maxSize: 5MB }
   */
  image: (fieldName, options = {}) => {
    const { maxCount = 1, maxSize = FILE_TYPES.IMAGE.defaultMaxSize } = options;

    // Không log khi khởi tạo middleware nữa
    // Log này chạy khi define route, không phải khi upload

    const uploader = multer({
      storage,
      fileFilter: createFileFilter(['IMAGE']),
      limits: {
        fileSize: maxSize,
        files: maxCount,
      },
    });

    const handler =
      maxCount === 1 ? uploader.single(fieldName) : uploader.array(fieldName, maxCount);

    return (req, res, next) => {
      // Chỉ log khi thực sự có request upload
      console.log(
        `[MULTER] Uploading ${fieldName} - maxCount: ${maxCount}, maxSize: ${Math.round(maxSize / 1024 / 1024)}MB`
      );

      handler(req, res, err => {
        if (err) {
          console.log(`[MULTER ERROR] ${fieldName}:`, err.code, err.message);
          handleMulterError(err, res);
          return;
        }

        // Log kết quả upload
        if (req.file) {
          console.log(
            `[MULTER SUCCESS] Uploaded ${fieldName}:`,
            req.file.originalname,
            `(${Math.round(req.file.size / 1024)}KB)`
          );
        } else if (req.files) {
          console.log(`[MULTER SUCCESS] Uploaded ${fieldName}:`, req.files.length, 'files');
        }

        next();
      });
    };
  },

  /**
   * Upload VIDEO
   * @param {string} fieldName - Tên field
   * @param {Object} options - { maxCount: 1, maxSize: 50MB }
   */
  video: (fieldName, options = {}) => {
    const { maxCount = 1, maxSize = FILE_TYPES.VIDEO.defaultMaxSize } = options;

    const uploader = multer({
      storage,
      fileFilter: createFileFilter(['VIDEO']),
      limits: { fileSize: maxSize },
    });

    const handler =
      maxCount === 1 ? uploader.single(fieldName) : uploader.array(fieldName, maxCount);

    return (req, res, next) => {
      handler(req, res, err => {
        if (err) {
          handleMulterError(err, res);
          return;
        }
        next();
      });
    };
  },

  /**
   * Upload AUDIO
   * @param {string} fieldName - Tên field
   * @param {Object} options - { maxCount: 1, maxSize: 10MB }
   */
  audio: (fieldName, options = {}) => {
    const { maxCount = 1, maxSize = FILE_TYPES.AUDIO.defaultMaxSize } = options;

    const uploader = multer({
      storage,
      fileFilter: createFileFilter(['AUDIO']),
      limits: { fileSize: maxSize },
    });

    const handler =
      maxCount === 1 ? uploader.single(fieldName) : uploader.array(fieldName, maxCount);

    return (req, res, next) => {
      handler(req, res, err => {
        if (err) {
          handleMulterError(err, res);
          return;
        }
        next();
      });
    };
  },

  /**
   * Upload DOCUMENT
   * @param {string} fieldName - Tên field
   * @param {Object} options - { maxCount: 1, maxSize: 10MB }
   */
  document: (fieldName, options = {}) => {
    const { maxCount = 1, maxSize = FILE_TYPES.DOCUMENT.defaultMaxSize } = options;

    const uploader = multer({
      storage,
      fileFilter: createFileFilter(['DOCUMENT']),
      limits: { fileSize: maxSize },
    });

    const handler =
      maxCount === 1 ? uploader.single(fieldName) : uploader.array(fieldName, maxCount);

    return (req, res, next) => {
      handler(req, res, err => {
        if (err) {
          handleMulterError(err, res);
          return;
        }
        next();
      });
    };
  },

  /**
   * Upload NHIỀU FIELDS với config khác nhau
   * @param {Array} fieldsConfig - [{ name: 'image', type: 'image', maxCount: 5, maxSize: 5MB }]
   */
  files: fieldsConfig => {
    console.log('[MULTER] Creating files handler for:', fieldsConfig.map(f => f.name).join(', '));

    // Tạo dynamic multer instance dựa trên config
    const maxFileSize = Math.max(
      ...fieldsConfig.map(
        f =>
          f.maxSize ||
          FILE_TYPES[f.type.toUpperCase()]?.defaultMaxSize ||
          FILE_LIMIT_SIZES.IMAGE_MAX_SIZE
      )
    );

    // Lấy tất cả types được phép
    const allowedTypes = [...new Set(fieldsConfig.map(f => f.type.toUpperCase()))];

    const uploader = multer({
      storage,
      fileFilter: createFileFilter(allowedTypes),
      limits: {
        fileSize: maxFileSize,
        files: fieldsConfig.reduce((sum, f) => sum + (f.maxCount || 1), 0), // Tổng số files cho phép
      },
    });

    const fields = fieldsConfig.map(f => ({ name: f.name, maxCount: f.maxCount || 1 }));
    console.log('[MULTER] Fields config:', fields);

    return (req, res, next) => {
      // Chỉ log khi thực sự có request upload
      console.log(
        '[MULTER] Processing multi-field upload for:',
        fields.map(f => f.name).join(', ')
      );
      // console.log('[MULTER] Content-Type:', req.headers['content-type']);
      // console.log('[MULTER] Request stream state:', {
      //   readable: req.readable,
      //   readableEnded: req.readableEnded,
      //   readableFlowing: req.readableFlowing,
      //   complete: req.complete,
      // });

      // Thêm event listeners để debug stream
      req.once('data', () => console.log('[MULTER] Stream: First data chunk received'));
      req.once('end', () => console.log('[MULTER] Stream: Ended'));
      req.once('error', err => console.error('[MULTER] Stream error:', err));

      console.log('[MULTER] Starting upload_stream parse...');

      // Timeout protection - nếu sau 30s không có callback = bug
      const timeoutId = setTimeout(() => {
        console.error('[MULTER TIMEOUT] Multer callback not triggered after 30s!');
        console.error('[MULTER TIMEOUT] Stream state at timeout:', {
          readable: req.readable,
          readableEnded: req.readableEnded,
          readableFlowing: req.readableFlowing,
          complete: req.complete,
        });
        if (!res.headersSent) {
          res.status(500).json({ success: false, message: 'Upload timeout' });
        }
      }, 30000);

      const uploadHandler = uploader.fields(fields);

      uploadHandler(req, res, err => {
        clearTimeout(timeoutId); // Clear timeout khi callback được gọi
        console.log('[MULTER] Callback triggered! err:', err ? err.message : 'none');

        if (err) {
          console.error('[MULTER ERROR]', {
            code: err.code,
            message: err.message,
            stack: err.stack?.split('\n').slice(0, 3).join('\n'),
          });
          return handleMulterError(err, res); // Đảm bảo return
        }

        // Log kết quả upload chi tiết
        if (req.files) {
          console.log('[MULTER SUCCESS] Files uploaded:', Object.keys(req.files));
          Object.keys(req.files).forEach(key => {
            console.log(`  - ${key}:`, req.files[key].length, 'file(s)');
          });
        } else {
          console.log('[MULTER SUCCESS] No files uploaded');
        }
        console.log('[MULTER] Body fields:', Object.keys(req.body));
        console.log('[MULTER] Calling next()...');

        next(); // ← QUAN TRỌNG: Phải gọi next() để chuyển sang middleware tiếp theo
      });
    };
  },
};

module.exports = upload;
