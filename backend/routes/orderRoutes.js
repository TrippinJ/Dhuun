// backend/routes/orderRoutes.js
import express from 'express';
import * as orderController from '../controllers/orderController.js';
import { authenticateUser } from '../routes/auth.js';

const router = express.Router();

// Protect all order routes
router.use(authenticateUser);

// Create a new order
router.post('/', orderController.createOrder);

// Get user's orders
router.get('/', orderController.getUserOrders);

// Get a single order
router.get('/:id', orderController.getOrderById);

// Verify a Khalti payment
router.post('/verify-payment', orderController.verifyPaymentOrder);


export default router;