// backend/routes/adminRoutes.js
import express from 'express';
import { authenticateUser } from './auth.js';
import * as adminController from '../controllers/adminController.js';

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
router.patch('/users/:id', adminController.updateUser);

// Beat management routes
router.get('/beats', adminController.getBeats);
router.patch('/beats/:id', adminController.updateBeat);
router.delete('/beats/:id', adminController.deleteBeat);

// Order management routes
router.get('/orders', adminController.getOrders);

// Setting management routes
router.get('/settings', adminController.getSettings);
router.put('/settings', adminController.updateSettings);

export default router;