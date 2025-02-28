console.log("✅ Auth routes loaded successfully!");

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user"); // Ensure this model exists
const { body, validationResult } = require("express-validator");
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_here"; // Use environment variable for security

// ✅ User Registration Route (Fixed)
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

      const { name, username, phonenumber, email, password } = req.body;

      let user = await User.findOne({ email });
      if (user) return res.status(400).json({ message: "User already exists" });

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      user = new User({ name, username, phonenumber, email, password: hashedPassword });
      await user.save();

      res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
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

      res.json({ token, user: { id: user.id, fullname: user.fullname, email: user.email } });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ✅ Get Logged-In User Data (Protected Route)
router.get("/me", authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Middleware to Authenticate JWT Token
function authenticateUser(req, res, next) {
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ message: "Access denied. No token provided." });

  try {
    const decoded = jwt.verify(token.replace("Bearer ", ""), JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
}

// ✅ Test Route
router.get("/test", (req, res) => {
  res.send("Auth route is working!");
});

router.post("/google-login", async (req, res) => {
  try {
    const { name, email, googleId, avatar } = req.body;

    let user = await User.findOne({ email });

    if (!user) {
      // If user doesn't exist, create a new one
      user = new User({
        name,
        email,
        googleId,
        avatar, 
        password: "google-auth", // Placeholder since Google handles authentication
      });

      await user.save();
    }

    // Generate JWT token
    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
