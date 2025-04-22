import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authenticateUser } from '../routes/auth.js';
import Beat from '../models/beat.js';
import User from '../models/user.js';
import { v2 as cloudinary } from 'cloudinary';
import * as beatController from '../controllers/beatController.js';

// Get current file directory equivalent for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure Cloudinary with credentials from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Setup temporary storage for file uploads before sending to Cloudinary
const tempDir = path.join(__dirname, '../temp_uploads');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Configure multer to temporarily store files before uploading to Cloudinary
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Set up file filter to only accept certain file types
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'audio') {
    // Accept only audio files
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed!'), false);
    }
  } else if (file.fieldname === 'coverImage') {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
};

// Set up multer with storage and file filter
const upload = multer({ 
  storage: storage, 
  fileFilter: fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // Limit file size to 50MB
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // A multer error occurred when uploading
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 50MB.' });
    }
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  } else if (err) {
    // A different error occurred
    return res.status(400).json({ message: err.message });
  }
  next();
};

// Helper function to upload file to Cloudinary
const uploadToCloudinary = async (filePath, folder) => {
  try {
    // Determine resource type based on file extension
    const ext = path.extname(filePath).toLowerCase();
    const resourceType = ['.mp3', '.wav', '.ogg'].includes(ext) ? 'video' : 'image';
    
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: resourceType,
      folder: folder,
      use_filename: true,
      unique_filename: true
    });
    
    // Delete the temp file after upload
    fs.unlinkSync(filePath);
    
    return result;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

// Helper function to delete file from Cloudinary
const deleteFromCloudinary = async (publicId, resourceType) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, { 
      resource_type: resourceType 
    });
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
};

// Helper function to extract public ID from Cloudinary URL
const getPublicIdFromUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  if (!url.includes('cloudinary.com')) return null;
  
  // Example URL: https://res.cloudinary.com/cloud-name/image/upload/v1234567890/folder/filename.jpg
  const urlParts = url.split('/');
  const uploadIndex = urlParts.indexOf('upload');
  
  if (uploadIndex === -1) return null;
  
  // Get everything after "upload" excluding the version and file extension
  const publicIdWithVersion = urlParts.slice(uploadIndex + 1).join('/');
  const publicId = publicIdWithVersion.replace(/^v\d+\//, '').replace(/\.[^/.]+$/, '');
  
  return publicId;
};

const router = express.Router();

// Get all beats (public route)
router.get('/', async (req, res) => {
  try {
    const beats = await Beat.find(
      {
        isExclusiveSold: { $ne: true } 
      }
    )
      .populate('producer', 'name username')
      .sort({ createdAt: -1 });
    
    res.json(beats);
  } catch (error) {
    console.error('Error fetching beats:', error);
    res.status(500).json({ message: 'Server error while fetching beats' });
  }
});

// Get trending beats - IMPORTANT: This must come BEFORE the /:id route
router.get('/trending', beatController.getTrendingBeats);

// Get beats by producer (authorized route)
router.get('/producer/beats', authenticateUser, async (req, res) => {
  try {
    const beats = await Beat.find({ producer: req.user.id })
      .sort({ createdAt: -1 });
    
    res.json(beats);
  } catch (error) {
    console.error('Error fetching producer beats:', error);
    res.status(500).json({ message: 'Server error while fetching beats' });
  }
});

// Get a single beat by ID (public route) - This must come AFTER specific routes like /trending
router.get('/:id', async (req, res) => {
  try {
    const beat = await Beat.findById(req.params.id)
      .populate('producer', 'name username');
    
    if (!beat) {
      return res.status(404).json({ message: 'Beat not found' });
    }
    
    res.json(beat);
  } catch (error) {
    console.error('Error fetching beat:', error);
    res.status(500).json({ message: 'Server error while fetching beat' });
  }
});

