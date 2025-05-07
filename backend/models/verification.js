// backend/models/verification.js
import mongoose from "mongoose";

const VerificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  documents: [
    {
      type: {
        type: String,
        enum: ['id', 'address', 'bank', 'tax'],
        required: true
      },
      fileUrl: {
        type: String,
        required: true
      },
      filePublicId: {
        type: String,
        required: true
      },
      uploadDate: {
        type: Date,
        default: Date.now
      },
      verifiedDate: Date,
      adminNotes: String
    }
  ],
  submittedDate: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  payoutDetails: {
    paymentMethod: {
      type: String,
      enum: ['bank', 'paypal', 'khalti', 'other'],
    },
    bankName: String,
    accountNumber: String,
    accountName: String,
    swiftCode: String,
    paypalEmail: String,
    khaltiId: String,
    otherDetails: Object
  },
  adminNotes: String
}, { timestamps: true });

export default mongoose.model('Verification', VerificationSchema);