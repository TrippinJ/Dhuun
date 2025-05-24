// backend/routes/subscription.js
import express from "express";
import * as subscriptionController from "../controllers/subscriptionController.js";
import { authenticateUser } from "../routes/auth.js"; // Import your auth middleware

const router = express.Router();

// All routes are protected and require authentication
router.use(authenticateUser);

// Get user's current subscription
router.get("/", subscriptionController.getSubscription);

// Update subscription (for free plan or admin updates)
router.post("/update", subscriptionController.updateSubscription);

// Verify Khalti payment and update subscription (for paid plans)
router.post("/verify-payment", subscriptionController.verifyPayment);

// Verify Stripe payment and update subscription
router.post("/verify-stripe-payment", subscriptionController.verifyStripePayment);

// Get subscription analytics (admin only)
router.get("/analytics", subscriptionController.getSubscriptionAnalytics);

export default router;