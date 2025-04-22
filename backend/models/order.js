import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    beat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Beat',
      required: true
    },
    license: {
      type: String,
      required: true,
      enum: ['basic', 'premium', 'exclusive', 'Basic', 'Premium', 'Exclusive']
    },
    price: {
      type: Number,
      required: true
    }
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  customerEmail: {
    type: String
  },
  paymentMethod: {
    type: String,
    enum: ['khalti', 'card', 'other'],
    default: 'khalti'
  },
  paymentId: {
    type: String
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed'],
    default: 'Completed'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  paymentPidx: {
    type: String
  },
});

export default mongoose.model('Order', OrderSchema);