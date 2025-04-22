console.log("✅ Auth routes loaded successfully!");

import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/user.js';
import crypto from 'crypto';
import { sendOTPEmail } from '../utils/emailService.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_here";
// ✅ User Registration Route 
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
      console.log("🔄 Register Request Received:", req.body); // Debugging

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, username, phonenumber, email, password, role } = req.body;

      let user = await User.findOne({ email });
      if (user) return res.status(400).json({ message: "User already exists" });

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Generate 6-digit OTP
      const otp = crypto.randomInt(100000, 999999).toString();
      const otpExpires = new Date();
      otpExpires.setMinutes(otpExpires.getMinutes() + 10);


      user = new User({
        name,
        username,
        phonenumber,
        email,
        password: hashedPassword,
        role,
        isVerified: false,
        verificationOTP: otp,
        otpExpires
      });

      await user.save();

      // Send OTP email
      const emailResult = await sendOTPEmail(email, otp, name);

      if (!emailResult.success) {
        console.error("Failed to send OTP email:", emailResult.error);
        // We'll continue anyway, user can request a new OTP if needed
      }

      // Generate token for immediate login after registration
      const payload = { user: { id: user.id } };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

      res.status(201).json({
        message: "User registered successfully",
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: false
        }
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// ✅ User Login Route
router.post(
  "/login",
  [
    body("email", "Valid email is required").isEmail(),
    body("password", "Password is required").exists(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      let user = await User.findOne({ email });
      if (!user) return res.status(400).json({ message: "Invalid credentials" });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

      const payload = { user: { id: user.id } };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          subscription: user.subscription
        },
        verificationRequired: !user.isVerified
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// ✅ Get Logged-In User Data (Protected Route)
router.get("/me", authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Enhanced Middleware to Authenticate JWT Token - UPDATED
function authenticateUser(req, res, next) {
  // Get token from header
  const token = req.header("Authorization");

  // Check if no token
  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token.replace("Bearer ", ""), JWT_SECRET);

    // Set user in request initially from token
    req.user = decoded.user;

    // Verify that the user exists in the database
    User.findById(req.user.id)
      .then(user => {
        if (!user) {
          return res.status(401).json({ message: "User not found" });
        }

        // Store the full user object for use in controllers
        req.user = user;

        // Add both _id and id properties to ensure compatibility with all code
        // This is critical for other controllers that expect _id
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
    } else {
      return res.status(401).json({ message: "Invalid token" });
    }
  }
}

// ✅ Token Verification Route (NEW)
router.get("/verify", async (req, res) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Handle different authorization header formats
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader;

    if (!token) {
      return res.status(401).json({ message: 'Invalid token format' });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Extract user ID from token
    const userId = decoded.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'No user ID in token' });
    }

    // Find user in database
    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({ message: 'Valid token but user not found', userId: userId });
    }

    // Return token validation success
    return res.json({
      message: 'Token is valid',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      tokenDetails: {
        issued: decoded.iat ? new Date(decoded.iat * 1000).toISOString() : 'Unknown',
        expires: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : 'Unknown'
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    } else {
      return res.status(500).json({ message: 'Server error during token verification' });
    }
  }
});

// ✅ Test Route
router.get("/test", (req, res) => {
  res.send("Auth route is working!");
});



// In backend/routes/auth.js - Google Login route
router.post("/google-login", async (req, res) => {
  try {
    console.log("Google login request received:", req.body);
    const { name, email, googleId, avatar } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required from Google profile" });
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    console.log("Existing user check:", user ? "User found" : "New user");

    // Flag to indicate if this is a new user
    let isNewUser = false;

    if (!user) {
      // This is a new user
      isNewUser = true;

      // Create a new user WITH a default role
      user = new User({
        name: name,
        email: email,
        username: email.split('@')[0], // Generate username from email
        phonenumber: "Not provided", // Give a default value for phone number
        googleId: googleId,
        avatar: avatar,
        password: "google-auth",
        role: "buyer" // Explicitly set to buyer
      });

      console.log("New user object created:", user); // Log the complete user object for debugging
      await user.save();
      console.log("New user saved to database");
    } else if (!user.googleId) {
      // Existing user but first time using Google login
      user.googleId = googleId;
      user.avatar = avatar || user.avatar;
      await user.save();
      console.log("Updated existing user with Google info");
    }

    // Generate JWT token
    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET || "default_jwt_secret_replace_this", { expiresIn: "1h" });

    // Return user data WITH the isNewUser flag
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        subscription: user.subscription
      },
      isNewUser // Send this flag to the frontend
    });
  } catch (error) {
    console.error("Google login server error:", error);
    res.status(500).json({ error: error.message });
  }
});


router.post("/update-role", authenticateUser, async (req, res) => {
  try {
    const { role } = req.body;

    // Validate role input
    if (!role || !["buyer", "seller"].includes(role)) {
      return res.status(400).json({ message: "Invalid role specified" });
    }

    // Update user's role
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { role: role },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Role updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Role update error:", error);
    res.status(500).json({ message: "Server error updating role" });
  }
});

// OTP Verification Route
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if OTP has expired
    if (user.otpExpires < new Date()) {
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    // Verify OTP
    if (user.verificationOTP !== otp) {
      return res.status(400).json({ message: "Invalid OTP. Please try again." });
    }

    // Mark user as verified and clear OTP fields
    user.isVerified = true;
    user.verificationOTP = undefined;
    user.otpExpires = undefined;
    await user.save();

    // Generate new token with updated verification status
    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

    res.json({
      message: "Email verified successfully!",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: true
      }
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Resend OTP Route
router.post("/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // If already verified, no need to resend
    if (user.isVerified) {
      return res.status(400).json({ message: "User is already verified" });
    }

    // Generate new OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpires = new Date();
    otpExpires.setMinutes(otpExpires.getMinutes() + 10); // OTP expires in 10 minutes

    // Update user with new OTP
    user.verificationOTP = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp, user.name);

    if (!emailResult.success) {
      return res.status(500).json({ message: "Failed to send OTP email. Please try again." });
    }

    res.json({
      message: "OTP sent successfully. Please check your email."
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({ error: error.message });
  }
});

export { router, authenticateUser };
