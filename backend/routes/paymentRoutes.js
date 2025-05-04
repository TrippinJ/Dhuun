import express from 'express';
import { authenticateUser } from '../routes/auth.js';
import { initiatePayment, verifyPayment } from '../utils/khaltiPayment.js';
import { createCheckoutSession, verifyCheckoutSession, handleStripeWebhook } from '../utils/stripePayment.js';
import user from '../models/user.js';

// Define router
const router = express.Router();

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

    // Create customer info object
    const customerInfo = {
      name: user.name || "Customer",
      email: user.email || req.body.customerEmail,
      phone: user.phonenumber || "9800000001" // Fallback for testing
    };

    // Create a friendly name for the order
    const purchaseOrderName = `Beats Purchase (${items.length} items)`;

    // Dynamic return URL that includes frontend base URL
    const websiteUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    // If returnUrl not provided, create one
    const paymentReturnUrl = returnUrl || `${websiteUrl}/checkout-success`;

    // Initiate payment with Khalti
    const paymentData = await initiatePayment({
      userId: user.id,
      amount,
      purchaseOrderName: `Beats Purchase (${items.length} items)`,
      returnUrl: returnUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/checkout-success`,
      websiteUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
      customerInfo  // Pass the customer info here
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

/**
 * Create a Stripe checkout session
 * @route POST /api/payments/create-stripe-session
 * @access Private
 */
router.post('/create-stripe-session', authenticateUser, async (req, res) => {
  try {
    const { amount, items, successUrl, cancelUrl } = req.body;

    if (!amount || !items || items.length === 0) {
      return res.status(400).json({ message: 'Amount and items are required' });
    }

    // Enhance item data with beat info
    const enhancedItems = await Promise.all(items.map(async (item) => {
      try {
        // Fetch beat name if not provided
        if (!item.beatName) {
          const beat = await Beat.findById(item.beatId).select('title');
          if (beat) {
            item.beatName = beat.title;
          }
        }
        return item;
      } catch (error) {
        return item; // Return original item if error
      }
    }));

    // Create Stripe checkout session
    const session = await createCheckoutSession({
      amount,
      items: enhancedItems,
      successUrl,
      cancelUrl,
      userId: req.user.id
    });

    res.json({
      success: true,
      sessionUrl: session.sessionUrl,
      sessionId: session.sessionId
    });
  } catch (error) {
    console.error('Stripe session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment session',
      error: error.message
    });
  }
});

/**
 * Verify a Stripe checkout session
 * @route POST /api/payments/verify-stripe-session
 * @access Private
 */
router.post('/verify-stripe-session', authenticateUser, async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID is required' });
    }

    // Verify the session
    const sessionDetails = await verifyCheckoutSession(sessionId);

    res.json({
      success: true,
      status: sessionDetails.status,
      amountTotal: sessionDetails.amountTotal,
      metadata: sessionDetails.metadata
    });
  } catch (error) {
    console.error('Stripe verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment session',
      error: error.message
    });
  }
});

/**
 * Handle Stripe webhooks
 * @route POST /api/payments/stripe-webhook
 * @access Public
 */
router.post('/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const result = await handleStripeWebhook(req);

    // If this is a checkout.session.completed event, process the order
    if (result.eventType === 'checkout.session.completed' && !result.unhandled) {
      // In a real app, you would process the order here
      console.log('Processing order from webhook:', result.orderId);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ received: false, error: error.message });
  }
});

export default router;