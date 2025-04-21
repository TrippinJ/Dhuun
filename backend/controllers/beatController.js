import Beat from '../models/beat.js';
import { uploadFileToCloudinary, deleteFile, RESOURCE_TYPES } from '../utils/storageManger.js';
import fs from 'fs';

/**
 * Create and upload a new beat
 * @route POST /api/beats
 * @access Private
 */
export const createBeat = async (req, res) => {
  try {
    // Extract beat data from request body
    const { title, genre, bpm, price, description, key, mood, tags } = req.body;

    // Validate required files
    if (!req.files || !req.files.audio || !req.files.coverImage) {
      return res.status(400).json({
        success: false,
        message: 'Both audio file and cover image are required'
      });
    }

    // Get file information
    const audioFile = req.files.audio[0];
    const imageFile = req.files.coverImage[0];

    // Upload files to Cloudinary
    console.log(`⏳ Uploading audio file: ${audioFile.path}`);
    const audioResult = await uploadFileToCloudinary(
      audioFile.path,
      true // isAudio = true
    );

    console.log(`⏳ Uploading cover image: ${imageFile.path}`);
    const imageResult = await uploadFileToCloudinary(
      imageFile.path,
      false // isAudio = false
    );

    // Process tags if provided
    let processedTags = [];
    if (tags && typeof tags === 'string') {
      processedTags = tags.split(',').map(tag => tag.trim().toLowerCase());
    }

    // Create new beat document
    const newBeat = new Beat({
      title,
      genre,
      bpm: parseInt(bpm),
      price: parseFloat(price),
      description,
      key,
      mood,
      tags: processedTags,
      producer: req.user.id,
      // Store both URL and public ID for future reference
      audioFile: audioResult.url,
      audioPublicId: audioResult.publicId,
      coverImage: imageResult.url,
      imagePublicId: imageResult.publicId
    });

    // Save to database
    await newBeat.save();

    res.status(201).json({
      success: true,
      message: 'Beat uploaded successfully',
      beat: newBeat
    });
  } catch (error) {
    console.error('Beat upload error:', error);

    // Clean up any temporary files that might still exist
    if (req.files) {
      if (req.files.audio && req.files.audio[0] && fs.existsSync(req.files.audio[0].path)) {
        fs.unlinkSync(req.files.audio[0].path);
      }

      if (req.files.coverImage && req.files.coverImage[0] && fs.existsSync(req.files.coverImage[0].path)) {
        fs.unlinkSync(req.files.coverImage[0].path);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Failed to upload beat',
      error: error.message
    });
  }
};

/**
 * Get all beats with filtering options
 * @route GET /api/beats
 * @access Public
 */
export const getAllBeats = async (req, res) => {
  try {
    // Extract query parameters for filtering
    const {
      genre,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      limit = 20,
      page = 1
    } = req.query;

    // Build filter object
    const filter = { 
      isPublished: true,
      isExclusiveSold: { $ne: true }  
    };

    if (genre) {
      filter.genre = genre;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice !== undefined) filter.price.$lte = parseFloat(maxPrice);
    }

    // Add text search if provided
    if (search) {
      filter.$text = { $search: search };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const beats = await Beat.find(filter)
      .populate('producer', 'name username')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Beat.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: beats.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: beats
    });
  } catch (error) {
    console.error('Error fetching beats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching beats',
      error: error.message
    });
  }
};

/**
 * Get beat by ID
 * @route GET /api/beats/:id
 * @access Public
 */
export const getBeatById = async (req, res) => {
  try {
    const beat = await Beat.findById(req.params.id)
      .populate('producer', 'name username');

    if (!beat) {
      return res.status(404).json({
        success: false,
        message: 'Beat not found'
      });
    }

    res.status(200).json({
      success: true,
      data: beat
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching beat',
      error: error.message
    });
  }
};

/**
 * Get beats by producer
 * @route GET /api/beats/producer/:producerId
 * @access Public
 */
