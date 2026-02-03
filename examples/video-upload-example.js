/**
 * VÍ DỤ: Upload Video với Multer + Cloudinary
 * Kích thước được check 1 lần duy nhất tại Multer
 */

const express = require('express');
const { uploadSingleVideo, uploadMediaFields } = require('../src/config/multer');
const uploadToCloudinary = require('../src/cloudinary/uploadToCloudinary');
const CLOUDINARY_FOLDER = require('../src/config/folderStucture');

const router = express.Router();

// ==========================================
// VÍ DỤ 1: Upload 1 video đơn giản
// ==========================================
router.post(
  '/videos/single',
  uploadSingleVideo('video_file'), // Multer check kích thước ở đây
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Không có file video' });
      }

      // Upload lên Cloudinary (không cần check size nữa)
      const videoUrl = await uploadToCloudinary(req.file.buffer, 'videos/products', {
        resource_type: 'video',
      });

      res.json({
        success: true,
        videoUrl,
        fileInfo: {
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ==========================================
// VÍ DỤ 2: Upload product với thumbnail (ảnh) + video
// ==========================================
router.post(
  '/products',
  uploadMediaFields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'demo_video', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const result = {
        thumbnail: null,
        video: null,
      };

      // Upload thumbnail (ảnh)
      if (req.files['thumbnail']) {
        result.thumbnail = await uploadToCloudinary(
          req.files['thumbnail'][0].buffer,
          'products/thumbnails',
          { resource_type: 'image' }
        );
      }

      // Upload demo video
      if (req.files['demo_video']) {
        result.video = await uploadToCloudinary(
          req.files['demo_video'][0].buffer,
          'products/videos',
          { resource_type: 'video' }
        );
      }

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ==========================================
// VÍ DỤ 3: Upload nhiều videos
// ==========================================
const { uploadMultipleVideos } = require('../src/config/multer');

router.post(
  '/videos/multiple',
  uploadMultipleVideos('videos', 5), // Tối đa 5 videos
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'Không có file video' });
      }

      // Upload tất cả videos song song
      const uploadPromises = req.files.map(file =>
        uploadToCloudinary(file.buffer, 'videos/gallery', { resource_type: 'video' })
      );

      const videoUrls = await Promise.all(uploadPromises);

      res.json({
        success: true,
        count: videoUrls.length,
        videoUrls,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

module.exports = router;