// Create new beat (authorized route) with Cloudinary upload
router.post('/', authenticateUser, upload.fields([
  { name: 'audio', maxCount: 1 },
  { name: 'coverImage', maxCount: 1 }
]), handleMulterError, async (req, res) => {
  try {
    // Check user's upload limit based on subscription
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Count user's existing beats
    const beatCount = await Beat.countDocuments({ producer: req.user.id });
    
    // Get upload limit from user's subscription (default to 5 if not defined)
    const uploadLimit = user.subscription?.uploadLimit || 5;
    
    // Check if user has reached their upload limit
    if (beatCount >= uploadLimit) {
      return res.status(403).json({ 
        message: `You've reached your upload limit of ${uploadLimit} beats. Please upgrade your subscription to upload more.` 
      });
    }
    
    // Process tags if provided
    let tags = [];
    if (req.body.tags) {
      tags = Array.isArray(req.body.tags) 
        ? req.body.tags 
        : req.body.tags.split(',').map(tag => tag.trim());
    }

    // Validate required fields
    if (!req.body.title || !req.body.genre || !req.body.price || !req.body.licenseType) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate files
    if (!req.files.audio || !req.files.coverImage) {
      return res.status(400).json({ message: 'Both audio file and cover image are required' });
    }
    
    // Upload files to Cloudinary
    const audioFile = req.files.audio[0];
    const imageFile = req.files.coverImage[0];
    
    console.log(`⏳ Uploading audio to Cloudinary: ${audioFile.path}`);
    const audioResult = await uploadToCloudinary(
      audioFile.path, 
      `dhuun/audio/${req.user.id}`
    );
    
    console.log(`⏳ Uploading cover image to Cloudinary: ${imageFile.path}`);
    const imageResult = await uploadToCloudinary(
      imageFile.path,
      `dhuun/images/${req.user.id}`
    );
    let licenseTypes = [];
    if (req.body.licenseTypes) {
      try {
        licenseTypes = JSON.parse(req.body.licenseTypes);
      } catch (error) {
        console.error('Error parsing license types:', error);
      }
    }
    
    // Create a new beat with Cloudinary URLs and public IDs
    const newBeat = new Beat({
      title: req.body.title,
      producer: req.user.id,
      genre: req.body.genre,
      bpm: req.body.bpm || null,
      key: req.body.key || null,
      tags: tags,
      price: parseFloat(req.body.price),
      licenseType: licenseTypes,
      description: req.body.description || '',
      // Store Cloudinary URLs
      audioFile: audioResult.secure_url,
      audioPublicId: audioResult.public_id,
      coverImage: imageResult.secure_url,
      imagePublicId: imageResult.public_id
    });
    
    // Save the beat
    await newBeat.save();
    
    res.status(201).json({
      message: 'Beat uploaded successfully',
      beat: {
        id: newBeat._id,
        title: newBeat.title,
        genre: newBeat.genre,
        price: newBeat.price,
        audioFile: newBeat.audioFile,
        coverImage: newBeat.coverImage
      }
    });
  } catch (error) {
    console.error('Error uploading beat:', error);
    
    // Clean up temp files if they still exist
    if (req.files) {
      Object.keys(req.files).forEach(key => {
        req.files[key].forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      });
    }
    
    res.status(500).json({ message: 'Server error while uploading beat' });
  }
});

