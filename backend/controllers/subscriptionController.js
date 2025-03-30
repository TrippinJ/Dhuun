// backend/controllers/subscriptionController.js

const User = require("../models/user");

// Get current user's subscription details
exports.getSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("subscription");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json({ subscription: user.subscription });
  } catch (error) {
    console.error("Error getting subscription:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update user subscription
exports.updateSubscription = async (req, res) => {
  try {
    const { plan } = req.body;
    
    if (!["Free", "Standard", "Pro"].includes(plan)) {
      return res.status(400).json({ message: "Invalid subscription plan" });
    }
    
    // Define plan details
    const planDetails = {
      Free: {
        uploadLimit: 5,
        revenueShare: 60,
        expiryDate: null
      },
      Standard: {
        uploadLimit: 50,
        revenueShare: 80,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      },
      Pro: {
        uploadLimit: Infinity,
        revenueShare: 95,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      }
    };
    
    // Update user subscription
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          "subscription.plan": plan,
          "subscription.status": "active",
          "subscription.expiryDate": planDetails[plan].expiryDate,
          "subscription.uploadLimit": planDetails[plan].uploadLimit,
          "subscription.revenueShare": planDetails[plan].revenueShare
        }
      },
      { new: true }
    );
    
    res.json({ 
      message: "Subscription updated successfully",
      subscription: user.subscription
    });
  } catch (error) {
    console.error("Error updating subscription:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// For future implementation: Verify payment and update subscription
exports.verifyPayment = async (req, res) => {
  try {
    const { token, amount, plan } = req.body;
    
    // TODO: Implement payment verification logic with your payment gateway
    // For now, we'll just update the subscription
    
    if (!["Standard", "Pro"].includes(plan)) {
      return res.status(400).json({ message: "Invalid subscription plan" });
    }
    
    // Define plan details
    const planDetails = {
      Standard: {
        uploadLimit: 50,
        revenueShare: 80,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      },
      Pro: {
        uploadLimit: Infinity,
        revenueShare: 95,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      }
    };
    
    // Update user subscription
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          "subscription.plan": plan,
          "subscription.status": "active",
          "subscription.expiryDate": planDetails[plan].expiryDate,
          "subscription.uploadLimit": planDetails[plan].uploadLimit,
          "subscription.revenueShare": planDetails[plan].revenueShare
        }
      },
      { new: true }
    );
    
    res.json({ 
      message: "Payment verified and subscription updated successfully",
      subscription: user.subscription
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};