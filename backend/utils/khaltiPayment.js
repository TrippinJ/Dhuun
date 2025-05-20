// backend/utils/khaltiPayment.js 

import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

// Define the base URL depending on environment
const KHALTI_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://khalti.com/api/v2'
  : 'https://dev.khalti.com/api/v2';

/**
 * Verify payment status with Khalti using lookup endpoint
 * @param {string} pidx - Payment ID to verify
 * @returns {Promise<Object>} - Payment verification result
 */
export const verifyPayment = async (pidx) => {
  try {
    console.log(`Verifying payment with pidx: ${pidx}`);
    
    if (!pidx) {
      throw new Error("Payment ID (pidx) is required for verification");
    }

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
 * @returns {Promise<Object>} - Payment URL and PIDX
 */
export const initiatePayment = async ({ userId, amount, purchaseOrderName, returnUrl, websiteUrl, customerInfo }) => {
  try {
    const amountInPaisa = Math.round(parseFloat(amount) * 100);
    const orderId = userId || `order-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const customer = customerInfo || {
      name: "Customer",
      email: "customer@example.com",
      phone: "9800000001"  
    };

    const payload = {
      return_url: returnUrl || "http://localhost:3000/checkout-success",
      website_url: websiteUrl || "http://localhost:3000/",
      amount: amountInPaisa,
      purchase_order_id: orderId,
      purchase_order_name: purchaseOrderName || "Product Purchase",
      customer_info: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone  
      }
    };

    console.log("Initiating Khalti payment with payload:", JSON.stringify(payload, null, 2));

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
    const errorDetails = error.response?.data || error.message;
    console.error("Khalti Payment Error:", errorDetails);

    if (error.config) {
      console.error("Request URL:", error.config.url);
      console.error("Request Method:", error.config.method);
      console.error("Request Headers:", error.config.headers);
    }

    throw new Error(`Failed to initiate payment: ${error.response?.data?.detail || error.message}`);
  }
};

/**
 * Helper function to validate a completed payment from the success URL
 * @param {string} pidx
 * @returns {Promise<Object>}
 */
export const validatePaymentSuccess = async (pidx) => {
  try {
    const paymentStatus = await verifyPayment(pidx);
    
    return {
      success: true,
      pidx: paymentStatus.pidx,
      transaction_id: paymentStatus.transaction_id,
      amount: paymentStatus.total_amount / 100,
      status: paymentStatus.status
    };
  } catch (error) {
    console.error("Payment validation error:", error.message);
    throw error;
  }
};
