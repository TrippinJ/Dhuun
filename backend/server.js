
import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import expressListRoutes from 'express-list-routes';

import orderRoutes from './routes/orderRoutes.js';
import producerRoutes from './routes/producerRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import { router as authRoutes } from './routes/auth.js';
import beatRoutes from './routes/beatRoutes.js';
import subscriptionRoutes from './routes/subscription.js';
import adminRoutes from './routes/adminRoutes.js';
import walletRoutes from './routes/walletRoutes.js';
import verificationRoutes from './routes/verificationRoutes.js';
import withdrawalRoutes from './routes/withdrawalRoutes.js';
import adminWithdrawalRoutes from './routes/adminWithdrawalRoutes.js';
import followRoutes from './routes/followRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import creatorResourcesRoutes from './routes/creatorResourcesRoutes.js';


// Get __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173", "https://accounts.google.com", "http://localhost:3000/admin/*"],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Enhanced request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`, 
    req.method === 'POST' ? `Body: ${JSON.stringify(req.body)}` : '');
  next();
});

app.use(session({
  secret: process.env.SESSION_SECRET || "your_session_secret",
  resave: false,
  saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ DB Connection Error:", err);
    process.exit(1);
  });

// Directory setup
const uploadsDir = path.join(__dirname, 'uploads');
const usersDir = path.join(uploadsDir, 'users');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
if (!fs.existsSync(usersDir)) fs.mkdirSync(usersDir);

const tempDir = path.join(__dirname, 'temp_uploads');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
  console.log('✅ Temporary upload directory created');
}

// Test routes
app.get("/", (req, res) => {
  res.send("Dhuun Backend is Running...");
});

app.get("/test", (req, res) => {
  res.json({ 
    message: "Dhuun Backend API is working!", 
    timestamp: new Date().toISOString() 
  });
});

// API Routes 
app.use("/api/auth", authRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use('/api/beats', beatRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/producers', producerRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/admin/withdrawals', adminWithdrawalRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/follow', followRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/creator-resources', creatorResourcesRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('ERROR:', err.stack);
  res.status(500).json({ 
    message: 'Server error', 
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler for unmatched routes
app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: 'Route not found' });
});

// Log registered routes
console.log("✅ Registered API Routes:");
expressListRoutes(app);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🚀 Test at: http://localhost:${PORT}/`);
});

// Temp file cleanup (keep this part unchanged)
setInterval(() => {
  try {
    if (!fs.existsSync(tempDir)) return;
    const files = fs.readdirSync(tempDir);
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000;

    files.forEach(file => {
      const filePath = path.join(tempDir, file);
      const stats = fs.statSync(filePath);
      const fileAge = now - stats.mtimeMs;

      if (fileAge > maxAge) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Deleted temp file: ${filePath}`);
      }
    });

    console.log('✅ Temp directory cleaned up');
  } catch (error) {
    console.error('❌ Error cleaning up temp files:', error);
  }
}, 24 * 60 * 60 * 1000);