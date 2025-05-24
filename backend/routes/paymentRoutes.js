import express from 'express';
import { authenticateUser } from '../routes/auth.js';
import { initiatePayment, verifyPayment } from '../utils/khaltiPayment.js';
import { createCheckoutSession, verifyCheckoutSession, handleStripeWebhook } from '../utils/stripePayment.js';
import User from '../models/user.js';

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
    const user = await User.findById(req.user.id);

    // Create customer info object
    const customerInfo = {
      name: user.name || "Customer",
      email: user.email || req.body.customerEmail,
      phone: user.phonenumber || "9800000001" // Fallback for testing
    };

    // Determine if this is a subscription payment
    const isSubscription = items.some(item => item.type === 'subscription');
    const purchaseOrderName = isSubscription 
      ? `Subscription: ${items[0].name}`
      : `Beats Purchase (${items.length} items)`;

    // Dynamic return URL that includes frontend base URL
    const websiteUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    // If returnUrl not provided, create one based on payment type
    const paymentReturnUrl = returnUrl || (isSubscription 
      ? `${websiteUrl}/subscription`
      : `${websiteUrl}/checkout-success`);

    // Initiate payment with Khalti
    const paymentData = await initiatePayment({
      userId: user._id,
      amount,
      purchaseOrderName,
      returnUrl: paymentReturnUrl,
      websiteUrl: websiteUrl,
      customerInfo
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

    // Get user info
    const user = await User.findById(req.user.id);

    // Enhance item data based on type
    const enhancedItems = await Promise.all(items.map(async (item) => {
      // Check if this is a subscription item
      if (item.license && ['Standard', 'Pro'].includes(item.license)) {
        return {
          ...item,
          beatName: item.beatName || `${item.license} Subscription`,
          licenseName: item.licenseName || `${item.license} Monthly Plan`,
          isSubscription: true
        };
      } else {
        // Regular beat purchase - fetch beat info if needed
        try {
          if (!item.beatName && item.beatId) {
            const Beat = (await import('../models/beat.js')).default;
            const beat = await Beat.findById(item.beatId).select('title');
            if (beat) {
              item.beatName = beat.title;
            }
          }
          return { ...item, isSubscription: false };
        } catch (error) {
          return { ...item, isSubscription: false };
        }
      }
    }));

    // Determine success/cancel URLs based on item type
    const hasSubscription = enhancedItems.some(item => item.isSubscription);
    const defaultSuccessUrl = hasSubscription 
      ? `${process.env.FRONTEND_URL || 'http://localhost:3000'}/subscription?payment=success`
      : `${process.env.FRONTEND_URL || 'http://localhost:3000'}/checkout-success`;
    
    const defaultCancelUrl = hasSubscription
      ? `${process.env.FRONTEND_URL || 'http://localhost:3000'}/subscription?payment=cancelled`
      : `${process.env.FRONTEND_URL || 'http://localhost:3000'}/cart`;

    // Create Stripe checkout session
    const session = await createCheckoutSession({
      amount,
      items: enhancedItems,
      successUrl: successUrl || defaultSuccessUrl,
      cancelUrl: cancelUrl || defaultCancelUrl,
      userId: req.user.id,
      customerEmail: user.email,
      customerName: user.name
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

    // If this is a checkout.session.completed event, process the order/subscription
    if (result.eventType === 'checkout.session.completed' && !result.unhandled) {
      console.log('Processing payment from webhook:', result.session.id);
      
      // Check if this is a subscription payment
      const metadata = result.session.metadata || {};
      const isSubscription = metadata.type === 'subscription' || 
                           (result.items && result.items.some(item => 
                             item.license && ['Standard', 'Pro'].includes(item.license)
                           ));

      if (isSubscription) {
        console.log('Processing subscription payment from webhook');
        // Handle subscription activation via webhook
        try {
          const { updateSubscription } = await import('../controllers/subscriptionController.js');
          
          // Extract plan from metadata or items
          const plan = metadata.plan || 
                      (result.items && result.items[0] && result.items[0].license) ||
                      'Standard';
          
          // Create a mock request object for the controller
          const mockReq = {
            user: { id: result.session.client_reference_id },
            body: { 
              plan, 
              paymentMethod: 'stripe', 
              transactionId: result.session.id 
            }
          };
          
          const mockRes = {
            json: (data) => console.log('Subscription updated via webhook:', data),
            status: (code) => ({ json: (data) => console.log(`Status ${code}:`, data) })
          };
          
          await updateSubscription(mockReq, mockRes);
        } catch (error) {
          console.error('Error processing subscription webhook:', error);
        }
      } else {
        console.log('Processing order payment from webhook');
        // Handle regular order processing
        // This would typically be done by your order creation process
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ received: false, error: error.message });
  }
});

/**
 * Get payment history for user
 * @route GET /api/payments/history
 * @access Private
 */
router.get('/history', authenticateUser, async (req, res) => {
  try {
    const { page = 1, limit = 10, type = 'all' } = req.query;
    
    // This would typically query your payment/order history
    // For now, return a placeholder response
    res.json({
      success: true,
      payments: [],
      pagination: {
        currentPage: parseInt(page),
        totalPages: 1,
        totalPayments: 0
      }
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history'
    });
  }
});

/**
 * Cancel/Refund a payment (admin only)
 * @route POST /api/payments/refund
 * @access Private/Admin
 */
router.post('/refund', authenticateUser, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    
    const { paymentId, amount, reason } = req.body;
    
    if (!paymentId) {
      return res.status(400).json({ message: 'Payment ID is required' });
    }
    
    // TODO: Implement refund logic for both Khalti and Stripe
    
    res.json({
      success: true,
      message: 'Refund processed successfully',
      refundId: `refund_${Date.now()}`
    });
  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process refund'
    });
  }
});

export default router;