
import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  beat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Beat',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: {
    type: String,
    trim: true
  },
  text: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  adminNote: {
    type: String
  }
}, { timestamps: true });

// Add index for searching and querying
ReviewSchema.index({ 
  user: 1, 
  beat: 1,
  status: 1
});

export default mongoose.model('Review', ReviewSchema);