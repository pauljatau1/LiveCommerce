const jwt = require('jsonwebtoken');

function generateStreamLink(streamId,type) {
  return `https://app.auqli.live/livestream/feed?id=${streamId}&type=${type}&itmSource=share`
}

// Helper function to generate OTP (4-digit)
function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Helper function to generate JWT
function generateToken(id) {
  return jwt.sign({ id, role: 'Buyer' }, process.env.JWT_SECRET, { expiresIn: '2w' });
}

module.exports = {
  generateStreamLink,
  generateOTP,
  generateToken
}