import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { uploadToCloudinary, deleteFromCloudinary, getPublicIdFromUrl } from './cloudinaryConfig.js';

// Resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define constants
const TEMP_UPLOAD_DIR = path.join(__dirname, '../temp_uploads');
const AUDIO_FOLDER = 'dhuun/audio';
const IMAGES_FOLDER = 'dhuun/images';

// Resource types for Cloudinary
const RESOURCE_TYPES = {
  AUDIO: 'video', // Cloudinary handles audio files under "video" resource type
  IMAGE: 'image'
};

// Ensure the temporary upload directory exists
const ensureTempDirExists = () => {
  if (!fs.existsSync(TEMP_UPLOAD_DIR)) {
    fs.mkdirSync(TEMP_UPLOAD_DIR, { recursive: true });
    console.log(`✅ Created temp upload directory: ${TEMP_UPLOAD_DIR}`);
  }
};

// Initialize storage system
const initializeStorage = () => {
  ensureTempDirExists();
  console.log('✅ Storage manager initialized with Cloudinary integration');
};

// Remove a temp file if it exists
const removeTempFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`✅ Removed temp file: ${filePath}`);
  }
};

// Clean up temporary files after a certain period
const cleanupTempFiles = (maxAgeMs = 24 * 60 * 60 * 1000) => {
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

    console.log('✅ Temp directory cleaned up');
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
    const fileExt = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
    cb(null, uniqueName);
  }
});

// File filter for multer
const fileFilter = (req, file, cb) => {
  const allowedAudioTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3'];
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (allowedAudioTypes.includes(file.mimetype) || allowedImageTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed types: MP3, WAV, JPG, PNG, WEBP`), false);
  }
};

// Multer upload middleware
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// Upload a file to Cloudinary
const uploadFileToCloudinary = async (filePath, isAudio = false, options = {}) => {
  try {
    const folder = isAudio ? AUDIO_FOLDER : IMAGES_FOLDER;
    const uploadOptions = { ...options };

    if (isAudio) {
      uploadOptions.resource_type = 'video';
    }

    const result = await uploadToCloudinary(filePath, folder, uploadOptions);
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

// Delete file from Cloudinary
const deleteFile = async (publicIdOrUrl, resourceType = RESOURCE_TYPES.IMAGE) => {
  try {
    let publicId = publicIdOrUrl;

    if (publicIdOrUrl.startsWith('http')) {
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

// ✅ Export ESM-style
export {
  initializeStorage,
  upload,
  uploadFileToCloudinary,
  deleteFile,
  cleanupTempFiles,
  AUDIO_FOLDER,
  IMAGES_FOLDER,
  RESOURCE_TYPES
};