// Update a beat (authorized route)
router.put('/:id', authenticateUser, upload.fields([
  { name: 'audio', maxCount: 1 },
  { name: 'coverImage', maxCount: 1 }
]), handleMulterError, async (req, res) => {
  try {
    const beat = await Beat.findById(req.params.id);
    
    if (!beat) {
      return res.status(404).json({ message: 'Beat not found' });
    }
    
    // Check if user is the producer of the beat
    if (beat.producer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to update this beat' });
    }
    
    // Process tags if provided
    let tags = beat.tags;
    if (req.body.tags) {
      tags = Array.isArray(req.body.tags) 
        ? req.body.tags 
        : req.body.tags.split(',').map(tag => tag.trim());
    }
    
    // Update allowed fields
    if (req.body.title) beat.title = req.body.title;
    if (req.body.genre) beat.genre = req.body.genre;
    if (req.body.bpm) beat.bpm = req.body.bpm;
    if (req.body.key) beat.key = req.body.key;
    if (req.body.price) beat.price = parseFloat(req.body.price);
    if (req.body.licenseType) beat.licenseType = req.body.licenseType;
    if (req.body.description) beat.description = req.body.description;
    beat.tags = tags;
    
    // Handle file updates if new files are provided
    if (req.files) {
      // Update audio file if provided
      if (req.files.audio && req.files.audio[0]) {
        const audioFile = req.files.audio[0];
        
        // Upload new audio to Cloudinary
        const audioResult = await uploadToCloudinary(
          audioFile.path, 
          `dhuun/audio/${req.user.id}`
        );
        
        // Delete old audio file from Cloudinary if it exists
        if (beat.audioPublicId) {
          await deleteFromCloudinary(beat.audioPublicId, 'video');
        }
        
        // Update beat with new audio info
        beat.audioFile = audioResult.secure_url;
        beat.audioPublicId = audioResult.public_id;
      }
      
      // Update cover image if provided
      if (req.files.coverImage && req.files.coverImage[0]) {
        const imageFile = req.files.coverImage[0];
        
        // Upload new image to Cloudinary
        const imageResult = await uploadToCloudinary(
          imageFile.path, 
          `dhuun/images/${req.user.id}`
        );
        
        // Delete old image from Cloudinary if it exists
        if (beat.imagePublicId) {
          await deleteFromCloudinary(beat.imagePublicId, 'image');
        }
        
        // Update beat with new image info
        beat.coverImage = imageResult.secure_url;
        beat.imagePublicId = imageResult.public_id;
      }
    }
    
    // Save the updated beat
    await beat.save();
    
    res.json({
      message: 'Beat updated successfully',
      beat: {
        id: beat._id,
        title: beat.title,
        genre: beat.genre,
        price: beat.price,
        audioFile: beat.audioFile,
        coverImage: beat.coverImage
      }
    });
  } catch (error) {
    console.error('Error updating beat:', error);
    
    // Clean up temp files if they still exist
    if (req.files) {
      Object.keys(req.files).forEach(key => {
        req.files[key].forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      });
    }
    
    res.status(500).json({ message: 'Server error while updating beat' });
  }
});

// Delete a beat (authorized route)
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const beat = await Beat.findById(req.params.id);
    
    if (!beat) {
      return res.status(404).json({ message: 'Beat not found' });
    }
    
    // Check if user is the producer of the beat
    if (beat.producer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to delete this beat' });
    }
    
    // Delete files from Cloudinary
    try {
      // Delete audio file from Cloudinary
      if (beat.audioPublicId) {
        await deleteFromCloudinary(beat.audioPublicId, 'video');
      }
      
      // Delete image file from Cloudinary
      if (beat.imagePublicId) {
        await deleteFromCloudinary(beat.imagePublicId, 'image');
      }
    } catch (cloudinaryError) {
      console.error('Error deleting files from Cloudinary:', cloudinaryError);
      // Continue with beat deletion even if Cloudinary deletion fails
    }
    
    // Delete the beat from the database
    await Beat.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Beat deleted successfully' });
  } catch (error) {
    console.error('Error deleting beat:', error);
    res.status(500).json({ message: 'Server error while deleting beat' });
  }
});

// Increment play count
router.post('/:id/play', async (req, res) => {
  try {
    const beat = await Beat.findById(req.params.id);
    
    if (!beat) {
      return res.status(404).json({ message: 'Beat not found' });
    }
    
    // Increment play count
    beat.plays = (beat.plays || 0) + 1;
    await beat.save();
    
    res.json({ plays: beat.plays });
  } catch (error) {
    console.error('Error incrementing play count:', error);
    res.status(500).json({ message: 'Server error while tracking play count' });
  }
});

// Like a beat (authorized route)
router.post('/:id/like', authenticateUser, async (req, res) => {
  try {
    const beat = await Beat.findById(req.params.id);
    
    if (!beat) {
      return res.status(404).json({ message: 'Beat not found' });
    }
    
    // Increment likes
    beat.likes = (beat.likes || 0) + 1;
    await beat.save();
    
    res.json({ likes: beat.likes });
  } catch (error) {
    console.error('Error liking beat:', error);
    res.status(500).json({ message: 'Server error while liking beat' });
  }
});

export default router;