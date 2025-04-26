// backend/controllers/adminController.js
import User from '../models/user.js';
import Beat from '../models/beat.js';
import Order from '../models/order.js';

// Get dashboard overview stats
export const getDashboardStats = async (req, res) => {
  try {
    // Get total users count
    const totalUsers = await User.countDocuments();
    
    // Get users joined today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newUsersToday = await User.countDocuments({ createdAt: { $gte: today } });
    
    // Get total beats count
    const totalBeats = await Beat.countDocuments();
    
    // Get beats uploaded today
    const newBeatsToday = await Beat.countDocuments({ createdAt: { $gte: today } });
    
    // Get total orders/sales
    const totalSales = await Order.countDocuments();
    
    // Get total revenue
    const ordersAggregate = await Order.aggregate([
      { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } }
    ]);
    const totalRevenue = ordersAggregate.length > 0 ? ordersAggregate[0].totalRevenue : 0;
    
    // Calculate percentage change in sales (last 7 days vs previous 7 days)
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const previousWeek = new Date();
    previousWeek.setDate(previousWeek.getDate() - 14);
    
    const salesLastWeek = await Order.countDocuments({ 
      createdAt: { $gte: lastWeek, $lt: today } 
    });
    
    const salesPreviousWeek = await Order.countDocuments({ 
      createdAt: { $gte: previousWeek, $lt: lastWeek } 
    });
    
    const salesPercentage = salesPreviousWeek > 0 
      ? (((salesLastWeek - salesPreviousWeek) / salesPreviousWeek) * 100).toFixed(2)
      : 100;
    
    // Calculate percentage change in revenue
    const revenueLastWeek = await Order.aggregate([
      { $match: { createdAt: { $gte: lastWeek, $lt: today } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    
    const revenuePreviousWeek = await Order.aggregate([
      { $match: { createdAt: { $gte: previousWeek, $lt: lastWeek } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    
    const revenueLastWeekValue = revenueLastWeek.length > 0 ? revenueLastWeek[0].total : 0;
    const revenuePreviousWeekValue = revenuePreviousWeek.length > 0 ? revenuePreviousWeek[0].total : 0;
    
    const revenuePercentage = revenuePreviousWeekValue > 0
      ? (((revenueLastWeekValue - revenuePreviousWeekValue) / revenuePreviousWeekValue) * 100).toFixed(2)
      : 100;
    
    res.json({
      stats: {
        totalUsers,
        totalBeats,
        totalSales,
        totalRevenue,
        newUsersToday,
        newBeatsToday,
        salesPercentage: parseFloat(salesPercentage),
        revenuePercentage: parseFloat(revenuePercentage)
      }
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ message: 'Failed to get dashboard statistics' });
  }
};

// Get users with pagination and filtering
export const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter based on query params
    const filter = {};
    if (req.query.filter && req.query.filter !== 'all') {
      if (req.query.filter === 'banned') {
        filter.isBanned = true;
      } else {
        filter.role = req.query.filter;
      }
    }
    
    // Get filtered users with pagination
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const total = await User.countDocuments(filter);
    
    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ message: 'Failed to get users' });
  }
};

// Update user (ban/unban, change role)
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { isBanned, role } = req.body;
    
    // Make sure we have something to update
    if (isBanned === undefined && role === undefined) {
      return res.status(400).json({ message: 'No update parameters provided' });
    }
    
    // Build update object
    const update = {};
    if (isBanned !== undefined) update.isBanned = isBanned;
    if (role !== undefined) update.role = role;
    
    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      update,
      { new: true }
    ).select('-password');
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
};

// Get beats with pagination and filtering
export const getBeats = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter based on query params
    const filter = {};
    if (req.query.genre && req.query.genre !== 'all') {
      filter.genre = req.query.genre;
    }
    
    // Get filtered beats with pagination
    const beats = await Beat.find(filter)
      .populate('producer', 'name username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const total = await Beat.countDocuments(filter);
    
    res.json({
      beats,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error getting beats:', error);
    res.status(500).json({ message: 'Failed to get beats' });
  }
};

// Update beat featured status
export const updateBeat = async (req, res) => {
  try {
    const { id } = req.params;
    const { isFeatured } = req.body;
    
    // Make sure we have something to update
    if (isFeatured === undefined) {
      return res.status(400).json({ message: 'No update parameters provided' });
    }
    
    // Update the beat
    const updatedBeat = await Beat.findByIdAndUpdate(
      id,
      { isFeatured },
      { new: true }
    ).populate('producer', 'name username');
    
    if (!updatedBeat) {
      return res.status(404).json({ message: 'Beat not found' });
    }
    
    res.json({
      success: true,
      beat: updatedBeat
    });
  } catch (error) {
    console.error('Error updating beat:', error);
    res.status(500).json({ message: 'Failed to update beat' });
  }
};

// Delete beat
export const deleteBeat = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the beat first to get file IDs for cleanup
    const beat = await Beat.findById(id);
    
    if (!beat) {
      return res.status(404).json({ message: 'Beat not found' });
    }
    
    // Delete the beat
    await Beat.findByIdAndDelete(id);
    
    // In a complete implementation, you would also delete the audio and image files
    // from your storage (Cloudinary, S3, etc.)
    
    res.json({
      success: true,
      message: 'Beat deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting beat:', error);
    res.status(500).json({ message: 'Failed to delete beat' });
  }
};

// Get orders with pagination and filtering
export const getOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter based on query params
    const filter = {};
    if (req.query.status && req.query.status !== 'all') {
      filter.paymentStatus = req.query.status;
    }
    
    // Get filtered orders with pagination
    const orders = await Order.find(filter)
      .populate('user', 'name email')
      .populate({
        path: 'items.beat',
        select: 'title producer',
        populate: {
          path: 'producer',
          select: 'name username'
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const total = await Order.countDocuments(filter);
    
    res.json({
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({ message: 'Failed to get orders' });
  }
};

// Get analytics data
export const getAnalytics = async (req, res) => {
  try {
    const timeRange = req.query.timeRange || 'week';
    
    // Prepare date ranges based on time range
    let startDate, interval, format;
    const now = new Date();
    
    switch (timeRange) {
      case 'year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        interval = { $month: '$createdAt' };
        format = { $dateToString: { format: '%b', date: '$createdAt' } };
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        interval = { $dayOfMonth: '$createdAt' };
        format = { $dateToString: { format: '%d', date: '$createdAt' } };
        break;
      default: // week
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        interval = { $dayOfWeek: '$createdAt' };
        format = { $dateToString: { format: '%a', date: '$createdAt' } };
    }
    
    // Sales data aggregation
    const salesData = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { 
        $group: {
          _id: format,
          sales: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          name: '$_id',
          sales: 1,
          revenue: 1
        }
      }
    ]);
    
    // User growth data aggregation
    const userGrowthData = await User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: format,
          users: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          name: '$_id',
          users: 1
        }
      }
    ]);
    
    // Get dashboard stats
    const dashboardStats = await getDashboardStatsHelper();
    
    res.json({
      timeRange,
      stats: dashboardStats,
      salesData,
      userGrowthData
    });
  } catch (error) {
    console.error('Error getting analytics:', error);
    res.status(500).json({ message: 'Failed to get analytics data' });
  }
};

