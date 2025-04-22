import express from 'express';
import Order from '../models/order.js';
import Beat from '../models/beat.js';
import { authenticateUser } from '../routes/auth.js';
import { verifyPayment } from '../utils/khaltiPayment.js';
import { sendOrderConfirmation, sendThankYouEmail } from '../utils/emailService.js';

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


    // Fetch user info for the email
    const user = await User.findById(req.user.id);
    
    // Send order confirmation email
    try {
      // First populate the beat details for the email
      const populatedOrder = await Order.findById(order._id).populate({
        path: 'items.beat',
        select: 'title producer'
      });
      
      // Send confirmation email
      await sendOrderConfirmation({
        customerEmail: customerEmail || user.email,
        orderId: order._id,
        items: populatedOrder.items,
        totalAmount,
        userName: user.name
      });
      
      // Schedule thank you email to be sent after a delay (1 hour)
      setTimeout(async () => {
        try {
          await sendThankYouEmail({
            customerEmail: customerEmail || user.email,
            userName: user.name,
            items: populatedOrder.items
          });
        } catch (emailError) {
          console.error('Error sending thank you email:', emailError);
          // Don't fail the order if thank you email fails
        }
      }, 60 * 60 * 1000); // 1 hour delay
      
    } catch (emailError) {
      console.error('Error sending order confirmation email:', emailError);
    }
      
    // Process each item in the order
    for (const item of items) {
      // Increment purchases count
      await Beat.findByIdAndUpdate(
        item.beatId,
        { $inc: { purchases: 1 } }
      );

      // Check for exclusive license and mark beat as exclusively sold
      if (item.license === 'Exclusive') {
        await Beat.findByIdAndUpdate(
          item.beatId, // Use item.beatId consistently
          {
            isExclusiveSold: true,
            exclusiveSoldTo: req.user.id,
            exclusiveSoldDate: new Date(),
            exclusiveOrderId: order._id
          }
        );
        console.log(`Beat ${item.beatId} marked as exclusively sold`);
      }
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