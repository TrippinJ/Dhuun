import Withdrawal from '../models/withdrawal.js';
import Wallet from '../models/wallet.js';
import User from '../models/user.js';
import { addTransaction } from './walletController.js';
import Verification from '../models/verification.js';

// Request a withdrawal
export const requestWithdrawal = async (req, res) => {
  try {
    const { amount, paymentMethod } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid withdrawal amount'
      });
    }

    // Check if user is verified
    const user = await User.findById(req.user.id);
    if (user.verificationStatus !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Your account must be verified before requesting withdrawals'
      });
    }

    // Get verification record to check payment details
    const verification = await Verification.findOne({ user: req.user.id });
    if (!verification || !verification.payoutDetails || !verification.payoutDetails.paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Please add payment details to your verification profile'
      });
    }
    // Validate complete payment details based on method
    const payoutDetails = verification.payoutDetails;
    const selectedMethod = paymentMethod || payoutDetails.paymentMethod;

    if (selectedMethod === 'bank') {
      if (!payoutDetails.bankName || !payoutDetails.accountName || !payoutDetails.accountNumber) {
        return res.status(400).json({
          success: false,
          message: 'Incomplete bank details. Please update your verification profile with complete bank information (Bank Name, Account Name, Account Number).',
          missingFields: {
            bankName: !payoutDetails.bankName,
            accountName: !payoutDetails.accountName,
            accountNumber: !payoutDetails.accountNumber
          }
        });
      }
    } else if (selectedMethod === 'khalti') {
      if (!payoutDetails.khaltiId) {
        return res.status(400).json({
          success: false,
          message: 'Khalti ID is required. Please update your verification profile.',
          missingFields: { khaltiId: true }
        });
      }
    } else if (selectedMethod === 'paypal') {
      if (!payoutDetails.paypalEmail) {
        return res.status(400).json({
          success: false,
          message: 'PayPal email is required. Please update your verification profile.',
          missingFields: { paypalEmail: true }
        });
      }
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
        message: `Insufficient balance. Available: Rs ${wallet.balance.toFixed(2)}`
      });
    }

    // Create withdrawal request
    const withdrawal = new Withdrawal({
      user: req.user.id,
      amount,
      // paymentMethod: paymentMethod || verification.payoutDetails.paymentMethod,
      paymentMethod: selectedMethod,
      status: 'pending'
    });

    await withdrawal.save();

    // Create a pending withdrawal transaction in wallet
    await addTransaction(req.user.id, {
      type: 'withdrawal',
      amount: -amount, // Negative amount for withdrawals
      description: `Withdrawal request via ${selectedMethod || verification.payoutDetails.paymentMethod}`,
      status: 'pending'
    });

    // Update pending balance
    wallet.pendingBalance += amount;
    await wallet.save();

    res.json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      withdrawal: {
        id: withdrawal._id,
        amount,
        status: withdrawal.status,
        requestDate: withdrawal.requestDate
      },
      wallet: {
        pendingBalance: wallet.pendingBalance,
        availableBalance: wallet.balance - wallet.pendingBalance
      }
    });
  } catch (error) {
    console.error('Error requesting withdrawal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit withdrawal request'
    });
  }
};

// Get user's withdrawal requests
export const getUserWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ user: req.user.id })
      .sort({ requestDate: -1 });

    res.json({
      success: true,
      withdrawals
    });
  } catch (error) {
    console.error('Error fetching withdrawals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch withdrawal requests'
    });
  }
};

// Admin: Get pending withdrawal requests
export const getPendingWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ status: 'pending' })
      .populate('user', 'name email username')
      .sort({ requestDate: 1 });

    // Enhance with verification details
    const enhancedWithdrawals = await Promise.all(withdrawals.map(async (withdrawal) => {
      const verification = await Verification.findOne({ user: withdrawal.user._id });

      //Wallet Information of the seller 
      const wallet = await Wallet.findOne({ user: withdrawal.user._id });
      return {
        ...withdrawal.toObject(),
        payoutDetails: verification?.payoutDetails || {},
        verificationDocuments: verification?.documents.map(doc => ({
          type: doc.type,
          fileUrl: doc.fileUrl,
          uploadDate: doc.uploadDate,
          verifiedDate: doc.verifiedDate,
          adminNotes: doc.adminNotes
        })) || [],


        // ADD THIS: Include wallet data
        walletInfo: wallet ? {
          balance: wallet.balance,
          pendingBalance: wallet.pendingBalance,
          totalTransactions: wallet.transactions.length,
          recentTransactions: wallet.transactions
            .slice(-5)
            .reverse()
            .map(t => ({
              type: t.type,
              amount: t.amount,
              description: t.description,
              createdAt: t.createdAt,
              status: t.status
            }))
        } : null
      };
    }));

    res.json({
      success: true,
      count: enhancedWithdrawals.length,
      withdrawals: enhancedWithdrawals
    });
  } catch (error) {
    console.error('Error getting pending withdrawals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pending withdrawals'
    });
  }
};

// Admin: Process withdrawal request
export const processWithdrawal = async (req, res) => {
  try {
    const { withdrawalId, status, payoutReference, adminNotes } = req.body;

    if (!['approved', 'rejected', 'paid'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const withdrawal = await Withdrawal.findById(withdrawalId);

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal request not found'
      });
    }

    // Update withdrawal status
    withdrawal.status = status;
    withdrawal.processedDate = new Date();
    withdrawal.adminId = req.user.id;

    if (adminNotes) withdrawal.adminNotes = adminNotes;
    if (payoutReference) withdrawal.payoutReference = payoutReference;

    await withdrawal.save();

    // Update the related transaction in the wallet
    const wallet = await Wallet.findOne({ user: withdrawal.user });

    if (wallet) {
      // Find the pending transaction
      const transactionIndex = wallet.transactions.findIndex(
        t => t.type === 'withdrawal' &&
          t.amount === -withdrawal.amount &&
          t.status === 'pending'
      );

      if (transactionIndex !== -1) {
        // Update the transaction status
        if (status === 'rejected') {
          wallet.transactions[transactionIndex].status = 'failed';
        } else if (status === 'approved' || status === 'paid') {
          wallet.transactions[transactionIndex].status = 'completed';
        }

        // Update wallet balances
        if (status === 'rejected') {
          // Return funds to available balance
          wallet.pendingBalance -= withdrawal.amount;
          // No change to main balance because it wasn't deducted yet
        } else if (status === 'approved' || status === 'paid') {
          // Move from pending to confirmed withdrawal
          wallet.pendingBalance -= withdrawal.amount;
          wallet.balance -= withdrawal.amount;
        }

        await wallet.save();
      }
    }

    res.json({
      success: true,
      message: `Withdrawal request ${status}`,
      withdrawal
    });
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process withdrawal request'
    });
  }
};

