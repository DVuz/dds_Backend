const cloudinary = require("../config/cloudinary")

/**
  * delete a file from Cloudinary based on its public url
  * @param {string} fileUrl - Full Cloudinary file URL
  * @returns {Promise} - Resolves when deletion is complete
 */

const deleteFromCloudinary = async (fileUrl) => {
  try {
    // Validate input
    if (!fileUrl || typeof fileUrl !== 'string') {
      throw new Error('Invalid URL');
    }

    // Split URL into segments and locate the "upload" segment
    const urlParts = fileUrl.split('/');
    const uploadIndex = urlParts.indexOf('upload');

    if (uploadIndex === -1) {
      throw new Error('URL is not a Cloudinary URL');
    }

    // Get everything after 'upload/' (this includes version and folder + filename)
    let publicIdParts = urlParts.slice(uploadIndex + 1);

    // If the first segment is a version like "v123456789", remove it
    if (publicIdParts[0] && publicIdParts[0].startsWith('v')) {
      publicIdParts = publicIdParts.slice(1);
    }

    // Reconstruct the filename with extension (including any folder path)
    const filenameWithExt = publicIdParts.join('/');

    // Remove file extension if present to form the public_id
    const lastDot = filenameWithExt.lastIndexOf('.');
    const publicId = lastDot === -1 ? filenameWithExt : filenameWithExt.substring(0, lastDot);

    // Try deletion with common resource types
    const resourceTypes = ['image', 'video', 'raw'];
    for (const type of resourceTypes) {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: type,
        invalidate: true,
      });

      if (result && result.result === 'ok') {
        return result;
      }
    }

    // If none succeeded, return not found
    return { result: 'not found' };
  } catch (error) {
    console.error('Error deleting file from Cloudinary:', error);
    throw error;
  }
};

module.exports = deleteFromCloudinary;