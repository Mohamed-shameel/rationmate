const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OTP = require('../models/OTP');

const router = express.Router();

// User login with phone number
router.post('/user/login', async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    // Verify OTP first
    const otpRecord = await OTP.findOne({
      phoneNumber,
      otp,
      isUsed: false
    });

    if (!otpRecord || otpRecord.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Find or create user
    let user = await User.findOne({ phoneNumber });
    if (!user) {
      user = new User({
        phoneNumber,
        isVerified: true
      });
      await user.save();
    } else {
      user.isVerified = true;
      await user.save();
    }

    // Mark OTP as used
    otpRecord.isUsed = true;
    await otpRecord.save();

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, type: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        name: user.name,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('User login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

module.exports = router;