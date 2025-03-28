const mongoose = require('mongoose');

const beatSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  producer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  genre: {
    type: String,
    required: true
  },
  bpm: {
    type: Number
  },
  key: {
    type: String
  },
  tags: [String],
  price: {
    type: Number,
    required: true
  },
  licenseType: {
    type: String,
    enum: ['non-exclusive', 'exclusive', 'both'],
    required: true
  },
  description: {
    type: String
  },
  audioFile: {
    type: String, // Path to the audio file
    required: true
  },
  coverImage: {
    type: String, // Path to the cover image
    required: true
  },
  plays: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  sales: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to update the updatedAt field
beatSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Beat = mongoose.model('Beat', beatSchema);

module.exports = Beat;