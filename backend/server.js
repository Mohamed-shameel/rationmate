const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware (these help our server work properly)
app.use(helmet()); // Security
app.use(cors()); // Allow frontend to talk to backend
app.use(express.json()); // Understand JSON data

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
app.use('/api/otp', require('./routes/otp'));

// Test endpoint to make sure server is working
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working! 🎉' });
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

// Create sample shops when server starts
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

      await Shop.insertMany(sampleShops);
      console.log('✅ Sample shops created');
    }
  } catch (error) {
    console.error('Error creating shops:', error);
  }
}