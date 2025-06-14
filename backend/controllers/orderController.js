// backend/controllers/orderController.js
import Order from '../models/order.js';
import Beat from '../models/beat.js';
import User from '../models/user.js';
import { verifyPayment } from '../utils/khaltiPayment.js';
import { sendOrderConfirmation, sendBeatPurchased } from '../utils/emailService.js';
import { addTransaction } from './walletController.js';

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

    // Get buyer information for notifications
    const buyer = await User.findById(req.user.id);

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
      try {
        // Get beat details with producer information
        const beat = await Beat.findById(item.beatId).populate('producer');

        if (!beat) {
          console.error(`Beat not found: ${item.beatId}`);
          continue;
        }

        // Increment purchases count for the beat
        await Beat.findByIdAndUpdate(
          item.beatId,
          { $inc: { purchases: 1 } }
        );

        // Process payment to seller
        if (beat.producer) {
          // Get seller details and revenue share percentage
          const seller = await User.findById(beat.producer._id);
          const revenueShare = seller?.subscription?.revenueShare || 60; // Default to 60%

          // Calculate seller's amount
          const sellerAmount = (item.price * revenueShare) / 100;

          // Credit seller's wallet
          await addTransaction(beat.producer._id, {
            type: 'sale',
            amount: sellerAmount,
            description: `Sale of "${beat.title}" (${item.license} license)`,
            orderId: order._id,
            status: 'completed'
          });

          console.log(`Credited $${sellerAmount} to seller ${beat.producer._id} for beat "${beat.title}"`);

          // Send beat sale notification email to producer
          try {
            await sendBeatPurchased({
              producerEmail: seller.email,
              producerName: seller.name,
              beatTitle: beat.title,
              buyerName: buyer.name,
              license: item.license || 'Basic',
              salePrice: item.price,
              earnings: sellerAmount,
              revenueShare: revenueShare,
              orderId: order._id,
              saleDate: new Date()
            });
            console.log(`Beat sale notification sent to producer: ${seller.email}`);
          } catch (emailError) {
            console.error('Error sending beat sale notification:', emailError);
            // Don't fail the order if email fails
          }
        }

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
      } catch (itemError) {
        console.error(`Error processing order item ${item.beatId}:`, itemError);
        
      }
    }

    // Send order confirmation email
    try {
      await sendOrderConfirmation({
        customerEmail: req.user.email || buyer.email,
        orderId: order._id,
        items,
        totalAmount,
        userName: req.user.name || buyer.name
      });
      console.log(`Order confirmation email sent to ${req.user.email || buyer.email}`);
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

// NEW: Get sales analytics for producer
export const getProducerSalesAnalytics = async (req, res) => {
  try {
    // Get all orders containing beats by this producer
    const orders = await Order.find({
      paymentStatus: 'Completed'
    }).populate({
      path: 'items.beat',
      match: { producer: req.user.id },
      select: 'title producer'
    });

    // Filter orders that actually contain beats by this producer
    const producerOrders = orders.filter(order => 
      order.items.some(item => item.beat && item.beat.producer.toString() === req.user.id)
    );

    // Calculate analytics
    let totalSales = 0;
    let totalEarnings = 0;
    const beatSales = {};
    const monthlySales = {};

    for (const order of producerOrders) {
      const month = order.createdAt.toISOString().slice(0, 7); // YYYY-MM format
      
      for (const item of order.items) {
        if (item.beat && item.beat.producer.toString() === req.user.id) {
          totalSales++;
          
          // Calculate earnings (assuming revenue share from user subscription)
          const user = await User.findById(req.user.id);
          const revenueShare = user?.subscription?.revenueShare || 60;
          const earnings = (item.price * revenueShare) / 100;
          totalEarnings += earnings;
          
          // Track beat sales
          const beatTitle = item.beat.title;
          beatSales[beatTitle] = (beatSales[beatTitle] || 0) + 1;
          
          // Track monthly sales
          monthlySales[month] = (monthlySales[month] || 0) + 1;
        }
      }
    }

    // Get top performing beat
    const topBeat = Object.entries(beatSales)
      .sort(([,a], [,b]) => b - a)[0];

    res.json({
      totalSales,
      totalEarnings: totalEarnings.toFixed(2),
      topBeat: topBeat ? { title: topBeat[0], sales: topBeat[1] } : null,
      monthlySales,
      beatSales
    });
  } catch (error) {
    console.error('Error fetching producer analytics:', error);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
};