import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/user.js';
import crypto from 'crypto';
import { sendOTPEmail, sendWelcomeEmail, sendPasswordResetEmail } from '../utils/emailService.js';
import { deleteFromCloudinary } from '../utils/cloudinaryConfig.js';
import Profile from '../models/profile.js';
import Beat from '../models/beat.js';
import Order from '../models/order.js';

const router = express.Router();

console.log("✅ Auth routes loaded successfully!");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_here";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "your_refresh_secret_here";

// Token generators
const generateAccessToken = (userId) =>
  jwt.sign({ user: { id: userId } }, JWT_SECRET, { expiresIn: "15m" });

const generateRefreshToken = (userId) =>
  jwt.sign({ user: { id: userId } }, REFRESH_SECRET, { expiresIn: "7d" });

// Standard user shape returned in all auth responses
const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  isVerified: user.isVerified,
  subscription: user.subscription,
  avatar: user.avatar,
});

// ✅ Middleware to Authenticate JWT Token
function authenticateUser(req, res, next) {
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ message: "Access denied. No token provided." });

  try {
    const decoded = jwt.verify(token.replace("Bearer ", ""), JWT_SECRET);
    req.user = decoded.user;

    User.findById(req.user.id)
      .then(user => {
        if (!user) return res.status(401).json({ message: "User not found" });
        req.user = user;
        req.user._id = user._id;
        req.user.id = user._id.toString();
        next();
      })
      .catch(err => {
        console.error("User verification error:", err);
        res.status(500).json({ message: "Server error during authentication" });
      });
  } catch (error) {
    console.error("Token verification error:", error);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token has expired. Please log in again." });
    }
    return res.status(401).json({ message: "Invalid token" });
  }
}

// ✅ Register
router.post(
  "/register",
  [
    body("name", "Full name is required").notEmpty(),
    body("username", "Username is required").notEmpty(),
    body("phonenumber", "Phone number is required").notEmpty(),
    body("email", "Valid email is required").isEmail(),
    body("password", "Password must be at least 6 characters").isLength({ min: 6 }),
    body("role", "Role is required").notEmpty(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { name, username, phonenumber, email, password, role } = req.body;

      let user = await User.findOne({ email });
      if (user) return res.status(400).json({ message: "User already exists" });

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const otp = crypto.randomInt(100000, 999999).toString();
      const otpExpires = new Date();
      otpExpires.setMinutes(otpExpires.getMinutes() + 10);

      user = new User({
        name, username, phonenumber, email,
        password: hashedPassword,
        role,
        isVerified: false,
        verificationOTP: otp,
        otpExpires
      });
      await user.save();

      const profile = new Profile({
        user: user._id,
        username: user.username,
        bio: '',
        socialLinks: {},
        stats: { followers: 0, following: 0, beatsUploaded: 0, beatsSold: 0, totalEarnings: 0 }
      });
      await profile.save();

      const emailResult = await sendOTPEmail(email, otp, name);
      if (!emailResult.success) console.error("Failed to send OTP email:", emailResult.error);

      const accessToken = generateAccessToken(user.id);
      const refreshToken = generateRefreshToken(user.id);

      // Store refresh token on user
      user.refreshToken = refreshToken;
      await user.save();

      res.status(201).json({
        message: "User registered successfully",
        accessToken,
        refreshToken,
        user: formatUser(user),
        verificationRequired: true
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// ✅ Login
router.post(
  "/login",
  [
    body("email", "Valid email is required").isEmail(),
    body("password", "Password is required").exists(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { email, password } = req.body;

      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ message: "Invalid credentials" });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

      const accessToken = generateAccessToken(user.id);
      const refreshToken = generateRefreshToken(user.id);

      user.refreshToken = refreshToken;
      await user.save();

      res.json({
        accessToken,
        refreshToken,
        user: formatUser(user),
        verificationRequired: !user.isVerified
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// ✅ Refresh Token — issues new access token silently
router.post("/refresh-token", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: "Refresh token required" });

    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    const userId = decoded.user?.id;
    if (!userId) return res.status(401).json({ message: "Invalid refresh token" });

    // Check token matches what we stored (rotation security)
    const user = await User.findById(userId);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: "Refresh token invalid or reused" });
    }

    // Issue new pair (rotation — old refresh token is invalidated)
    const newAccessToken = generateAccessToken(user.id);
    const newRefreshToken = generateRefreshToken(user.id);

    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Refresh token expired. Please log in again." });
    }
    return res.status(401).json({ message: "Invalid refresh token" });
  }
});

