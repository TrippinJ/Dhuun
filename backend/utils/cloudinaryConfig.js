import { v2 as cloudinary}  from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

// Configure Cloudinary with credentials from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

/**
 * Uploads a file to Cloudinary
 * @param {string} filePath - Path to the file on local server
 * @param {string} folder - Folder in Cloudinary to store the file
 * @param {Object} options - Additional upload options
 * @returns {Promise<Object>} - Cloudinary upload result
 */
const uploadToCloudinary = (filePath, folder, options = {}) => {
  return new Promise((resolve, reject) => {
    // Set default upload options
    const uploadOptions = {
      resource_type: "auto", // auto-detect whether it's image or video/audio
      folder: folder,        // organize files in folders
      use_filename: true,    // Use original filename as part of public ID
      unique_filename: true, // Add unique identifier to prevent overwriting
      overwrite: false,      // Don't overwrite existing files
      ...options             // Allow additional options to be passed
    };

    // Upload the file to Cloudinary
    cloudinary.uploader.upload(filePath, uploadOptions, (error, result) => {
      if (error) {
        console.error('Cloudinary upload error:', error);
        reject(error);
      } else {
        console.log(`✅ File uploaded to Cloudinary: ${result.public_id}`);
        resolve(result);
      }
    });
  });
};

/**
 * Deletes a file from Cloudinary
 * @param {string} publicId - Public ID of the file to delete
 * @param {string} resourceType - Resource type (image, video, raw)
 * @returns {Promise<Object>} - Deletion result
 */
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    console.log(`✅ File deleted from Cloudinary: ${publicId}`);
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

/**
 * Gets the public ID from a Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string|null} - Public ID or null if extraction fails
 */
const getPublicIdFromUrl = (url) => {
  try {
    if (!url || typeof url !== 'string') return null;
    
    // Check if it's a Cloudinary URL
    if (!url.includes('cloudinary.com')) return null;
    
    // Extract public ID from URL
    // Example URL: https://res.cloudinary.com/cloud-name/image/upload/v1234567890/folder/filename.jpg
    const urlParts = url.split('/');
    const uploadIndex = urlParts.indexOf('upload');
    
    if (uploadIndex === -1) return null;
    
    // Get everything after "upload" except the version number
    const publicIdWithVersion = urlParts.slice(uploadIndex + 1).join('/');
    
    // Remove file extension
    const publicIdWithoutExt = publicIdWithVersion.replace(/\.[^/.]+$/, '');
    
    // Remove version number if present (v1234567890/)
    const publicId = publicIdWithoutExt.replace(/^v\d+\//, '');
    
    return publicId;
  } catch (error) {
    console.error('Error extracting public ID:', error);
    return null;
  }
};

export {
  cloudinary,
  uploadToCloudinary,
  deleteFromCloudinary,
  getPublicIdFromUrl
};