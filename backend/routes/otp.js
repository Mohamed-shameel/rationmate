const express = require('express');
const OTP = require('../models/OTP');
const { sendOtpSms } = require('../utils/helpers');

const router = express.Router();

// POST /api/otp/send
router.post('/send', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    // Validate 10-digit Indian phone number
    if (!phoneNumber || !/^\d{10}$/.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: 'A valid 10-digit phone number is required'
      });
    }

    // Generate a 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Delete any existing OTPs for this phone number
    await OTP.deleteMany({ phoneNumber });

    // Save new OTP record
    await new OTP({
      phoneNumber,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    }).save();

    // Send SMS via Twilio
    try {
      const sid = await sendOtpSms(phoneNumber, otp);
      console.log(`📱 OTP SMS sent to +91${phoneNumber} — SID: ${sid}`);
    } catch (smsError) {
      console.error('❌ Twilio SMS error:', smsError.message);
      // In development, fall through and still return the OTP
      if (process.env.NODE_ENV !== 'development') {
        return res.status(500).json({
          success: false,
          message: 'Failed to send OTP SMS. Please try again.'
        });
      }
      console.warn('⚠️  Running in development mode — OTP returned in response despite SMS failure.');
    }

    res.json({
      success: true,
      message: 'OTP sent successfully',
      // Only expose OTP in development mode for easier testing
      otp: process.env.NODE_ENV === 'development' ? otp : undefined
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP'
    });
  }
});

// POST /api/otp/verify
router.post('/verify', async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    const otpRecord = await OTP.findOne({
      phoneNumber,
      otp,
      isUsed: false
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
    }

    otpRecord.isUsed = true;
    await otpRecord.save();

    res.json({
      success: true,
      message: 'OTP verified successfully'
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'OTP verification failed'
    });
  }
});

module.exports = router;