// backend/routes/withdrawalRoutes.js
import express from 'express';
import { authenticateUser } from './auth.js';
import * as withdrawalController from '../controllers/withdrawalController.js';

const router = express.Router();

// Protect all routes with authentication
router.use(authenticateUser);

// Get user's withdrawal requests
router.get('/', withdrawalController.getUserWithdrawals);

// Request a withdrawal
router.post('/', withdrawalController.requestWithdrawal);

export default router;