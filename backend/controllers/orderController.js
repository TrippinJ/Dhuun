// backend/controllers/orderController.js
import Order from '../models/order.js';
import Beat from '../models/beat.js';
import User from '../models/user.js';
import { verifyPayment } from '../utils/khaltiPayment.js';
import { sendOrderConfirmation } from '../utils/emailService.js';

// Create a new order
export const createOrder = async (req, res) => {
  try {
    const { items, totalAmount, paymentMethod, paymentId, paymentPidx } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain at least one item' });
    }

    // Verify Khalti payment if that's the payment method
    if (paymentMethod === 'khalti' && paymentPidx) {
      try {
        await verifyPayment(paymentPidx);
      } catch (paymentError) {
        console.error('Payment verification error:', paymentError);
        return res.status(400).json({ message: 'Payment verification failed: ' + paymentError.message });
      }
    }

    // Create the order
    const order = new Order({
      user: req.user.id,
      items: items.map(item => ({
        beat: item.beatId,
        license: item.license || 'Basic',
        price: item.price
      })),
      totalAmount,
      paymentMethod: paymentMethod || 'khalti',
      paymentId,
      paymentStatus: 'Completed'
    });

    await order.save();

    // Process each item in the order
    for (const item of items) {
      // Increment purchases count for the beat
      await Beat.findByIdAndUpdate(
        item.beatId,
        { $inc: { purchases: 1 } }
      );

      const licenseType = item.license?.toLowerCase() || '';

      // Check if this is an exclusive license (handling different variations)
      if (licenseType === 'exclusive' || licenseType === 'exclusive license') {
        console.log(`Processing exclusive license for beat: ${item.beatId}`);

        // Mark the beat as exclusively sold
        const updatedBeat = await Beat.findByIdAndUpdate(
          item.beatId,
          {
            isExclusiveSold: true,
            exclusiveSoldTo: req.user.id,
            exclusiveSoldDate: new Date(),
            exclusiveOrderId: order._id
          },
          { new: true } // Return the updated document
        );

        console.log(`Beat marked as exclusively sold: ${updatedBeat?._id}, isExclusiveSold: ${updatedBeat?.isExclusiveSold}`);
      }
    }

    // Send order confirmation email
    try {
      await sendOrderConfirmation({
        customerEmail: req.user.email,
        orderId: order._id,
        items,
        totalAmount,
        userName: req.user.name
      });
      console.log(`Order confirmation email sent to ${req.user.email}`);
    } catch (emailError) {
      console.error('Error sending order confirmation email:', emailError);
      // Continue with order creation even if email fails
    }

    res.status(201).json({
      message: 'Order created successfully',
      orderId: order._id
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Failed to create order' });
  }
};

// Get user's orders
export const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate({
        path: 'items.beat',
        select: 'title coverImage producer audioFile'
      })
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
};

// Get a single order
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user.id
    }).populate({
      path: 'items.beat',
      select: 'title coverImage audioFile producer'
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Failed to fetch order' });
  }
};

// Verify a Khalti payment
export const verifyPaymentOrder = async (req, res) => {
  try {
    const { pidx } = req.body;

    if (!pidx) {
      return res.status(400).json({ message: 'Payment ID (pidx) is required' });
    }

    // Verify the payment status
    const verificationResult = await verifyPayment(pidx);

    // Check if payment status is completed
    if (verificationResult.status === "Completed") {
      return res.json({
        success: true,
        status: verificationResult.status,
        transaction_id: verificationResult.transaction_id,
        amount: verificationResult.total_amount / 100 // Convert from paisa to actual amount
      });
    }

    // If payment is not completed
    return res.json({
      success: false,
      status: verificationResult.status,
      message: `Payment status is ${verificationResult.status}`
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.message
    });
  }
};