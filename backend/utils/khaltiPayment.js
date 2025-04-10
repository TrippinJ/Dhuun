// backend/utils/khaltiPayment.js - UPDATED
const axios = require("axios");
require('dotenv').config();

// Updated API Endpoints (according to documentation)
const KHALTI_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://khalti.com/api/v2'
  : 'https://dev.khalti.com/api/v2';

/**
 * Verify payment status with Khalti using lookup endpoint
 * @param {string} pidx - Payment ID to verify
 * @returns {Promise<Object>} - Payment verification result
 */
const verifyPayment = async (pidx) => {
  try {
    console.log(`Verifying payment with pidx: ${pidx}`);
    
    // Make sure we have a pidx to check
    if (!pidx) {
      throw new Error("Payment ID (pidx) is required for verification");
    }
    
    // Use lookup endpoint to check payment status as per documentation
    const response = await axios.post(
      `${KHALTI_BASE_URL}/epayment/lookup/`,
      { pidx },
      {
        headers: { 
          Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
          'Content-Type': 'application/json'
        },
      }
    );
    
    console.log("Payment verification response:", response.data);
    
    // Check if status is "Completed" (only valid success state)
    if (response.data.status === "Completed") {
      console.log("Payment verification successful - Status: Completed");
      return response.data;
    } else {
      console.log(`Payment not completed - Status: ${response.data.status}`);
      throw new Error(`Payment not completed. Current status: ${response.data.status}`);
    }
  } catch (error) {
    console.error("Payment Verification Error:", error.response?.data || error.message);
    throw new Error(`Failed to verify payment: ${error.response?.data?.detail || error.message}`);
  }
};

/**
 * Initiate payment through Khalti
 * @param {Object} options - Payment initialization options
 * @returns {Promise<string>} - Payment URL for redirect
 */
const initiatePayment = async ({ userId, amount, purchaseOrderName, returnUrl, websiteUrl }) => {
  try {
    // Ensure amount is a number and convert to paisa
    const amountInPaisa = Math.round(parseFloat(amount) * 100);
    
    // Create a unique order ID if not provided
    const orderId = userId || `order-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Build the payload according to Khalti documentation
    const payload = {
      return_url: returnUrl || "http://localhost:3000/checkout-success",
      website_url: websiteUrl || "http://localhost:3000/",
      amount: amountInPaisa,
      purchase_order_id: orderId,
      purchase_order_name: purchaseOrderName || "Product Purchase",
      customer_info: {
        name: "Customer",
        email: "customer@example.com",
        phone: "9800000001"  // Use test phone for sandbox
      }
    };
    
    console.log("Initiating Khalti payment with payload:", JSON.stringify(payload, null, 2));
    
    // Make the API request
    const response = await axios.post(
      `${KHALTI_BASE_URL}/epayment/initiate/`,
      payload,
      {
        headers: { 
          Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
          'Content-Type': 'application/json'
        },
      }
    );
    
    console.log("Payment initiation successful:", {
      pidx: response.data.pidx,
      payment_url: response.data.payment_url,
      expires_at: response.data.expires_at
    });
    
    return {
      payment_url: response.data.payment_url,
      pidx: response.data.pidx
    };
  } catch (error) {
    // Enhanced error handling with detailed information
    const errorDetails = error.response?.data || error.message;
    console.error("Khalti Payment Error:", errorDetails);
    
    // Log request details if available
    if (error.config) {
      console.error("Request URL:", error.config.url);
      console.error("Request Method:", error.config.method);
      console.error("Request Headers:", error.config.headers);
    }
    
    throw new Error(`Failed to initiate payment: ${error.response?.data?.detail || error.message}`);
  }
};

// Helper function to validate a completed payment from the success URL
const validatePaymentSuccess = async (pidx) => {
  try {
    const paymentStatus = await verifyPayment(pidx);
    
    return {
      success: true,
      pidx: paymentStatus.pidx,
      transaction_id: paymentStatus.transaction_id,
      amount: paymentStatus.total_amount / 100, // Convert back from paisa
      status: paymentStatus.status
    };
  } catch (error) {
    console.error("Payment validation error:", error.message);
    throw error;
  }
};

module.exports = { 
  initiatePayment, 
  verifyPayment,
  validatePaymentSuccess 
};