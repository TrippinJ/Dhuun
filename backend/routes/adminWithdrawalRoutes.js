// backend/routes/adminWithdrawalRoutes.js
import express from 'express';
import { authenticateUser } from './auth.js';
import * as withdrawalController from '../controllers/withdrawalController.js';

const router = express.Router();

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
  next();
};

// Protect all routes with authentication and admin check
router.use(authenticateUser, isAdmin);

// Get pending withdrawals (admin route)
router.get('/pending', withdrawalController.getPendingWithdrawals);

// Process withdrawal (admin route)
router.post('/process', withdrawalController.processWithdrawal);

export default router;