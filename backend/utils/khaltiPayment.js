// backend/utils/khaltiPayment.js
const axios = require("axios");
require('dotenv').config();

// Verify payment with Khalti
const verifyPayment = async (token) => {
  try {
    const response = await axios.post(
      "https://khalti.com/api/v2/payment/verify/",
      { token },
      {
        headers: { 
          Authorization: `Key ${process.env.KHALTI_SECRET_KEY}` 
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Payment Verification Error:", error);
    throw new Error("Failed to verify payment");
  }
};

// Initiate payment through Khalti
const initiatePayment = async ({ userId, amount, purchaseOrderName, returnUrl, websiteUrl }) => {
  try {
    const response = await axios.post(
      "https://khalti.com/api/v2/payment/initiate/",
      {
        return_url: returnUrl || "https://your-website.com/payment-success",
        website_url: websiteUrl || "https://your-website.com",
        amount: amount * 100, // Convert to paisa
        purchase_order_id: userId,
        purchase_order_name: purchaseOrderName,
      },
      {
        headers: { Authorization: `Key ${process.env.KHALTI_SECRET_KEY}` },
      }
    );

    return response.data.payment_url;
  } catch (error) {
    console.error("Khalti Payment Error:", error);
    throw new Error("Failed to initiate payment");
  }
};

module.exports = { initiatePayment, verifyPayment };