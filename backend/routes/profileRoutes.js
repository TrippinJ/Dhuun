const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const Profile = require('../models/profile');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinaryConfig');

// Configure temporary storage for avatar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(__dirname, '../temp_uploads');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const fileExtension = path.extname(file.originalname);
    cb(null, 'avatar-' + uniqueSuffix + fileExtension);
  }
});

// Set up file filter to only accept image files
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Create multer upload middleware
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB limit
  }
});

// @route   GET api/profile/me
// @desc    Get current user's profile
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    // Look for existing profile
    let profile = await Profile.findOne({ user: req.user.id }).populate('user', 'name email');
    
    // If no profile exists, create a basic one
    if (!profile) {
      profile = new Profile({
        user: req.user.id,
        username: req.user.username || req.user.email.split('@')[0]
      });
      await profile.save();
    }
    
    res.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/profile/user/:username
// @desc    Get profile by username
// @access  Public
router.get('/user/:username', async (req, res) => {
  try {
    const profile = await Profile.findOne({ 
      username: req.params.username 
    }).populate('user', 'name email');
    
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    
    res.json(profile);
  } catch (error) {
    console.error('Error fetching profile by username:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT api/profile/update
// @desc    Update user profile
// @access  Private
router.put('/update', auth, upload.single('avatar'), async (req, res) => {
  try {
    const { username, bio, location, website, socialLinks } = req.body;
    
    // Check if username is already taken (if changing username)
    if (username) {
      const existingProfile = await Profile.findOne({ 
        username, 
        user: { $ne: req.user.id } 
      });
      
      if (existingProfile) {
        return res.status(400).json({ message: 'Username already taken' });
      }
    }
    
    // Find or create profile
    let profile = await Profile.findOne({ user: req.user.id });
    if (!profile) {
      profile = new Profile({
        user: req.user.id,
        username: username || req.user.email.split('@')[0]
      });
    }
    
    // Update profile fields
    if (username) profile.username = username;
    if (bio) profile.bio = bio;
    if (location) profile.location = location;
    if (website) profile.website = website;
    
    // Update social links if provided
    if (socialLinks) {
      try {
        const parsedLinks = typeof socialLinks === 'string' 
          ? JSON.parse(socialLinks) 
          : socialLinks;
        
        profile.socialLinks = {
          ...profile.socialLinks,
          ...parsedLinks
        };
      } catch (e) {
        return res.status(400).json({ message: 'Invalid social links format' });
      }
    }
    
    // Handle avatar upload if file was included
    if (req.file) {
      try {
        // Upload to Cloudinary
        const result = await uploadToCloudinary(
          req.file.path, 
          'dhuun/avatars'
        );
        
        // Delete old avatar if it exists
        if (profile.avatarPublicId) {
          await deleteFromCloudinary(profile.avatarPublicId);
        }
        
        // Update profile with new avatar
        profile.avatar = result.secure_url;
        profile.avatarPublicId = result.public_id;
        
        // Delete temp file
        fs.unlinkSync(req.file.path);
      } catch (uploadError) {
        console.error('Avatar upload error:', uploadError);
        // Clean up temp file if it exists
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({ message: 'Failed to upload avatar' });
      }
    }
    
    // Save updated profile
    await profile.save();
    
    res.json(profile);
  } catch (error) {
    console.error('Error updating profile:', error);
    
    // Clean up temp file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/profile/stats
// @desc    Get producer stats (beats uploaded, sold, etc)
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    
    res.json({
      stats: profile.stats
    });
  } catch (error) {
    console.error('Error fetching profile stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;