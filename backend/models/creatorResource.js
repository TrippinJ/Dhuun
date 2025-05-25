// backend/models/creatorResource.js
import mongoose from 'mongoose';

const CreatorResourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  instructor: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Mixing & Mastering', 'Beat Making', 'Music Theory', 'Vocal Production', 'Music Business']
  },
  type: {
    type: String,
    required: true,
    enum: ['pdf', 'blog', 'video']
  },
  image: {
    type: String,
    required: true
  },
  imagePublicId: {
    type: String // For Cloudinary deletion
  },
  description: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  level: {
    type: String,
    required: true,
    enum: ['Beginner', 'Intermediate', 'Advanced']
  },
  // For PDFs
  downloadUrl: {
    type: String
  },
  downloadPublicId: {
    type: String
  },
  // For blogs
  blogUrl: {
    type: String
  },
  // For videos
  videoUrl: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { 
  timestamps: true 
});

// Index for efficient querying
CreatorResourceSchema.index({ category: 1, isActive: 1 });
CreatorResourceSchema.index({ type: 1, isActive: 1 });

export default mongoose.model('CreatorResource', CreatorResourceSchema);