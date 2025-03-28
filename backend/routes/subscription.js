// routes/subscription.js
const express = require("express");
const router = express.Router();
const subscriptionController = require("../controllers/subscriptionController");
const { authenticateUser } = require("../routes/auth"); // Import the auth middleware

// All routes are protected and require authentication
router.use(authenticateUser);

// Get user's current subscription
router.get("/", subscriptionController.getSubscription);

// Update subscription (for free plan or admin updates)
router.post("/update", subscriptionController.updateSubscription);

// Verify payment and update subscription (for paid plans)
router.post("/verify-payment", subscriptionController.verifyPayment);

// Export the router
module.exports = router;