// Helper function for dashboard stats
const getDashboardStatsHelper = async () => {
  // Get total users count
  const totalUsers = await User.countDocuments();
  
  // Get users joined today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const newUsersToday = await User.countDocuments({ createdAt: { $gte: today } });
  
  // Get total beats count
  const totalBeats = await Beat.countDocuments();
  
  // Get beats uploaded today
  const newBeatsToday = await Beat.countDocuments({ createdAt: { $gte: today } });
  
  // Get total orders/sales
  const totalSales = await Order.countDocuments();
  
  // Get total revenue
  const ordersAggregate = await Order.aggregate([
    { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } }
  ]);
  const totalRevenue = ordersAggregate.length > 0 ? ordersAggregate[0].totalRevenue : 0;
  
  // Calculate percentage change in sales (last 7 days vs previous 7 days)
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  
  const previousWeek = new Date();
  previousWeek.setDate(previousWeek.getDate() - 14);
  
  const salesLastWeek = await Order.countDocuments({ 
    createdAt: { $gte: lastWeek, $lt: today } 
  });
  
  const salesPreviousWeek = await Order.countDocuments({ 
    createdAt: { $gte: previousWeek, $lt: lastWeek } 
  });
  
  const salesPercentage = salesPreviousWeek > 0 
    ? (((salesLastWeek - salesPreviousWeek) / salesPreviousWeek) * 100).toFixed(2)
    : 100;
  
  // Calculate percentage change in revenue
  const revenueLastWeek = await Order.aggregate([
    { $match: { createdAt: { $gte: lastWeek, $lt: today } } },
    { $group: { _id: null, total: { $sum: "$totalAmount" } } }
  ]);
  
  const revenuePreviousWeek = await Order.aggregate([
    { $match: { createdAt: { $gte: previousWeek, $lt: lastWeek } } },
    { $group: { _id: null, total: { $sum: "$totalAmount" } } }
  ]);
  
  const revenueLastWeekValue = revenueLastWeek.length > 0 ? revenueLastWeek[0].total : 0;
  const revenuePreviousWeekValue = revenuePreviousWeek.length > 0 ? revenuePreviousWeek[0].total : 0;
  
  const revenuePercentage = revenuePreviousWeekValue > 0
    ? (((revenueLastWeekValue - revenuePreviousWeekValue) / revenuePreviousWeekValue) * 100).toFixed(2)
    : 100;
  
  return {
    totalUsers,
    totalBeats,
    totalSales,
    totalRevenue,
    newUsersToday,
    newBeatsToday,
    salesPercentage: parseFloat(salesPercentage),
    revenuePercentage: parseFloat(revenuePercentage)
  };
};

// Get settings
export const getSettings = async (req, res) => {
    try {
      // In a real app, you'd fetch this from a database settings collection
      // For now, we'll return default values
      const settings = {
        siteName: 'Dhuun',
        siteDescription: 'A marketplace for producers and artists to buy and sell beats',
        contactEmail: 'admin@dhuun.com',
        maxUploadSizeMB: 20,
        commissionRate: 10,
        featuredBeatsLimit: 8,
        maintenanceMode: false
      };
      
      res.json({ settings });
    } catch (error) {
      console.error('Error getting settings:', error);
      res.status(500).json({ message: 'Failed to get settings' });
    }
  };

  // Update settings
export const updateSettings = async (req, res) => {
    try {
      // In a real app, you'd validate and update settings in the database
      // For now, we'll just echo back the settings as if they were saved
      const settings = req.body;
      
      // Validate required fields
      if (!settings.siteName || !settings.contactEmail) {
        return res.status(400).json({ message: 'Site name and contact email are required' });
      }
      
      res.json({
        success: true,
        message: 'Settings updated successfully',
        settings
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      res.status(500).json({ message: 'Failed to update settings' });
    }
  };