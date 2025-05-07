// backend/models/withdrawal.js
import mongoose from "mongoose";

const WithdrawalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'paid'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['bank', 'paypal', 'khalti', 'other'],
    required: true
  },
  requestDate: {
    type: Date,
    default: Date.now
  },
  processedDate: Date,
  payoutReference: String, // Transaction ID from the payment processor
  adminNotes: String,
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

export default mongoose.model('Withdrawal', WithdrawalSchema);