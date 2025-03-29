const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { uploadToCloudinary, deleteFromCloudinary, getPublicIdFromUrl } = require('./cloudinaryConfig');

// Define constants
const TEMP_UPLOAD_DIR = path.join(__dirname, '../temp_uploads');
const AUDIO_FOLDER = 'dhuun/audio';
const IMAGES_FOLDER = 'dhuun/images';

// Resource types for Cloudinary
const RESOURCE_TYPES = {
  AUDIO: 'video',  // Cloudinary handles audio files under "video" resource type
  IMAGE: 'image'
};

/**
 * Ensure the temporary upload directory exists
 */
const ensureTempDirExists = () => {
  if (!fs.existsSync(TEMP_UPLOAD_DIR)) {
    fs.mkdirSync(TEMP_UPLOAD_DIR, { recursive: true });
    console.log(`✅ Created temp upload directory: ${TEMP_UPLOAD_DIR}`);
  }
};

/**
 * Initialize storage system
 */
const initializeStorage = () => {
  ensureTempDirExists();
  console.log('✅ Storage manager initialized with Cloudinary integration');
};

/**
 * Remove a temp file if it exists
 * @param {string} filePath - Path to the file to remove
 */
const removeTempFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`✅ Removed temp file: ${filePath}`);
  }
};

/**
 * Clean up temporary files after a certain period
 * @param {number} maxAgeMs - Maximum age of files in milliseconds
 */
const cleanupTempFiles = (maxAgeMs = 24 * 60 * 60 * 1000) => { // Default: 24 hours
  try {
    if (!fs.existsSync(TEMP_UPLOAD_DIR)) return;

    const files = fs.readdirSync(TEMP_UPLOAD_DIR);
    const now = Date.now();

    files.forEach(file => {
      const filePath = path.join(TEMP_UPLOAD_DIR, file);
      const stats = fs.statSync(filePath);
      const fileAge = now - stats.mtimeMs;

      if (fileAge > maxAgeMs) {
        removeTempFile(filePath);
      }
    });

    console.log(`✅ Temp directory cleaned up`);
  } catch (error) {
    console.error('Error cleaning up temp files:', error);
  }
};

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureTempDirExists();
    cb(null, TEMP_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Generate unique filename while preserving original extension
    const fileExt = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
    cb(null, uniqueName);
  }
});

// Filter to only accept specific file types
const fileFilter = (req, file, cb) => {
  const allowedAudioTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3'];
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedAudioTypes.includes(file.mimetype) || allowedImageTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed types: MP3, WAV, JPG, PNG, WEBP`), false);
  }
};

// Create multer upload middleware
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

/**
 * Upload a file to Cloudinary
 * @param {string} filePath - Path to the file
 * @param {boolean} isAudio - Whether the file is an audio file
 * @param {Object} options - Additional upload options
 * @returns {Promise<Object>} - Cloudinary upload result
 */
const uploadFileToCloudinary = async (filePath, isAudio = false, options = {}) => {
  try {
    const folder = isAudio ? AUDIO_FOLDER : IMAGES_FOLDER;
    
    // Additional options for audio files
    const uploadOptions = {
      ...options
    };
    
    // Add specific options for audio files
    if (isAudio) {
      uploadOptions.resource_type = 'video'; // Cloudinary handles audio files as 'video' type
    }
    
    // Upload to Cloudinary
    const result = await uploadToCloudinary(filePath, folder, uploadOptions);
    
    // Remove temp file after successful upload
    removeTempFile(filePath);
    
    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      resourceType: result.resource_type
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

/**
 * Delete a file from Cloudinary
 * @param {string} publicIdOrUrl - Public ID or URL of the file to delete
 * @param {string} resourceType - Resource type (image or video for audio)
 * @returns {Promise<Object>} - Cloudinary deletion result
 */
const deleteFile = async (publicIdOrUrl, resourceType = RESOURCE_TYPES.IMAGE) => {
  try {
    let publicId = publicIdOrUrl;
    
    // If a URL was provided, extract the public ID
    if (publicIdOrUrl && publicIdOrUrl.startsWith('http')) {
      publicId = getPublicIdFromUrl(publicIdOrUrl);
    }
    
    if (!publicId) {
      throw new Error('Invalid public ID or URL provided');
    }
    
    return await deleteFromCloudinary(publicId, resourceType);
  } catch (error) {
    console.error('Error deleting file from Cloudinary:', error);
    throw error;
  }
};

module.exports = {
  initializeStorage,
  upload,
  uploadFileToCloudinary,
  deleteFile,
  cleanupTempFiles,
  AUDIO_FOLDER,
  IMAGES_FOLDER,
  RESOURCE_TYPES
};