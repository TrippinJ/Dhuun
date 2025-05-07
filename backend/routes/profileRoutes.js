// backend/routes/profileRoutes.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authenticateUser } from '../routes/auth.js';
import User from '../models/user.js';
import Profile from '../models/profile.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinaryConfig.js';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

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
router.get('/me', authenticateUser, async (req, res) => {
  try {
    console.log("Fetching profile for user:", req.user.id);

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

// @route   PUT api/profile/update
// @desc    Update user profile
// @access  Private
router.put('/update', authenticateUser, upload.single('avatar'), async (req, res) => {
  try {
    console.log("Profile update request for user:", req.user.id);
    console.log("Update data:", req.body);
    console.log("File uploaded:", req.file ? req.file.filename : "No file");

    const { name, username, phonenumber, bio, socialLinks } = req.body;

    // Update user's basic info
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user fields
    if (req.body.name) user.name = req.body.name;
    if (req.body.username) user.username = req.body.username;
    if (req.body.phonenumber) user.phonenumber = req.body.phonenumber;
    if (req.body.bio) user.bio = req.body.bio;

    // Find or create profile
    let profile = await Profile.findOne({ user: req.user.id });
    if (!profile) {
      profile = new Profile({
        user: req.user.id,
        username: username || user.username || user.email.split('@')[0]
      });
    }

    // Update profile fields
    if (bio) profile.bio = bio;

    // Handle social links if provided
    if (socialLinks) {
      let parsedLinks;

      try {
        // Handle case where socialLinks might be sent as a string
        parsedLinks = typeof socialLinks === 'string'
          ? JSON.parse(socialLinks)
          : socialLinks;
      } catch (e) {
        console.error("Error parsing social links:", e);
        parsedLinks = {};
      }

      // Check if we have social links in the expected format (individual fields)
      if (req.body['socialLinks[instagram]']) {
        profile.socialLinks = profile.socialLinks || {};
        profile.socialLinks.instagram = req.body['socialLinks[instagram]'];
        profile.socialLinks.twitter = req.body['socialLinks[twitter]'] || profile.socialLinks.twitter || '';
        profile.socialLinks.youtube = req.body['socialLinks[youtube]'] || profile.socialLinks.youtube || '';
        profile.socialLinks.soundcloud = req.body['socialLinks[soundcloud]'] || profile.socialLinks.soundcloud || '';
      }
      // Otherwise use the parsed object if it's valid
      else if (typeof parsedLinks === 'object') {
        profile.socialLinks = {
          ...profile.socialLinks,
          ...parsedLinks
        };
      }
    }

    // Handle avatar upload if file was included
    if (req.file) {
      try {
        console.log("Uploading avatar to Cloudinary");

        // Upload to Cloudinary
        const result = await uploadToCloudinary(
          req.file.path,
          'dhuun/avatars'
        );

        console.log("Cloudinary upload result:", result);

        // Delete old avatar if it exists
        if (user.avatarPublicId) {
          await deleteFromCloudinary(user.avatarPublicId);
        }

        // Update user with new avatar
        user.avatar = result.secure_url;
        user.avatarPublicId = result.public_id;

        // Also update profile avatar if it exists
        profile.avatar = result.secure_url;

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

    // Save both user and profile
    await user.save();
    await profile.save();

    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      phonenumber: user.phonenumber,
      avatar: user.avatar,
      role: user.role
    };

    res.json({
      message: 'Profile updated successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Error updating profile:', error);

    // Clean up temp file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ message: 'Server error' });
  }
});

export default router;