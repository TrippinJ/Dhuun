
import express from 'express';
import { authenticateUser } from './auth.js';
import * as reviewController from '../controllers/reviewController.js';

const router = express.Router();

// Submit a new review (requires authentication)
router.post('/', authenticateUser, reviewController.createReview);

// Get reviews for a specific beat (public)
router.get('/beat/:beatId', reviewController.getBeatReviews);

// Get testimonials for the landing page (public)
router.get('/testimonials', reviewController.getTestimonials);

// Admin routes (require authentication and admin role)
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
  next();
};

// Get all reviews for admin (admin only)
router.get('/admin', authenticateUser, isAdmin, reviewController.getAdminReviews);

// Update review status (admin only)
router.patch('/admin/:reviewId', authenticateUser, isAdmin, reviewController.updateReviewStatus);

export default router;