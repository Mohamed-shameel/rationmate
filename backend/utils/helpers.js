const twilio = require('twilio');

// Lazy-initialize Twilio client so the server doesn't crash if
// Twilio env vars are missing in development.
let twilioClient = null;

function getTwilioClient() {
  if (!twilioClient) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;

    if (!sid || !token) {
      throw new Error(
        'Twilio credentials missing. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in your .env file.'
      );
    }

    twilioClient = twilio(sid, token);
  }
  return twilioClient;
}

/**
 * Send an OTP SMS to an Indian phone number.
 * @param {string} phoneNumber - 10-digit Indian phone number (e.g. "9876543210")
 * @param {string} otp         - The OTP to send
 * @returns {Promise<string>}  - Twilio message SID
 */
async function sendOtpSms(phoneNumber, otp) {
  const client = getTwilioClient();

  // Convert to E.164 format for Indian numbers
  const e164Number = `+91${phoneNumber}`;

  const message = await client.messages.create({
    body: `Your RationMate OTP is: ${otp}. Valid for 5 minutes. Do not share this with anyone.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: e164Number
  });

  return message.sid;
}

module.exports = { sendOtpSms };
