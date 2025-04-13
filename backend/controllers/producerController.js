// In backend/controllers/producerController.js

import User from "../models/user.js";

/**
 * Get featured producers
 * @route GET /api/producers/featured
 * @access Public
 */
export const getFeaturedProducers = async (req, res) => {
  try {
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
      // Limit to 10 producers
      { $limit: 10 },
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

