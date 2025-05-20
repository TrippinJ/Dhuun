
import Review from '../models/review.js';
import Beat from '../models/beat.js';
import Order from '../models/order.js';

// Submit a new review
export const createReview = async (req, res) => {
  try {
    const { beatId, orderId, rating, title, text } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!beatId || !rating || !text) {
      return res.status(400).json({
        success: false,
        message: 'Beat ID, rating, and review text are required'
      });
    }

    // Verify the user purchased this beat (optional, but recommended)
    if (orderId) {
      const order = await Order.findOne({
        _id: orderId,
        user: userId,
        'items.beat': beatId
      });

      if (!order) {
        return res.status(403).json({
          success: false,
          message: 'You can only review beats that you have purchased'
        });
      }
    }

    // Check if the user already reviewed this beat
    const existingReview = await Review.findOne({
      user: userId,
      beat: beatId
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this beat'
      });
    }

    // Create the review
    const review = new Review({
      user: userId,
      beat: beatId,
      order: orderId,
      rating,
      title: title || '',
      text,
      status: 'pending' // All reviews start as pending for admin approval
    });

    await review.save();

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully and awaiting approval',
      review
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit review',
      error: error.message
    });
  }
};

// Get reviews for a beat
export const getBeatReviews = async (req, res) => {
  try {
    const { beatId } = req.params;
    
    // Only return approved reviews
    const reviews = await Review.find({
      beat: beatId,
      status: 'approved'
    })
      .populate('user', 'name username avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: reviews.length,
      reviews
    });
  } catch (error) {
    console.error('Error fetching beat reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: error.message
    });
  }
};

// Get all reviews for the admin dashboard
export const getAdminReviews = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    
    // Filter by status if provided
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      filter.status = status;
    }
    
    const reviews = await Review.find(filter)
      .populate('user', 'name username email')
      .populate('beat', 'title')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: reviews.length,
      reviews
    });
  } catch (error) {
    console.error('Error fetching admin reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: error.message
    });
  }
};

// Update review status (admin only)
export const updateReviewStatus = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { status, adminNote } = req.body;
    
    // Validate status
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be approved or rejected'
      });
    }
    
    const review = await Review.findByIdAndUpdate(
      reviewId,
      { 
        status,
        adminNote: adminNote || ''
      },
      { new: true }
    );
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    res.json({
      success: true,
      message: `Review ${status}`,
      review
    });
  } catch (error) {
    console.error('Error updating review status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update review status',
      error: error.message
    });
  }
};

// Get testimonials for the landing page
export const getTestimonials = async (req, res) => {
  try {
    // Get the top-rated approved reviews
    const testimonials = await Review.find({ status: 'approved' })
      .populate('user', 'name username avatar')
      .populate('beat', 'title')
      .sort({ rating: -1 }) // Highest ratings first
      .limit(5); // Limit to 5 testimonials
    
    res.json({
      success: true,
      testimonials
    });
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch testimonials',
      error: error.message
    });
  }
};