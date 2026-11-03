const jwt = require('jsonwebtoken');
const crypto = require('crypto');

function generateStreamLink(streamId,type) {
  return `https://app.auqli.live/livestream/feed?id=${streamId}&type=${type}&itmSource=share`;
}

// Helper function to generate OTP (4-digit)
function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Helper function to generate JWT
function generateToken(id, role = 'Buyer', expiresIn = '500w') {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn });
}

/**
 * Generate a unique payment reference for wallet transactions.
 * @returns {string} A unique payment reference in format PAY-{timestamp}-{random}
 */
function generatePaymentReference() {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PAY-${timestamp}-${random}`;
}

module.exports = {
  generateStreamLink,
  generateOTP,
  generateToken,
  generatePaymentReference
};