// In backend/routes/walletRoutes.js
import express from 'express';
import { authenticateUser } from '../routes/auth.js';
import * as walletController from '../controllers/walletController.js';

const router = express.Router();

// Protect all wallet routes
router.use(authenticateUser);

// Get wallet info - balance and recent transactions
router.get('/', walletController.getWallet);

// Get all transactions with pagination
router.get('/transactions', walletController.getTransactions);

// Request withdrawal
router.post('/withdraw', walletController.requestWithdrawal);

export default router;