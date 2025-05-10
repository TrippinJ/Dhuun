import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true },
  phonenumber: { type: String, required: false },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  googleId: { type: String, unique: true, sparse: true },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  followersCount: {
    type: Number,
    default: 0
  },
  followingCount: {
    type: Number,
    default: 0
  },

  //OTP verification fields
  isVerified: { type: Boolean, default: false },
  verificationOTP: { type: String },
  otpExpires: { type: Date },

  // Profile fields
  avatar: { type: String }, // Profile picture URL
  avatarPublicId: { type: String }, // Cloudinary public ID for avatar
  bio: { type: String, default: "" }, // User biography/description

  // Social media links
  // socialLinks: {
  //   instagram: { type: String, default: "" },
  //   twitter: { type: String, default: "" },
  //   soundcloud: { type: String, default: "" },
  //   youtube: { type: String, default: "" }
  // },

  role: { type: String, required: true, default: 'buyer', enum: ["buyer", "seller", "admin"] },

  // ✅ Subscription Details
  subscription: {
    plan: { type: String, enum: ["Free", "Standard", "Pro"], default: "Free" },
    status: { type: String, enum: ["active", "expired", "canceled"], default: "active" },
    expiryDate: { type: Date, default: null },
    uploadLimit: { type: Number, default: 10 }, // Free plan allows 10 uploads
    revenueShare: { type: Number, default: 60 }, // Free plan revenue share 60%
  },

  // ✅ User Stats
  stats: {
    totalStorage: { type: Number, default: 0 },
    plays: { type: Number, default: 0 },
    sales: { type: Number, default: 0 },
    downloads: { type: Number, default: 0 }
  },

  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },

  //verification status field
  verificationStatus: {
    type: String,
    enum: ["not_submitted", "pending", "approved", "rejected"],
    default: "not_submitted"
  },

  // Track when the profile was last updated
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model("User", UserSchema);