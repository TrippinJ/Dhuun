// backend/routes/adminFinanceRoutes.js
import express from 'express';
import { authenticateUser } from './auth.js';
import * as adminFinanceController from '../controllers/adminFinanceController.js';

const router = express.Router();

// Protect all routes with authentication and admin check
router.use(authenticateUser);

// Admin routes
router.get('/overview', adminFinanceController.getFinanceOverview);
router.get('/top-sellers', adminFinanceController.getTopSellers);

export default router;