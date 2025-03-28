const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true },
  phonenumber: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  googleId: { type: String, unique: true, sparse: true }, // For Google Auth Users
  avatar: { type: String }, // Profile picture URL
  role: { type: String, required: true, default: 'buyer', enum: ["buyer", "seller"] },

  // ✅ Subscription Details
  subscription: {
    plan: { type: String, enum: ["Free", "Standard", "Pro"], default: "Free" },
    status: { type: String, enum: ["active", "expired", "canceled"], default: "active" },
    expiryDate: { type: Date, default: null },
    uploadLimit: { type: Number, default: 5 }, // Free plan allows 5 uploads
    revenueShare: { type: Number, default: 60 }, // Free plan revenue share 60%
  },

  // ✅ User Stats - Added to fix storage tracking
  stats: {
    totalStorage: { type: Number, default: 0 },
    plays: { type: Number, default: 0 },
    sales: { type: Number, default: 0 },
    downloads: { type: Number, default: 0 }
  }

}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);