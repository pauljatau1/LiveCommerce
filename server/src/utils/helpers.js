const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Where fans open shows. Set BUYER_APP_URL when the app moves to its own domain.
const buyerAppUrl = () => (process.env.BUYER_APP_URL || 'https://livecommerce-shop.onrender.com').replace(/\/+$/, '');

// Seller base is an origin; studio paths are built in one place.
const sellerAppUrl = () => (process.env.SELLER_APP_URL || 'https://livecommerce-studio.onrender.com').replace(/\/+$/, '').replace(/\/studio$/, '');
const sellerAppLink = (path = '') => `${sellerAppUrl()}/studio${path ? `/${path.replace(/^\/+/, '')}` : ''}`;
const appName = () => process.env.APP_NAME || 'gbam';

// Shareable link to a show in the buyer app
function generateStreamLink(streamId) {
  return `${buyerAppUrl()}/live/${streamId}`;
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
  buyerAppUrl,
  sellerAppUrl,
  sellerAppLink,
  appName,
  generateOTP,
  generateToken,
  generatePaymentReference
};