// ✅ Verify token + return fresh user data from DB
router.get("/verify", async (req, res) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader) return res.status(401).json({ message: 'No token provided' });

    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.user?.id;
    if (!userId) return res.status(401).json({ message: 'No user ID in token' });

    const user = await User.findById(userId);
    if (!user) return res.status(401).json({ message: 'User not found' });

    return res.json({
      message: 'Token is valid',
      user: formatUser(user), // always fresh from DB
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired' });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
});

// ✅ Get Logged-In User Data
router.get("/me", authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -refreshToken");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Logout — invalidates refresh token server-side
router.post("/logout", authenticateUser, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { refreshToken: null });
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Logout error" });
  }
});

// ✅ Google Login
router.post("/google-login", async (req, res) => {
  try {
    const { name, email, googleId, avatar } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required from Google profile" });

    let user = await User.findOne({ email });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      user = new User({
        name, email,
        username: email.split('@')[0],
        phonenumber: "Not provided",
        googleId, avatar,
        password: "google-auth",
        role: "buyer"
      });

      const profile = new Profile({
        user: user._id,
        username: user.username,
        bio: '',
        socialLinks: {},
        stats: { followers: 0, following: 0, beatsUploaded: 0, beatsSold: 0, totalEarnings: 0 }
      });
      await profile.save();
      await user.save();
    } else if (!user.googleId) {
      user.googleId = googleId;
      user.avatar = avatar || user.avatar;
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      accessToken,
      refreshToken,
      user: formatUser(user),
      isNewUser
    });
  } catch (error) {
    console.error("Google login error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Update Role
router.post("/update-role", authenticateUser, async (req, res) => {
  try {
    const { role } = req.body;
    if (!role || !["buyer", "seller"].includes(role)) {
      return res.status(400).json({ message: "Invalid role specified" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id, { role }, { new: true }
    ).select("-password -refreshToken");

    if (!updatedUser) return res.status(404).json({ message: "User not found" });
    res.json({ message: "Role updated successfully", user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Server error updating role" });
  }
});

// ✅ Verify OTP
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.otpExpires < new Date()) {
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    if (user.verificationOTP !== otp) {
      return res.status(400).json({ message: "Invalid OTP. Please try again." });
    }

    user.isVerified = true;
    user.verificationOTP = null;
    user.otpExpires = null;
    await user.save();

    await sendWelcomeEmail(user.email, user.name);

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      message: "Email verified successfully!",
      accessToken,
      refreshToken,
      user: formatUser(user),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Resend OTP
router.post("/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isVerified) return res.status(400).json({ message: "User is already verified" });

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpires = new Date();
    otpExpires.setMinutes(otpExpires.getMinutes() + 10);

    user.verificationOTP = otp;
    user.otpExpires = otpExpires;
    await user.save();

    const emailResult = await sendOTPEmail(email, otp, user.name);
    if (!emailResult.success) {
      return res.status(500).json({ message: "Failed to send OTP email. Please try again." });
    }

    res.json({ message: "OTP sent successfully. Please check your email." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Delete Account
router.delete("/delete-account", authenticateUser, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ message: "Password is required for account deletion" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Incorrect password" });

    if (user.role === "seller") {
      const userBeats = await Beat.find({ producer: user._id });
      for (const beat of userBeats) {
        try {
          if (beat.audioPublicId) await deleteFromCloudinary(beat.audioPublicId, 'video');
          if (beat.imagePublicId) await deleteFromCloudinary(beat.imagePublicId, 'image');
        } catch (err) {
          console.error(`Error deleting beat files ${beat._id}:`, err);
        }
      }
      await Beat.deleteMany({ producer: user._id });
    }

    if (user.avatarPublicId) {
      try { await deleteFromCloudinary(user.avatarPublicId, 'image'); } catch (e) {}
    }

    await Profile.findOneAndDelete({ user: user._id });
    await Order.deleteMany({ user: user._id });
    await User.findByIdAndDelete(user._id);

    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error during account deletion" });
  }
});

// ✅ Forgot Password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal whether user exists
      return res.status(200).json({ message: "If a user with that email exists, a password reset link has been sent." });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    const emailResult = await sendPasswordResetEmail(user.email, resetToken, user.name);
    if (emailResult.success) {
      return res.status(200).json({ message: "Password reset link has been sent to your email address." });
    }
    return res.status(500).json({ message: "Failed to send password reset email. Please try again later." });
  } catch (error) {
    res.status(500).json({ message: "Server error. Please try again later." });
  }
});

// ✅ Reset Password
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: "Token and password are required" });

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    if (!user) return res.status(400).json({ message: "Password reset token is invalid or has expired" });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.refreshToken = null; // force re-login after password reset
    await user.save();

    res.status(200).json({ message: "Password has been reset successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Test Route
router.get("/test", (req, res) => res.send("Auth route is working!"));

export { router, authenticateUser };