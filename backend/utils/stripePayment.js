import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Create a Stripe checkout session
 * @param {Object} options - Payment session options
 * @returns {Promise<Object>} - Session URL and ID
 */
export const createCheckoutSession = async ({ 
  amount, 
  items, 
  successUrl, 
  cancelUrl,
  userId 
}) => {
  try {
    const unitAmount = Math.round(amount * 100); // Convert to cents
    
    // Create line items for Stripe checkout
    const lineItems = items.map(item => ({
      price_data: {
        currency: 'npr',
        product_data: {
          name: `${item.licenseName || 'Beat'} - ${item.beatName || 'Untitled'}`,
          description: `License: ${item.licenseName || 'Basic License'}`,
        },
        unit_amount: Math.round(item.price * 100), // Convert to cents
      },
      quantity: 1,
    }));
    
    // Create the checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: userId,
      metadata: {
        orderId: `order-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        items: JSON.stringify(items.map(item => ({
          beatId: item.beatId,
          license: item.license,
          price: item.price,
        }))),
      },
    });
    
    return {
      sessionUrl: session.url,
      sessionId: session.id,
    };
  } catch (error) {
    console.error('Stripe session error:', error);
    throw new Error(`Failed to create Stripe session: ${error.message}`);
  }
};

/**
 * Verify a Stripe checkout session
 * @param {string} sessionId - Stripe session ID to verify
 * @returns {Promise<Object>} - Session details
 */
export const verifyCheckoutSession = async (sessionId) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    return {
      status: session.payment_status,
      amountTotal: session.amount_total / 100, // Convert from cents
      customer: session.customer_details,
      metadata: session.metadata,
    };
  } catch (error) {
    console.error('Stripe verification error:', error);
    throw new Error(`Failed to verify payment: ${error.message}`);
  }
};

// Webhook handler for Stripe events
export const handleStripeWebhook = async (req) => {
  const sig = req.headers['stripe-signature'];
  
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        
        // Extract order details from metadata
        const { orderId, items } = session.metadata;
        
        return {
          success: true,
          eventType: event.type,
          session,
          orderId,
          items: JSON.parse(items),
        };
        
      default:
        return {
          success: true,
          eventType: event.type,
          unhandled: true,
        };
    }
  } catch (error) {
    console.error('Stripe webhook error:', error);
    throw new Error(`Webhook Error: ${error.message}`);
  }
};

export default {
  createCheckoutSession,
  verifyCheckoutSession,
  handleStripeWebhook,
};