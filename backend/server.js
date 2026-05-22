const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── CORS Configuration ─────────────────────────────────────────────────────
// In production, restrict origins; in development, allow everything.
const corsOptions = process.env.NODE_ENV === 'production'
  ? {
      origin: process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
        : true, // fallback: allow all if not configured
      credentials: true
    }
  : {}; // wide open in dev

// Middleware (these help our server work properly)
app.use(helmet({
  contentSecurityPolicy: false // allow Tailwind CDN, Google Fonts, etc.
}));
app.use(cors(corsOptions));   // Allow frontend to talk to backend
app.use(express.json());      // Understand JSON data

// ─── Serve Frontend Static Files ─────────────────────────────────────────────
// The frontend folder sits one level up from the backend directory.
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ─── Rate Limiting ───────────────────────────────────────────────────────────
// General API limiter — 100 requests per 15 minutes per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' }
});
app.use('/api/', apiLimiter);

// Strict OTP limiter — 5 requests per 10 minutes per IP
// Prevents SMS bombing and Twilio credit abuse
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many OTP requests. Please wait 10 minutes before trying again.' }
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    createDefaultShops(); // Create sample shops
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    console.log('Make sure MongoDB is running!');
  });

// Routes (these handle different URLs)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/shops', require('./routes/shops'));
app.use('/api/otp', otpLimiter, require('./routes/otp'));

// Test endpoint to make sure server is working
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working! 🎉' });
});

// ─── SPA Catch-All ───────────────────────────────────────────────────────────
// Any request that doesn't match an API route serves the frontend index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔗 Test it: http://localhost:${PORT}/api/test`);
});

// ─── Create sample shops when server starts ──────────────────────────────────
// Uses individual .save() calls instead of insertMany() so that the
// Mongoose pre('save') hook runs and passwords are properly bcrypt-hashed.
async function createDefaultShops() {
  try {
    const Shop = require('./models/Shop');
    const shopCount = await Shop.countDocuments();
    
    if (shopCount === 0) {
      const sampleShops = [
        {
          shopId: 'SHOP001',
          name: 'Main Street Ration',
          address: {
            street: '123 Main Street',
            city: 'Anytown',
            state: 'State',
            pincode: '123456'
          },
          ownerName: 'John Doe',
          licenseNumber: 'LIC001',
          phoneNumber: '9876543210',
          password: 'admin123',
          inventory: [
            { productName: 'Wheat', currentStock: 50, unit: 'kg' },
            { productName: 'Rice', currentStock: 100, unit: 'kg' },
            { productName: 'Sugar', currentStock: 75, unit: 'kg' },
            { productName: 'Lentils', currentStock: 60, unit: 'kg' },
            { productName: 'Cooking Oil', currentStock: 40, unit: 'liters' }
          ]
        },
        {
          shopId: 'SHOP002',
          name: 'Central Ration Depot',
          address: {
            street: '456 Central Avenue',
            city: 'Anytown',
            state: 'State',
            pincode: '123456'
          },
          ownerName: 'Jane Smith',
          licenseNumber: 'LIC002',
          phoneNumber: '9876543211',
          password: 'shop123',
          inventory: [
            { productName: 'Wheat', currentStock: 80, unit: 'kg' },
            { productName: 'Rice', currentStock: 120, unit: 'kg' },
            { productName: 'Sugar', currentStock: 50, unit: 'kg' },
            { productName: 'Lentils', currentStock: 70, unit: 'kg' },
            { productName: 'Cooking Oil', currentStock: 35, unit: 'liters' }
          ]
        }
      ];

      // Save each shop individually so the pre('save') bcrypt hook runs
      for (const shopData of sampleShops) {
        const shop = new Shop(shopData);
        await shop.save();
      }
      console.log('✅ Sample shops created (passwords hashed)');
    }
  } catch (error) {
    console.error('Error creating shops:', error);
  }
}