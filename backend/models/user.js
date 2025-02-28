const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true},
  phonenumber: { type: String, required: true},
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  googleId: { type: String, unique: true, sparse: true }, // For Google Auth Users
  avatar: { type: String }, // Profile picture URL
  role: { type: String, required: true, enum: ["buyer", "seller"] },
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
