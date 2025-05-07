import Order from '../models/order.js';
import User from '../models/user.js';
import Wallet from '../models/wallet.js';
import Withdrawal from '../models/withdrawal.js';
import Verification from '../models/verification.js';

// Get finance overview statistics
export const getFinanceOverview = async (req, res) => {
  try {
    // Get total revenue
    const ordersAggregate = await Order.aggregate([
      { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } }
    ]);
    
    const totalRevenue = ordersAggregate.length > 0 ? ordersAggregate[0].totalRevenue : 0;
    
    // Get total pending withdrawals
    const pendingWithdrawalsAggregate = await Withdrawal.aggregate([
      { $match: { status: 'pending' } },
      { $group: { _id: null, totalPending: { $sum: "$amount" } } }
    ]);
    
    const pendingWithdrawalsAmount = pendingWithdrawalsAggregate.length > 0 ? 
      pendingWithdrawalsAggregate[0].totalPending : 0;
    
    // Get total paid withdrawals
    const paidWithdrawalsAggregate = await Withdrawal.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, totalPaid: { $sum: "$amount" } } }
    ]);
    
    const paidWithdrawalsAmount = paidWithdrawalsAggregate.length > 0 ? 
      paidWithdrawalsAggregate[0].totalPaid : 0;
    
    // Get monthly revenue data
    const monthlyRevenue = await Order.aggregate([
      {
        $group: {
          _id: { 
            year: { $year: "$createdAt" }, 
            month: { $month: "$createdAt" } 
          },
          revenue: { $sum: "$totalAmount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { 
        $project: {
          _id: 0,
          month: { 
            $concat: [
              { $toString: "$_id.year" },
              "-",
              {
                $cond: {
                  if: { $lt: ["$_id.month", 10] },
                  then: { $concat: ["0", { $toString: "$_id.month" }] },
                  else: { $toString: "$_id.month" }
                }
              }
            ]
          },
          revenue: 1,
          count: 1
        }
      }
    ]);
    
    // Get counts of pending items
    const pendingWithdrawalsCount = await Withdrawal.countDocuments({ status: 'pending' });
    const pendingVerificationsCount = await Verification.countDocuments({ status: 'pending' });
    
    res.json({
      success: true,
      overview: {
        totalRevenue,
        pendingWithdrawalsAmount,
        paidWithdrawalsAmount,
        platformRevenue: totalRevenue - paidWithdrawalsAmount,
        pendingWithdrawalsCount,
        pendingVerificationsCount
      },
      monthlyRevenue
    });
  } catch (error) {
    console.error('Error getting finance overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get finance overview'
    });
  }
};

// Get top sellers by revenue
export const getTopSellers = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    // Find sellers with highest balance
    const wallets = await Wallet.find()
      .sort({ balance: -1 })
      .limit(limit)
      .populate('user', 'name username email avatar');
    
    const topSellers = wallets.map(wallet => ({
      user: wallet.user,
      balance: wallet.balance,
      totalEarnings: wallet.transactions
        .filter(t => t.type === 'sale' && t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0),
      pendingWithdrawals: wallet.pendingBalance
    }));
    
    res.json({
      success: true,
      topSellers
    });
  } catch (error) {
    console.error('Error getting top sellers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get top sellers'
    });
  }
};