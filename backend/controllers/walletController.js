import Wallet from '../models/wallet.js';
import User from '../models/user.js';
import Withdrawal from '../models/withdrawal.js';

// Get wallet information for the authenticated user
export const getWallet = async (req, res) => {
  try {
    // Find wallet for the current user
    let wallet = await Wallet.findOne({ user: req.user.id });
    
    // If wallet doesn't exist, create one
    if (!wallet) {
      wallet = new Wallet({
        user: req.user.id,
        balance: 0,
        pendingBalance: 0,
        transactions: []
      });
      await wallet.save();
    }
    
    res.json({
      success: true,
      wallet: {
        balance: wallet.balance || 0,
        pendingBalance: wallet.pendingBalance || 0,
        transactions: wallet.transactions.sort((a, b) => b.createdAt - a.createdAt).slice(0, 10) // Get most recent 10 transactions
      }
    });
  } catch (error) {
    console.error('Error fetching wallet:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve wallet information'
    });
  }
};

// Add transaction to wallet (internal function)
export const addTransaction = async (userId, transactionData) => {
  try {
    // Find or create wallet
    let wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      wallet = new Wallet({
        user: userId,
        balance: 0,
        pendingBalance: 0,
        transactions: []
      });
    }
    
    // Add transaction
    const { type, amount, description, orderId, status } = transactionData;
    wallet.transactions.push({
      type,
      amount,
      description,
      orderId,
      status: status || 'completed'
    });
    
    // Update balance
    if (status === 'completed' || status === undefined) {
      if (type === 'sale') {
        wallet.balance += amount;
      } else if (type === 'withdrawal') {
        wallet.balance -= amount;
      } else if (type === 'refund') {
        wallet.balance -= amount;
      } else if (type === 'adjustment') {
        wallet.balance += amount; // Could be negative for deductions
      }
    } else if (status === 'pending' && type === 'sale') {
      wallet.pendingBalance += amount;
    }
    
    wallet.lastUpdated = Date.now();
    await wallet.save();
    return wallet;
  } catch (error) {
    console.error('Error adding transaction:', error);
    throw error;
  }
};

// Request withdrawal (for seller)
export const requestWithdrawal = async (req, res) => {
  try {
    const { amount, paymentMethod } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid withdrawal amount'
      });
    }
    
    // Get user wallet
    const wallet = await Wallet.findOne({ user: req.user.id });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }
    
    // Check if user has enough balance
    if (wallet.balance < amount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Available: $${wallet.balance.toFixed(2)}`
      });
    }
    
    // Create a pending withdrawal transaction
    wallet.transactions.push({
      type: 'withdrawal',
      amount: -amount, // Negative amount for withdrawals
      description: `Withdrawal request via ${paymentMethod}`,
      status: 'pending'
    });

    
    
    // Update pending balance
    wallet.pendingBalance += amount;
    
    await wallet.save();

     // Create a withdrawal record 
    const withdrawal = new Withdrawal({
      user: req.user.id,
      amount: amount,
      paymentMethod: paymentMethod,
      status: 'pending',
      requestDate: new Date()
    });
    
    await withdrawal.save();
    
    // In a real application, you would also create a withdrawal request record
    // and notify administrators to process it
    
    res.json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      pendingBalance: wallet.pendingBalance,
      availableBalance: wallet.balance - wallet.pendingBalance
    });
  } catch (error) {
    console.error('Error requesting withdrawal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit withdrawal request'
    });
  }
};

// Get all transactions (with pagination)
export const getTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    // Find wallet for the current user
    const wallet = await Wallet.findOne({ user: req.user.id });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }
    
    // Get total count of transactions
    const totalTransactions = wallet.transactions.length;
    
    // Sort transactions by date (newest first) and apply pagination
    const paginatedTransactions = wallet.transactions
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice((page - 1) * limit, page * limit);
    
    res.json({
      success: true,
      transactions: paginatedTransactions,
      currentPage: page,
      totalPages: Math.ceil(totalTransactions / limit),
      totalTransactions
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve transactions'
    });
  }
};