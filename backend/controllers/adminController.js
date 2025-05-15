import mongoose from 'mongoose';
import User from '../models/user.js';
import Beat from '../models/beat.js';
import Order from '../models/order.js';
import Wallet from '../models/wallet.js';
import Withdrawal from '../models/withdrawal.js';
import Verification from '../models/verification.js';
import Settings from '../models/settings.js';
import { uploadFileToCloudinary } from '../utils/storageManger.js';

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

// Search users function
export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // Create search regex for case-insensitive search
    const searchRegex = new RegExp(q, 'i');

    // Search in name, email, and username fields
    const users = await User.find({
      $or: [
        { name: searchRegex },
        { email: searchRegex },
        { username: searchRegex }
      ]
    })
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      users,
      total: users.length
    });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: 'Failed to search users' });
  }
};

// Search beats function
export const searchBeats = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // Create search regex for case-insensitive search
    const searchRegex = new RegExp(q, 'i');

    // Search in title, genre, and producer name
    const beats = await Beat.find({
      $or: [
        { title: searchRegex },
        { genre: searchRegex }
      ]
    })
      .populate({
        path: 'producer',
        select: 'name username',
        match: { name: searchRegex } // Also search producer names
      })
      .sort({ createdAt: -1 })
      .limit(50);

    // Filter out beats where producer doesn't match if we're searching by producer
    const filteredBeats = beats.filter(beat =>
      beat.title.match(searchRegex) ||
      beat.genre.match(searchRegex) ||
      (beat.producer && beat.producer.name && beat.producer.name.match(searchRegex))
    );

    res.json({
      beats: filteredBeats,
      total: filteredBeats.length
    });
  } catch (error) {
    console.error('Error searching beats:', error);
    res.status(500).json({ message: 'Failed to search beats' });
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
    const { isFeatured, isPublished } = req.body;

    // Make sure we have something to update
    if (isFeatured === undefined && isPublished === undefined) {
      return res.status(400).json({ message: 'No update parameters provided' });
    }

    // Build update object
    const update = {};
    if (isFeatured !== undefined) update.isFeatured = isFeatured;
    if (isPublished !== undefined) update.isPublished = isPublished;

    // Update the beat
    const updatedBeat = await Beat.findByIdAndUpdate(
      id,
      update,
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
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build filter based on query params
    const filter = {};
    if (req.query.status && req.query.status !== 'all') {
      filter.paymentStatus = req.query.status;
    }

    // Add date range filter if provided
    if (req.query.startDate) {
      filter.createdAt = { $gte: new Date(req.query.startDate) };
    }
    if (req.query.endDate) {
      filter.createdAt = {
        ...filter.createdAt,
        $lte: new Date(req.query.endDate)
      };
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

    // Calculate additional statistics
    const totalRevenue = await Order.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    res.json({
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
      totalRevenue: totalRevenue[0]?.total || 0
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

    // Calculate date ranges
    let startDate;
    const now = new Date();

    switch (timeRange) {
      case 'year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        break;
      default: // week
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
    }

    // Get sales data from database
    const salesData = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          sales: { $sum: 1 },
          revenue: { $sum: "$totalAmount" }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          name: "$_id",
          sales: 1,
          revenue: { $round: ["$revenue", 2] }
        }
      }
    ]);

    // Get user growth data
    const userGrowthData = await User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          users: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          name: "$_id",
          users: 1
        }
      }
    ]);

    // Get dashboard stats directly here instead of calling helper
    const dashboardStats = {
      totalUsers: await User.countDocuments(),
      totalBeats: await Beat.countDocuments(),
      totalSales: await Order.countDocuments(),
      totalRevenue: (await Order.aggregate([
        { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } }
      ]))[0]?.totalRevenue || 0,
      newUsersToday: await User.countDocuments({
        createdAt: {
          $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
        }
      }),
      newBeatsToday: await Beat.countDocuments({
        createdAt: {
          $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
        }
      }),
      // Calculate percentage changes
      salesPercentage: await calculateSalesPercentage(),
      revenuePercentage: await calculateRevenuePercentage()
    };

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

