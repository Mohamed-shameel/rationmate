const express = require('express');
const jwt = require('jsonwebtoken');
const Shop = require('../models/Shop');
const auth = require('../middleware/auth');

const router = express.Router();

// ─── GET /api/shops ────────────────────────────────────────────────────────────
// Public: return all active shops (no password in response)
router.get('/', async (req, res) => {
  try {
    const shops = await Shop.find({ isActive: true })
      .select('-password')
      .sort({ name: 1 });

    res.json({ success: true, shops });
  } catch (error) {
    console.error('Get shops error:', error);
    res.status(500).json({ success: false, message: 'Failed to get shops' });
  }
});

// ─── GET /api/shops/:shopId ─────────────────────────────────────────────────────
// Public: return a single shop's inventory (used by user-facing inventory view)
router.get('/:shopId', async (req, res) => {
  try {
    const shop = await Shop.findOne({
      shopId: req.params.shopId,
      isActive: true
    }).select('-password');

    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found' });
    }

    res.json({ success: true, shop });
  } catch (error) {
    console.error('Get single shop error:', error);
    res.status(500).json({ success: false, message: 'Failed to get shop' });
  }
});

// ─── POST /api/shops/login ──────────────────────────────────────────────────────
// Shop owner login — returns JWT containing the shop's string shopId
router.post('/login', async (req, res) => {
  try {
    const { shopId, password } = req.body;

    if (!shopId || !password) {
      return res.status(400).json({
        success: false,
        message: 'Shop ID and password are required'
      });
    }

    const shop = await Shop.findOne({ shopId });
    if (!shop) {
      return res.status(400).json({ success: false, message: 'Shop not found' });
    }

    const isMatch = await shop.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid password' });
    }

    // Encode the shopId STRING (not _id) so we can use it in route params later
    const token = jwt.sign(
      { shopId: shop.shopId, type: 'shop' },
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
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// ─── PUT /api/shops/:shopId/inventory ──────────────────────────────────────────
// Protected (shop owners only): update existing product stock
router.put('/:shopId/inventory', auth, async (req, res) => {
  try {
    // Ensure the shop owner can only modify their own shop
    if (req.user.type !== 'shop' || req.user.shopId !== req.params.shopId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own shop inventory'
      });
    }

    const { productName, quantity } = req.body;

    if (productName === undefined || quantity === undefined || isNaN(quantity) || quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid productName and quantity (≥ 0) are required'
      });
    }

    const shop = await Shop.findOne({ shopId: req.params.shopId });
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found' });
    }

    const productIndex = shop.inventory.findIndex(
      item => item.productName.toLowerCase() === productName.toLowerCase()
    );

    if (productIndex > -1) {
      shop.inventory[productIndex].currentStock = Number(quantity);
      shop.inventory[productIndex].lastUpdated = new Date();
    } else {
      // Product doesn't exist — create it
      shop.inventory.push({
        productName,
        currentStock: Number(quantity),
        unit: productName.toLowerCase().includes('oil') ? 'liters' : 'kg',
        lastUpdated: new Date()
      });
    }

    await shop.save();
    res.json({ success: true, message: 'Inventory updated', inventory: shop.inventory });
  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({ success: false, message: 'Failed to update inventory' });
  }
});

// ─── POST /api/shops/:shopId/inventory ─────────────────────────────────────────
// Protected: add a new product to inventory
router.post('/:shopId/inventory', auth, async (req, res) => {
  try {
    if (req.user.type !== 'shop' || req.user.shopId !== req.params.shopId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own shop inventory'
      });
    }

    const { productName, quantity } = req.body;

    if (!productName || quantity === undefined || isNaN(quantity) || quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid productName and quantity (≥ 0) are required'
      });
    }

    const shop = await Shop.findOne({ shopId: req.params.shopId });
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found' });
    }

    const exists = shop.inventory.find(
      item => item.productName.toLowerCase() === productName.toLowerCase()
    );
    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'Product already exists. Use the Update action instead.'
      });
    }

    shop.inventory.push({
      productName,
      currentStock: Number(quantity),
      unit: productName.toLowerCase().includes('oil') ? 'liters' : 'kg',
      lastUpdated: new Date()
    });

    await shop.save();
    res.json({ success: true, message: 'Product added', inventory: shop.inventory });
  } catch (error) {
    console.error('Add product error:', error);
    res.status(500).json({ success: false, message: 'Failed to add product' });
  }
});

// ─── DELETE /api/shops/:shopId/inventory/:productName ─────────────────────────
// Protected: remove a product from inventory
router.delete('/:shopId/inventory/:productName', auth, async (req, res) => {
  try {
    if (req.user.type !== 'shop' || req.user.shopId !== req.params.shopId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own shop inventory'
      });
    }

    const { productName } = req.params;

    const shop = await Shop.findOne({ shopId: req.params.shopId });
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found' });
    }

    const beforeCount = shop.inventory.length;
    shop.inventory = shop.inventory.filter(
      item => item.productName.toLowerCase() !== productName.toLowerCase()
    );

    if (shop.inventory.length === beforeCount) {
      return res.status(404).json({ success: false, message: 'Product not found in inventory' });
    }

    await shop.save();
    res.json({ success: true, message: 'Product deleted', inventory: shop.inventory });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete product' });
  }
});

module.exports = router;