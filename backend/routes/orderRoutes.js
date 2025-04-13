import express from 'express';
import Order from '../models/order.js';
import Beat from '../models/beat.js';
import { authenticateUser } from '../routes/auth.js';
import { verifyPayment } from '../utils/khaltiPayment.js';

// Define router first
const router = express.Router();

// Protect all order routes
router.use(authenticateUser);

// Create a new order
router.post('/', async (req, res) => {
  try {
    const { items, totalAmount, customerEmail, paymentMethod, paymentId, paymentPidx } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain at least one item' });
    }
    
    // Verify Khalti payment if payment method is Khalti
    if (paymentMethod === 'khalti' && paymentId) {
      try {
        await verifyPayment(paymentPidx);
      } catch (paymentError) {
        console.error('Payment verification error:', paymentError);
        return res.status(400).json({ message: 'Payment verification failed' });
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
      customerEmail: customerEmail || req.user.email,
      paymentMethod: paymentMethod || 'khalti',
      paymentId, 
      paymentPidx,
      paymentStatus: 'Completed'
    });
    
    // Save the order
    await order.save();
    
    // Increment purchases count for each beat
    for (const item of items) {
      await Beat.findByIdAndUpdate(
        item.beatId,
        { $inc: { purchases: 1 } }
      );
    }
    
    res.status(201).json({ 
      message: 'Order created successfully',
      orderId: order._id
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Failed to create order' });
  }
});

// Get user's orders
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate({
        path: 'items.beat',
        select: 'title coverImage producer price'
      })
      .sort({ createdAt: -1 });
    
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// Get a single order
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findOne({ 
      _id: req.params.id,
      user: req.user.id
    }).populate({
      path: 'items.beat',
      select: 'title coverImage audioFile producer price'
    });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Failed to fetch order' });
  }
});

// Verify a Khalti payment
router.post('/verify-payment', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: 'Payment token is required' });
    }
    
    // Verify the payment with Khalti
    const verificationResult = await verifyPayment(token);
    
    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: verificationResult
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to verify payment' 
    });
  }
});

export default router;