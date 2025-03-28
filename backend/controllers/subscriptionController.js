
const User = require("../models/user");
const axios = require("axios");

// Get current user's subscription details
exports.getSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("subscription");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ subscription: user.subscription });
  } catch (error) {
    console.error("Error in getSubscription:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update user subscription (for Free plan or admin updates)
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
    console.error("Error in updateSubscription:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Handle payment verification from Khalti
exports.verifyPayment = async (req, res) => {
  try {
    const { token, amount, plan } = req.body;
    
    if (!token || !amount || !plan) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    
    if (!["Standard", "Pro"].includes(plan)) {
      return res.status(400).json({ message: "Invalid subscription plan" });
    }
    
    // Define plan prices in NPR (assuming Khalti uses NPR)
    const planPrices = {
      Standard: 999, // 9.99 USD in NPR (approximate)
      Pro: 2499      // 24.99 USD in NPR (approximate)
    };
    
    // Verify that the amount matches the expected plan price
    if (amount !== planPrices[plan] * 100) { // Khalti expects amount in paisa
      return res.status(400).json({ message: "Invalid payment amount for selected plan" });
    }
    
    // Verify the payment with Khalti
    try {
      const khaltiResponse = await axios.post(
        "https://dev.khalti.com/api/v2/payment/verify/",
        {
          token: token,
          amount: amount
        },
        {
          headers: {
            "Authorization": `Key ${process.env.KHALTI_SECRET_KEY}`
          }
        }
      );
      
      // If payment verification successful, update user subscription
      if (khaltiResponse.status === 200) {
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
      } else {
        res.status(400).json({ message: "Payment verification failed" });
      }
    } catch (khaltiError) {
      console.error("Khalti verification error:", khaltiError);
      res.status(400).json({ message: "Payment verification failed", error: khaltiError.message });
    }
  } catch (error) {
    console.error("Error in verifyPayment:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};