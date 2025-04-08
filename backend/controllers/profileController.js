// backend/controllers/profileController.js

const User = require('../models/user');
const Profile = require('../models/profile');
const fs = require('fs');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinaryConfig');

// Get current user's profile
exports.getProfile = async (req, res) => {
  try {
    // Look for existing profile
    let profile = await Profile.findOne({ user: req.user.id });
    
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
};

// Get profile by username
exports.getProfileByUsername = async (req, res) => {
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
};

// Update profile
exports.updateProfile = async (req, res) => {
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
      profile.socialLinks = {
        ...profile.socialLinks,
        ...JSON.parse(socialLinks)
      };
    }
    
    // Handle avatar upload if file was included
    if (req.file) {
      try {
        // Upload to Cloudinary using your utility function
        const result = await uploadToCloudinary(
          req.file.path, 
          'dhuun/avatars', 
          {
            use_filename: true,
            unique_filename: true
          }
        );
        
        // Delete old avatar if it exists
        if (profile.avatar && profile.avatarPublicId) {
          await deleteFromCloudinary(profile.avatarPublicId);
        }
        
        // Update profile with new avatar
        profile.avatar = result.secure_url;
        profile.avatarPublicId = result.public_id;
        
        // Delete temp file
        fs.unlinkSync(req.file.path);
      } catch (uploadError) {
        console.error('Avatar upload error:', uploadError);
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
};