const express = require('express');
const jwt = require('jsonwebtoken');
const Shop = require('../models/Shop');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all shops
router.get('/', async (req, res) => {
  try {
    const shops = await Shop.find({ isActive: true })
      .select('-password') // Don't send passwords
      .sort({ name: 1 });

    res.json({
      success: true,
      shops
    });
  } catch (error) {
    console.error('Get shops error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get shops'
    });
  }
});

// Shop owner login
router.post('/login', async (req, res) => {
  try {
    const { shopId, password } = req.body;

    // Find shop
    const shop = await Shop.findOne({ shopId });
    if (!shop) {
      return res.status(400).json({
        success: false,
        message: 'Shop not found'
      });
    }

    // Check password
    const isMatch = await shop.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid password'
      });
    }

    // Create token
    const token = jwt.sign(
      { shopId: shop._id, type: 'shop' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Shop login successful',
      token,
      shop: {
        id: shop._id,
        shopId: shop.shopId,
        name: shop.name,
        ownerName: shop.ownerName,
        inventory: shop.inventory
      }
    });
  } catch (error) {
    console.error('Shop login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

// Update inventory (shop owners only)
router.put('/:shopId/inventory', auth, async (req, res) => {
  try {
    const { productName, quantity } = req.body;

    const shop = await Shop.findById(req.user.shopId);
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }

    // Find product in inventory
    const productIndex = shop.inventory.findIndex(
      item => item.productName.toLowerCase() === productName.toLowerCase()
    );

    if (productIndex > -1) {
      // Update existing product
      shop.inventory[productIndex].currentStock = quantity;
      shop.inventory[productIndex].lastUpdated = new Date();
    } else {
      // Add new product
      shop.inventory.push({
        productName,
        currentStock: quantity,
        unit: productName.toLowerCase() === 'cooking oil' ? 'liters' : 'kg',
        lastUpdated: new Date()
      });
    }

    await shop.save();

    res.json({
      success: true,
      message: 'Inventory updated successfully',
      inventory: shop.inventory
    });
  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update inventory'
    });
  }
});

// Add new product
router.post('/:shopId/inventory', auth, async (req, res) => {
  try {
    const { productName, quantity } = req.body;

    const shop = await Shop.findById(req.user.shopId);
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }

    // Check if product already exists
    const existingProduct = shop.inventory.find(
      item => item.productName.toLowerCase() === productName.toLowerCase()
    );

    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: 'Product already exists'
      });
    }

    // Add new product
    shop.inventory.push({
      productName,
      currentStock: quantity,
      unit: productName.toLowerCase().includes('oil') ? 'liters' : 'kg',
      lastUpdated: new Date()
    });

    await shop.save();

    res.json({
      success: true,
      message: 'Product added successfully',
      inventory: shop.inventory
    });
  } catch (error) {
    console.error('Add product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add product'
    });
  }
});

// Delete product
router.delete('/:shopId/inventory/:productName', auth, async (req, res) => {
  try {
    const { productName } = req.params;

    const shop = await Shop.findById(req.user.shopId);
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }

    // Remove product from inventory
    shop.inventory = shop.inventory.filter(
      item => item.productName.toLowerCase() !== productName.toLowerCase()
    );

    await shop.save();

    res.json({
      success: true,
      message: 'Product deleted successfully',
      inventory: shop.inventory
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product'
    });
  }
});

module.exports = router;