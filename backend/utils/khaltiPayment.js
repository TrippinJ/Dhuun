// backend/utils/khaltiPayment.js
const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();

// Function to initiate payment through Khalti
const initiatePayment = async ({ userId, amount, purchaseOrderName, returnUrl, websiteUrl }) => {
  try {
    const response = await axios.post(
      "https://khalti.com/api/v2/payment/initiate/",
      {
        return_url: "https://yourdomain.com/payment-success",  // URL where Khalti redirects after payment
        website_url: "https://localhost:3000", // Your website URL
        amount: plans[plan].price, // Amount to be charged
        purchase_order_id: userId, // Unique order ID or user ID
        purchase_order_name: `${plan} Subscription`, // Description of the purchase
      },
      {
        headers: { Authorization: `Key ${process.env.KHALTI_SECRET_KEY}` }, // Khalti API key
      }
    );

    return response.data.payment_url; // Return the Khalti payment URL
  } catch (error) {
    console.error("Khalti Payment Error:", error);
    throw new Error("Failed to initiate payment");
  }
};

// Function to verify payment through Khalti
const verifyPayment = async (transactionId) => {
  try {
    const response = await axios.post(
      "https://khalti.com/api/v2/payment/verify/",
      { transaction_id: transactionId },
      {
        headers: { Authorization: `Key ${process.env.KHALTI_SECRET_KEY}` }, // Khalti API key
      }
    );
    return response.data;
  } catch (error) {
    console.error("Payment Verification Error:", error);
    throw new Error("Failed to verify payment");
  }
};

module.exports = { initiatePayment, verifyPayment };
