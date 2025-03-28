require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const path = require("path");
const expressListRoutes = require("express-list-routes");

// Import Routes
const { router: authRoutes } = require("./routes/auth");
const beatRoutes = require('./routes/beatRoutes');
const subscriptionRoutes = require("./routes/subscription");

// Initialize Express
const app = express();
const PORT = process.env.PORT || 8080;

// CORS Middleware Setup
app.use(cors({
  origin: "http://localhost:3000", // Allow frontend requests
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true
}));

// Basic Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files middleware - Important for serving uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logger middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Session Middleware (for OAuth)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your_session_secret",
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ DB Connection Error:", err);
    process.exit(1); // Stop the server if DB connection fails
  });

// Register API Routes
app.use("/api/auth", authRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use('/api/beats', beatRoutes);

// Test Route
app.get("/", (req, res) => {
  res.send("Dhuun Backend is Running...");
});

// Create uploads directories if they don't exist
const uploadsDir = path.join(__dirname, 'uploads');
const usersDir = path.join(uploadsDir, 'users');
if (!require('fs').existsSync(uploadsDir)) {
  require('fs').mkdirSync(uploadsDir);
}
if (!require('fs').existsSync(usersDir)) {
  require('fs').mkdirSync(usersDir);
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

// Log registered routes
console.log("✅ Registered API Routes:");
expressListRoutes(app);

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🚀 Test at: http://localhost:${PORT}/`);
});