import mongoose from "mongoose";

const BeatSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: [true, 'Please provide a title'],
    trim: true
  },
  genre: { 
    type: String, 
    required: [true, 'Please specify the genre'],
    trim: true
  },
  bpm: { 
    type: Number
  },
  key: { 
    type: String,
    trim: true
  },
  price: { 
    type: Number, 
    required: true,
    min: 0
  },
  licenseType: {
    type: String,
    required: true,
    trim: true
  },
  description: { 
    type: String,
    trim: true
  },
  producer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  // Cloudinary audio file URL
  audioFile: { 
    type: String, 
    required: true
  },
  // Cloudinary audio file public ID for deletion
  audioPublicId: { 
    type: String, 
    required: true
  },
  // Cloudinary cover image URL
  coverImage: { 
    type: String, 
    required: true
  },
  // Cloudinary cover image public ID for deletion
  imagePublicId: { 
    type: String, 
    required: true
  },
  tags: [String],
  plays: { 
    type: Number, 
    default: 0 
  },
  likes: {
    type: Number,
    default: 0
  },
  isExclusiveSold: {
    type: Boolean,
    default: false
  },
  exclusiveSoldTo: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    default: null
  },
  exclusiveSoldDate: { 
    type: Date,
    default: null
  },
  exclusiveOrderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Order',
    default: null
  },
  // Track purchases
  purchases: {
    type: Number,
    default: 0
  }
}, { 
  timestamps: true
});

// Add text search index
BeatSchema.index({ 
  title: 'text', 
  genre: 'text', 
  tags: 'text' 
});

const Beat = mongoose.model("Beat", BeatSchema);

export default Beat;