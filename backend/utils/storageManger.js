//utils/storagemanager.js
const fs = require('fs');
const path = require('path');
const User = require('../models/user');
const Beat = require('../models/beat');

/**
 * Calculate user's storage usage
 * @param {string} userId - User ID
 * @returns {Promise<number>} Total storage used in bytes
 */
exports.calculateUserStorage = async (userId) => {
  try {
    // Get all beats by this user
    const beats = await Beat.find({ producer: userId });
    
    let totalSize = 0;
    
    for (const beat of beats) {
      if (fs.existsSync(beat.audioFile)) {
        const audioSize = fs.statSync(beat.audioFile).size;
        totalSize += audioSize;
      }
      
      if (fs.existsSync(beat.coverImage)) {
        const imageSize = fs.statSync(beat.coverImage).size;
        totalSize += imageSize;
      }
    }
    
    return totalSize;
  } catch (error) {
    console.error('Error calculating storage:', error);
    throw error;
  }
};

/**
 * Check if user has enough storage space left
 * @param {string} userId - User ID
 * @param {number} fileSize - Size of the file to be added in bytes
 * @returns {Promise<boolean>} Whether user has enough storage
 */
exports.hasEnoughStorage = async (userId, fileSize) => {
  try {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    
    const storageLimit = user.subscription?.storageLimit || 500 * 1024 * 1024; // Default 500MB
    const currentUsage = user.stats.totalStorage || 0;
    
    return (currentUsage + fileSize) <= storageLimit;
  } catch (error) {
    console.error('Error checking storage:', error);
    throw error;
  }
};

/**
 * Update user's storage usage
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
exports.updateUserStorage = async (userId) => {
  try {
    const totalSize = await this.calculateUserStorage(userId);
    
    await User.findByIdAndUpdate(userId, {
      'stats.totalStorage': totalSize
    });
  } catch (error) {
    console.error('Error updating storage stats:', error);
    throw error;
  }
};

/**
 * Clean up unused files
 * @param {string} userId - User ID (optional, cleans for all users if not provided)
 * @returns {Promise<number>} Number of bytes freed
 */
exports.cleanupUnusedFiles = async (userId) => {
  try {
    let query = {};
    if (userId) query.producer = userId;
    
    const beats = await Beat.find(query);
    const validFiles = new Set();
    
    // Collect all valid files
    beats.forEach(beat => {
      validFiles.add(beat.audioFile);
      validFiles.add(beat.coverImage);
    });
    
    let bytesFreed = 0;
    
    // Check user directories
    const uploadsDir = path.join(__dirname, '../uploads/users');
    
    if (!fs.existsSync(uploadsDir)) return bytesFreed;
    
    const userDirs = userId 
      ? [path.join(uploadsDir, userId)]
      : fs.readdirSync(uploadsDir).map(dir => path.join(uploadsDir, dir));
    
    for (const userDir of userDirs) {
      if (!fs.existsSync(userDir) || !fs.statSync(userDir).isDirectory()) continue;
      
      // Check audio directory
      const audioDir = path.join(userDir, 'audio');
      if (fs.existsSync(audioDir)) {
        const audioFiles = fs.readdirSync(audioDir);
        for (const file of audioFiles) {
          const filePath = path.join(audioDir, file);
          if (!validFiles.has(filePath)) {
            const size = fs.statSync(filePath).size;
            fs.unlinkSync(filePath);
            bytesFreed += size;
          }
        }
      }
      
      // Check images directory
      const imagesDir = path.join(userDir, 'images');
      if (fs.existsSync(imagesDir)) {
        const imageFiles = fs.readdirSync(imagesDir);
        for (const file of imageFiles) {
          const filePath = path.join(imagesDir, file);
          if (!validFiles.has(filePath)) {
            const size = fs.statSync(filePath).size;
            fs.unlinkSync(filePath);
            bytesFreed += size;
          }
        }
      }
    }
    
    return bytesFreed;
  } catch (error) {
    console.error('Error cleaning up files:', error);
    throw error;
  }
};