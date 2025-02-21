require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");

// ✅ Load Google OAuth config (if needed)
// require("./config/passport"); 

// ✅ Import Routes
const authRoutes = require("./routes/auth");
// const cors = require("cors");
// const beatRoutes = require("./routes/BeatRoute");
// const userRoutes = require("./routes/UserRoute");

const app = express();
const PORT = process.env.PORT || 8080;

// ✅ CORS Middleware Setup
app.use(cors({
  origin: "http://localhost:3000", // Allow frontend requests
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true
}));

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ Google OAuth Session Middleware (Only If Using OAuth)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "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",
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// ✅ Debugging Logs
console.log("MONGO_URI:", process.env.MONGO_URI);  // Ensure .env is loaded

// ✅ Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ DB Connection Error:", err);
    process.exit(1); // Stop the server if DB connection fails
  });

// ✅ Register API Routes
app.use("/api/auth", authRoutes);
// app.use("/api/beats", beatRoutes);
// app.use("/api/users", userRoutes);

console.log("✅ Registered Routes: /api/auth");

const expressListRoutes = require("express-list-routes");

console.log("✅ Registered API Routes:");
expressListRoutes(app);



// ✅ Test Routes
app.get("/", (req, res) => {
  res.send("Dhuun Backend is Running...");
});

app._router.stack.forEach((r) => {
  if (r.route && r.route.path) {
    console.log("✅ Active Route:", r.route.path);
  }
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});


console.log("🚀 Server is running! Test at: http://localhost:8080/");
