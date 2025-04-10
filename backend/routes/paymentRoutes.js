// Add this to your orderRoutes.js file or create a new file called paymentRoutes.js

const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../routes/auth'); // Adjust path as needed
const { initiatePayment, verifyPayment } = require('../utils/khaltiPayment');

/**
 * Initiate a new payment
 * @route POST /api/payments/initiate
 * @access Private
 */
router.post('/initiate', authenticateUser, async (req, res) => {
  try {
    const { amount, items, returnUrl } = req.body;
    
    if (!amount || !items || items.length === 0) {
      return res.status(400).json({ message: 'Amount and items are required' });
    }
    
    // Get user info for the payment
    const userId = req.user.id;
    
    // Create a friendly name for the order
    const purchaseOrderName = `Beats Purchase (${items.length} items)`;
    
    // Dynamic return URL that includes frontend base URL
    const websiteUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    // If returnUrl not provided, create one
    const paymentReturnUrl = returnUrl || `${websiteUrl}/checkout-success`;
    
    // Initiate payment with Khalti
    const paymentData = await initiatePayment({
      userId,
      amount,
      purchaseOrderName,
      returnUrl: paymentReturnUrl,
      websiteUrl
    });
    
    // Return the payment URL and pidx to the frontend
    res.json({
      success: true,
      payment_url: paymentData.payment_url,
      pidx: paymentData.pidx
    });
    
  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to initiate payment',
      error: error.message
    });
  }
});

/**
 * Verify a payment status
 * @route POST /api/payments/verify
 * @access Private
 */
router.post('/verify', authenticateUser, async (req, res) => {
  try {
    const { pidx } = req.body;
    
    if (!pidx) {
      return res.status(400).json({ message: 'Payment ID (pidx) is required' });
    }
    
    // Verify the payment status
    const verificationResult = await verifyPayment(pidx);
    
    res.json({
      success: true,
      status: verificationResult.status,
      transaction_id: verificationResult.transaction_id,
      amount: verificationResult.total_amount / 100 // Convert from paisa to actual amount
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to verify payment',
      error: error.message
    });
  }
});

module.exports = router;