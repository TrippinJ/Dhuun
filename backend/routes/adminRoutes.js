import express from 'express';
import { authenticateUser } from './auth.js';
import * as adminController from '../controllers/adminController.js';
import * as verificationController from '../controllers/verificationController.js';
import { updateLogo, updateAboutSection, updateTestimonials } from '../controllers/adminController.js';
import { upload } from '../utils/storageManger.js'


const router = express.Router();

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
  next();
};

// Protect all admin routes with authentication and admin check
router.use(authenticateUser, isAdmin);

// Dashboard routes
router.get('/dashboard', adminController.getDashboardStats); 
router.get('/analytics', adminController.getAnalytics);

// User management routes
router.get('/users', adminController.getUsers);
router.get('/users/search', adminController.searchUsers); 
router.patch('/users/:id', adminController.updateUser);

// Beat management routes
router.get('/beats', adminController.getBeats);
router.get('/beats/search', adminController.searchBeats); 
router.delete('/beats/:id', adminController.deleteBeat);
router.patch('/beats/:id/featured', adminController.toggleFeaturedStatus);

// Order management routes
router.get('/orders', adminController.getOrders);

// Setting management routes
router.get('/settings', adminController.getSettings);
router.put('/settings', adminController.updateSettings);

// Verification routes
router.get('/verification/pending', verificationController.getPendingVerifications);
router.post('/verification/update', verificationController.updateVerificationStatus);

// Admin Settings
router.put('/settings/logo', upload.single('logo'), updateLogo);
router.put('/settings/about', updateAboutSection);
router.put('/settings/testimonials', updateTestimonials);

export default router;