export const getBeatsByProducer = async (req, res) => {
  try {
    // Handle special 'me' parameter for own beats
    const producerId = req.params.producerId === 'me'
      ? req.user.id
      : req.params.producerId;

    // Get optional query parameters
    const { limit = 20, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter
    const filter = { producer: producerId };

    // Only show published beats for other producers, show all for own beats
    if (req.user && producerId === req.user.id) {
      // Show all beats for the current user
    } else {
      filter.isPublished = true;
      filter.isExclusiveSold = { $ne: true };
    }

    // Get beats with pagination
    const beats = await Beat.find(filter)
      .populate('producer', 'name username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Beat.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: beats.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: beats
    });
  } catch (error) {
    console.error('Error fetching producer beats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching producer beats',
      error: error.message
    });
  }
};

/**
 * Update beat details
 * @route PUT /api/beats/:id
 * @access Private
 */
export const updateBeat = async (req, res) => {
  try {
    const beatId = req.params.id;
    const { title, genre, bpm, price, description, key, mood, tags, isPublished } = req.body;

    // Make sure the beat exists and belongs to this user
    const beat = await Beat.findOne({
      _id: beatId,
      producer: req.user.id
    });

    if (!beat) {
      return res.status(404).json({
        success: false,
        message: 'Beat not found or you do not have permission to update it'
      });
    }

    // Process updates
    const updates = {};

    if (title !== undefined) updates.title = title;
    if (genre !== undefined) updates.genre = genre;
    if (bpm !== undefined) updates.bpm = parseInt(bpm);
    if (price !== undefined) updates.price = parseFloat(price);
    if (description !== undefined) updates.description = description;
    if (key !== undefined) updates.key = key;
    if (mood !== undefined) updates.mood = mood;
    if (isPublished !== undefined) updates.isPublished = isPublished;

    // Handle tags if provided
    if (tags !== undefined) {
      if (typeof tags === 'string') {
        updates.tags = tags.split(',').map(tag => tag.trim().toLowerCase());
      } else if (Array.isArray(tags)) {
        updates.tags = tags.map(tag => tag.trim().toLowerCase());
      }
    }

    // Update files if provided
    if (req.files) {
      // Handle audio file update
      if (req.files.audio) {
        // Upload new audio
        const audioResult = await uploadFileToCloudinary(
          req.files.audio[0].path,
          true // isAudio = true
        );

        // Delete old audio file from Cloudinary
        await deleteFile(beat.audioPublicId, RESOURCE_TYPES.AUDIO);

        // Update with new audio info
        updates.audioFile = audioResult.url;
        updates.audioPublicId = audioResult.publicId;
      }

      // Handle cover image update
      if (req.files.coverImage) {
        // Upload new image
        const imageResult = await uploadFileToCloudinary(
          req.files.coverImage[0].path,
          false // isAudio = false
        );

        // Delete old image from Cloudinary
        await deleteFile(beat.imagePublicId, RESOURCE_TYPES.IMAGE);

        // Update with new image info
        updates.coverImage = imageResult.url;
        updates.imagePublicId = imageResult.publicId;
      }
    }

    // Update the beat
    const updatedBeat = await Beat.findByIdAndUpdate(
      beatId,
      updates,
      { new: true, runValidators: true }
    ).populate('producer', 'name username');

    res.status(200).json({
      success: true,
      message: 'Beat updated successfully',
      data: updatedBeat
    });
  } catch (error) {
    console.error('Error updating beat:', error);

    // Clean up any temporary files
    if (req.files) {
      if (req.files.audio && req.files.audio[0] && fs.existsSync(req.files.audio[0].path)) {
        fs.unlinkSync(req.files.audio[0].path);
      }

      if (req.files.coverImage && req.files.coverImage[0] && fs.existsSync(req.files.coverImage[0].path)) {
        fs.unlinkSync(req.files.coverImage[0].path);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Error updating beat',
      error: error.message
    });
  }
};

/**
 * Delete beat
 * @route DELETE /api/beats/:id
 * @access Private
 */
export const deleteBeat = async (req, res) => {
  try {
    const beatId = req.params.id;

    // Find beat and check ownership
    const beat = await Beat.findOne({
      _id: beatId,
      producer: req.user.id
    });

    if (!beat) {
      return res.status(404).json({
        success: false,
        message: 'Beat not found or you do not have permission to delete it'
      });
    }

    // Delete files from Cloudinary
    try {
      if (beat.audioPublicId) {
        await deleteFile(beat.audioPublicId, RESOURCE_TYPES.AUDIO);
      }

      if (beat.imagePublicId) {
        await deleteFile(beat.imagePublicId, RESOURCE_TYPES.IMAGE);
      }
    } catch (cloudinaryError) {
      console.error('Error deleting files from Cloudinary:', cloudinaryError);
      // Continue with beat deletion even if Cloudinary deletion fails
    }

    // Delete from database
    await Beat.findByIdAndDelete(beatId);

    res.status(200).json({
      success: true,
      message: 'Beat deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting beat:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting beat',
      error: error.message
    });
  }
};