// Add these helper functions at the end of the file
const calculateSalesPercentage = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

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

    if (salesPreviousWeek === 0) return 100;
    return Number((((salesLastWeek - salesPreviousWeek) / salesPreviousWeek) * 100).toFixed(2));
  } catch (error) {
    console.error('Error calculating sales percentage:', error);
    return 0;
  }
};

const calculateRevenuePercentage = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    const previousWeek = new Date();
    previousWeek.setDate(previousWeek.getDate() - 14);

    const revenueLastWeek = await Order.aggregate([
      { $match: { createdAt: { $gte: lastWeek, $lt: today } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    const revenuePreviousWeek = await Order.aggregate([
      { $match: { createdAt: { $gte: previousWeek, $lt: lastWeek } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    const revenueLastWeekValue = revenueLastWeek[0]?.total || 0;
    const revenuePreviousWeekValue = revenuePreviousWeek[0]?.total || 0;

    if (revenuePreviousWeekValue === 0) return 100;
    return Number((((revenueLastWeekValue - revenuePreviousWeekValue) / revenuePreviousWeekValue) * 100).toFixed(2));
  } catch (error) {
    console.error('Error calculating revenue percentage:', error);
    return 0;
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
    // Try to get existing settings from database
    let settings = await Settings.findOne();

    // If no settings exist, create default ones
    if (!settings) {
      settings = new Settings({
        siteName: 'Dhuun',
        siteDescription: 'A marketplace for producers and artists to buy and sell beats',
        contactEmail: 'admin@dhuun.com',
        maxUploadSizeMB: 20,
        commissionRate: 10,
        featuredBeatsLimit: 8,
        maintenanceMode: false
      });
      await settings.save();
    }

    res.json({ settings });
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({ message: 'Failed to get settings' });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const {
      siteName,
      siteDescription,
      contactEmail,
      maxUploadSizeMB,
      commissionRate,
      featuredBeatsLimit,
      maintenanceMode
    } = req.body;

    // Validation
    if (!siteName || !contactEmail) {
      return res.status(400).json({ message: 'Site name and contact email are required' });
    }

    // Find existing settings or create new
    let settings = await Settings.findOne();

    if (!settings) {
      settings = new Settings();
    }

    // Update fields
    settings.siteName = siteName;
    settings.siteDescription = siteDescription;
    settings.contactEmail = contactEmail;
    settings.maxUploadSizeMB = maxUploadSizeMB;
    settings.commissionRate = commissionRate;
    settings.featuredBeatsLimit = featuredBeatsLimit;
    settings.maintenanceMode = maintenanceMode;
    settings.lastUpdated = new Date();
    settings.updatedBy = req.user.id;

    // Save to database
    await settings.save();

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

// Toggle featured status for a beat
export const toggleFeaturedStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the beat
    const beat = await Beat.findById(id);

    if (!beat) {
      return res.status(404).json({ message: 'Beat not found' });
    }

    // Toggle featured status
    beat.isFeatured = !beat.isFeatured;
    await beat.save();

    res.json({
      success: true,
      message: `Beat ${beat.isFeatured ? 'featured' : 'unfeatured'} successfully`,
      isFeatured: beat.isFeatured
    });
  } catch (error) {
    console.error('Error toggling featured status:', error);
    res.status(500).json({ message: 'Failed to update featured status' });
  }
};

// Update site logo
export const updateLogo = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const uploadResult = await uploadFileToCloudinary(file.path, false);
    const settings = await Settings.findOneAndUpdate(
      {},
      { logoUrl: uploadResult.url },
      { new: true }
    );

    res.json({ success: true, logoUrl: settings.logoUrl });
  } catch (error) {
    console.error("Update Logo Error:", error);
    res.status(500).json({ error: "Failed to upload and update logo" });
  }
};

// Update About section
export const updateAboutSection = async (req, res) => {
  try {
    const { title, description, image } = req.body;
    const settings = await Settings.findOneAndUpdate({}, {
      aboutSection: { title, description, image }
    }, { new: true });
    res.json({ success: true, aboutSection: settings.aboutSection });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update Testimonials
export const updateTestimonials = async (req, res) => {
  try {
    const { testimonials } = req.body;
    const settings = await Settings.findOneAndUpdate({}, {
      testimonials
    }, { new: true });
    res.json({ success: true, testimonials: settings.testimonials });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};