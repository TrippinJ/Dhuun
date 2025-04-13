import mongoose from "mongoose";

const ProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    unique: true,
    sparse: true // Allows null values to exist
  },
  bio: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  website: {
    type: String,
    default: ''
  },
  avatar: {
    type: String,
    default: ''
  },
  avatarPublicId: {
    type: String
  },
  socialLinks: {
    youtube: { type: String, default: '' },
    twitter: { type: String, default: '' },
    instagram: { type: String, default: '' },
    soundcloud: { type: String, default: '' }
  },
  stats: {
    beatsUploaded: { type: Number, default: 0 },
    beatsSold: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 }
  }
}, { timestamps: true });

export default mongoose.model('Profile', ProfileSchema);