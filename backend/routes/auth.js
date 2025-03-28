console.log("✅ Auth routes loaded successfully!");

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user"); 
const { body, validationResult } = require("express-validator");
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_here"; // Use environment variable for security

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

      user = new User({ 
        name, 
        username, 
        phonenumber, 
        email, 
        password: hashedPassword,
        role
      });
      
      await user.save();

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
          role: user.role
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
          subscription: user.subscription
        } 
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

// ✅ Google Login Route
router.post("/google-login", async (req, res) => {
  try {
    const { name, email, googleId, avatar } = req.body;

    let user = await User.findOne({ email });

    if (!user) {
      // If user doesn't exist, create a new one
      user = new User({
        name,
        email,
        username: email.split('@')[0], // Generate a username from email
        phonenumber: "", // Google auth users may not provide phone
        googleId,
        avatar, 
        password: "google-auth", // Placeholder since Google handles authentication
        role: "buyer" // Default role
      });

      await user.save();
    } else {
      // Update existing user with Google info if they're logging in with Google
      if (!user.googleId) {
        user.googleId = googleId;
        user.avatar = avatar || user.avatar;
        await user.save();
      }
    }

    // Generate JWT token
    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

    res.json({ 
      token, 
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        subscription: user.subscription
      } 
    });
  } catch (error) {
    console.error("Google login error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = {
  router,
  authenticateUser
};