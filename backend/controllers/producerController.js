// backend/controllers/producerController.js

import User from "../models/user.js";
import Settings from "../models/settings.js"; // NEW: Import Settings

/**
 * Get featured producers
 * @route GET /api/producers/featured
 * @access Public
 */
export const getFeaturedProducers = async (req, res) => {
  try {
    // NEW: Get the featured producers limit from settings
    const settings = await Settings.findOne();
    const limit = settings?.featuredProducersLimit || 10; // Default to 10 if not set
    
    // Find users with role 'seller' that have the most beats
    const featuredProducers = await User.aggregate([
      { $match: { role: 'seller' } },
      // Lookup beats by this producer
      {
        $lookup: {
          from: 'beats',
          localField: '_id',
          foreignField: 'producer',
          as: 'producerBeats'
        }
      },
      // Add fields for total beats and followers
      {
        $addFields: {
          beats: { $size: '$producerBeats' },
          followers: { $size: { $ifNull: ['$followers', []] } },
          // For demo purposes, we'll set verified randomly
          verified: { $gt: [{ $rand: {} }, 0.5] } // ~50% chance of being verified
        }
      },
      // Sort by most beats
      { $sort: { beats: -1 } },
      // Use dynamic limit from settings instead of hardcoded 6
      { $limit: limit },
      // Project only the fields we need
      {
        $project: {
          _id: 1,
          name: 1,
          username: 1,
          avatar: 1,
          verified: 1,
          beats: 1,
          followers: 1
        }
      }
    ]);
    
    res.status(200).json({
      success: true,
      count: featuredProducers.length,
      limit: limit, 
      data: featuredProducers
    });
  } catch (error) {
    console.error('Error fetching featured producers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured producers',
      error: error.message
    });
  }
};