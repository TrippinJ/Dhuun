// backend/controllers/subscriptionController.js

import User from "../models/user.js";
import { sendSubscriptionConfirmationEmail } from "../utils/emailService.js";
import { verifyCheckoutSession } from "../utils/stripePayment.js";

// Get current user's subscription details
export const getSubscription = async (req, res) => {
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

// Update user subscription (for free plan or admin updates)
export const updateSubscription = async (req, res) => {
  try {
    const { plan, paymentMethod = 'manual', transactionId = null } = req.body;
    
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
    
    // Get user before update for email
    const user = await User.findById(req.user.id);
    const previousPlan = user.subscription?.plan || 'Free';
    
    // Update user subscription
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          "subscription.plan": plan,
          "subscription.status": "active",
          "subscription.expiryDate": planDetails[plan].expiryDate,
          "subscription.uploadLimit": planDetails[plan].uploadLimit,
          "subscription.revenueShare": planDetails[plan].revenueShare,
          "subscription.lastUpdated": new Date(),
          "subscription.paymentMethod": paymentMethod,
          "subscription.lastTransactionId": transactionId
        }
      },
      { new: true }
    );
    
    // Send email notification for paid plans or upgrades
    if (plan !== "Free" && plan !== previousPlan) {
      try {
        await sendSubscriptionConfirmationEmail({
          userEmail: user.email,
          userName: user.name,
          plan: plan,
          price: plan === "Standard" ? 9.99 : 24.99,
          paymentMethod: paymentMethod,
          transactionId: transactionId,
          expiryDate: planDetails[plan].expiryDate
        });
        console.log(`Subscription confirmation email sent to ${user.email}`);
      } catch (emailError) {
        console.error("Error sending subscription email:", emailError);
        // Don't fail the subscription update if email fails
      }
    }
    
    res.json({ 
      message: "Subscription updated successfully",
      subscription: updatedUser.subscription
    });
  } catch (error) {
    console.error("Error updating subscription:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Verify Stripe payment and update subscription
export const verifyStripePayment = async (req, res) => {
  try {
    const { sessionId, plan } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ message: "Session ID is required" });
    }
    
    if (!["Standard", "Pro"].includes(plan)) {
      return res.status(400).json({ message: "Invalid subscription plan for paid subscription" });
    }
    
    // Verify the Stripe session
    const sessionDetails = await verifyCheckoutSession(sessionId);
    
    if (sessionDetails.status !== "complete" && sessionDetails.status !== "paid") {
      return res.status(400).json({ 
        message: "Payment not completed", 
        status: sessionDetails.status 
      });
    }

    
    // Extract plan from metadata if not provided
    const selectedPlan = plan || sessionDetails.metadata?.plan;
    if (!selectedPlan) {
      return res.status(400).json({ message: "Plan information not found in payment" });
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
    
    // Get user before update
    const user = await User.findById(req.user.id);
    
    // Update user subscription
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          "subscription.plan": selectedPlan,
          "subscription.status": "active",
          "subscription.expiryDate": planDetails[selectedPlan].expiryDate,
          "subscription.uploadLimit": planDetails[selectedPlan].uploadLimit,
          "subscription.revenueShare": planDetails[selectedPlan].revenueShare,
          "subscription.lastUpdated": new Date(),
          "subscription.paymentMethod": "stripe",
          "subscription.lastTransactionId": sessionId,
          "subscription.stripeSessionId": sessionId
        }
      },
      { new: true }
    );
    
    // Send subscription confirmation email
    try {
      await sendSubscriptionConfirmationEmail({
        userEmail: user.email,
        userName: user.name,
        plan: selectedPlan,
        price: selectedPlan === "Standard" ? 9.99 : 24.99,
        paymentMethod: "stripe",
        transactionId: sessionId,
        expiryDate: planDetails[selectedPlan].expiryDate,
        amountPaid: sessionDetails.amountTotal / 100 // Convert from cents
      });
      console.log(`Stripe subscription confirmation email sent to ${user.email}`);
    } catch (emailError) {
      console.error("Error sending subscription email:", emailError);
    }
    
    res.json({ 
      message: "Payment verified and subscription updated successfully",
      subscription: updatedUser.subscription,
      paymentDetails: {
        sessionId: sessionId,
        amountPaid: sessionDetails.amountTotal / 100,
        paymentStatus: sessionDetails.status
      }
    });
  } catch (error) {
    console.error("Error verifying Stripe payment:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// For future implementation: Verify Khalti payment and update subscription
export const verifyPayment = async (req, res) => {
  try {
    const { token, amount, plan } = req.body;
    
    // TODO: Implement payment verification logic with Khalti
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
    
    // Get user before update
    const user = await User.findById(req.user.id);
    
    // Update user subscription
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          "subscription.plan": plan,
          "subscription.status": "active",
          "subscription.expiryDate": planDetails[plan].expiryDate,
          "subscription.uploadLimit": planDetails[plan].uploadLimit,
          "subscription.revenueShare": planDetails[plan].revenueShare,
          "subscription.lastUpdated": new Date(),
          "subscription.paymentMethod": "khalti",
          "subscription.lastTransactionId": token
        }
      },
      { new: true }
    );
    
    // Send subscription confirmation email
    try {
      await sendSubscriptionConfirmationEmail({
        userEmail: user.email,
        userName: user.name,
        plan: plan,
        price: plan === "Standard" ? 9.99 : 24.99,
        paymentMethod: "khalti",
        transactionId: token,
        expiryDate: planDetails[plan].expiryDate,
        amountPaid: amount
      });
      console.log(`Khalti subscription confirmation email sent to ${user.email}`);
    } catch (emailError) {
      console.error("Error sending subscription email:", emailError);
    }
    
    res.json({ 
      message: "Payment verified and subscription updated successfully",
      subscription: updatedUser.subscription
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get subscription analytics (admin only)
export const getSubscriptionAnalytics = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }
    
    // Get subscription statistics
    const totalUsers = await User.countDocuments();
    const freeUsers = await User.countDocuments({ "subscription.plan": "Free" });
    const standardUsers = await User.countDocuments({ "subscription.plan": "Standard" });
    const proUsers = await User.countDocuments({ "subscription.plan": "Pro" });
    const activeSubscriptions = await User.countDocuments({ 
      "subscription.status": "active",
      "subscription.plan": { $in: ["Standard", "Pro"] }
    });
    
    // Calculate revenue (simplified)
    const standardRevenue = standardUsers * 9.99;
    const proRevenue = proUsers * 24.99;
    const totalRevenue = standardRevenue + proRevenue;
    
    res.json({
      totalUsers,
      subscriptionBreakdown: {
        free: freeUsers,
        standard: standardUsers,
        pro: proUsers
      },
      activeSubscriptions,
      estimatedMonthlyRevenue: totalRevenue,
      conversionRate: totalUsers > 0 ? ((standardUsers + proUsers) / totalUsers * 100).toFixed(2) : 0
    });
  } catch (error) {
    console.error("Error getting subscription analytics:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

