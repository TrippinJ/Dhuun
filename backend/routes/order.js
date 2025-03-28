// backend/routes/order.js
const express = require("express");
const router = express.Router();
const { initiatePayment } = require("../utils/khaltiPayment");  // Import the shared Khalti logic
const Order = require("../models/order");

router.post("/order-payment", async (req, res) => {
  const { userId, orderId } = req.body;

  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(400).json({ error: "Order not found" });
  }

  const returnUrl = "https://yourdomain.com/order-payment-success";  // Modify with actual return URL
  const websiteUrl = "https://localhost:3000";  // Your website URL

  try {
    // Use the shared Khalti payment logic
    const paymentUrl = await initiatePayment({
      userId,
      amount: order.price,  // Order price
      purchaseOrderName: `Order for ${order.productName}`,
      returnUrl,
      websiteUrl,
    });

    res.json({ payment_url: paymentUrl });
  } catch (error) {
    console.error("Error initiating order payment:", error);
    res.status(500).json({ error: "Failed to initiate order payment" });
  }
});

module.exports = router;
