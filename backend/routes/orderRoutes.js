const express = require('express');
const router = express.Router();
const Order = require('../models/order');
const Beat = require('../models/beat');
const { authenticateUser } = require('../routes/auth');

// Protect all order routes
router.use(authenticateUser);

// Create a new order
router.post('/', async (req, res) => {
  try {
    const { items, totalAmount } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain at least one item' });
    }
    
    const order = new Order({
      user: req.user.id,
      items,
      totalAmount
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

module.exports = router;