/**
 * Increment play count
 * @route POST /api/beats/:id/play
 * @access Public
 */
export const incrementPlayCount = async (req, res) => {
  try {
    const beatId = req.params.id;

    const updatedBeat = await Beat.findByIdAndUpdate(
      beatId,
      { $inc: { plays: 1 } }, // Increment plays by 1
      { new: true }
    );

    if (!updatedBeat) {
      return res.status(404).json({
        success: false,
        message: 'Beat not found'
      });
    }

    res.status(200).json({
      success: true,
      plays: updatedBeat.plays
    });
  } catch (error) {
    console.error('Error incrementing play count:', error);
    res.status(500).json({
      success: false,
      message: 'Error tracking play count',
      error: error.message
    });
  }
};

/**
 * Get featured beats
 * @route GET /api/beats/featured
 * @access Public
 */
export const getFeaturedBeats = async (req, res) => {
  try {
    const featuredBeats = await Beat.find({
      isPublished: true,
      isFeatured: true,
      isExclusiveSold: { $ne: true }
    })
      .populate('producer', 'name username')
      .sort({ createdAt: -1 })
      .limit(8);

    res.status(200).json({
      success: true,
      count: featuredBeats.length,
      data: featuredBeats
    });
  } catch (error) {
    console.error('Error fetching featured beats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured beats',
      error: error.message
    });
  }
};

/**
 * Get trending beats (most played)
 * @route GET /api/beats/trending
 * @access Public
 */
export const getTrendingBeats = async (req, res) => {
  try {
    console.log('Fetching trending beats...');

    // Find beats that are most played AND not exclusively sold
    const trendingBeats = await Beat.find({
      isExclusiveSold: { $ne: true } // NEW CODE: Exclude exclusively sold beats
    })
      .populate('producer', 'name username')
      .sort({ plays: -1, createdAt: -1 })
      .limit(8);

    console.log(`Found ${trendingBeats.length} trending beats`);

    res.json({
      success: true,
      count: trendingBeats.length,
      data: trendingBeats
    });
  } catch (error) {
    console.error('Error fetching trending beats:', error);

    // Return hardcoded sample data as fallback
    const sampleBeats = [
      {
        _id: "sample1",
        title: "Summer Vibes",
        producer: { name: "DJ Beats", _id: "producer1" },
        coverImage: "https://via.placeholder.com/300x300",
        price: 19.99,
        plays: 1200
      },
      {
        _id: "sample2",
        title: "Trap Nation",
        producer: { name: "Beat Master", _id: "producer2" },
        coverImage: "https://via.placeholder.com/300x300",
        price: 24.99,
        plays: 980
      },
      {
        _id: "sample3",
        title: "Chill Lofi",
        producer: { name: "Lofi Guy", _id: "producer3" },
        coverImage: "https://via.placeholder.com/300x300",
        price: 14.99,
        plays: 870
      }
    ];

    res.json({
      success: true,
      count: sampleBeats.length,
      data: sampleBeats
    });
  }
};

/**
 * Toggle featured status (admin only)
 * @route PATCH /api/beats/:id/featured
 * @access Private/Admin
 */
export const toggleFeaturedStatus = async (req, res) => {
  try {
    const beatId = req.params.id;

    // Find the beat
    const beat = await Beat.findById(beatId);

    if (!beat) {
      return res.status(404).json({
        success: false,
        message: 'Beat not found'
      });
    }

    // Toggle featured status
    beat.isFeatured = !beat.isFeatured;
    await beat.save();

    res.status(200).json({
      success: true,
      message: `Beat ${beat.isFeatured ? 'featured' : 'unfeatured'} successfully`,
      isFeatured: beat.isFeatured
    });
  } catch (error) {
    console.error('Error toggling featured status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating featured status',
      error: error.message
    });
  }
};