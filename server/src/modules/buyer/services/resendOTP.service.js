const Buyer = require('../../../models/Buyer');
const sgMail = require('@sendgrid/mail');
const ValidationError = require('../../../utils/errors/ValidationError');
const NotFoundException = require('../../../utils/errors/NotFoundException');
const { validateResendOTPData } = require('../validators/resendOTP.validator');
const fs = require('fs');
const path = require('path');

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Generates a 4-digit OTP.
 *
 * @returns {string} 4-digit OTP
 */
function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Constructs the email content for resend OTP verification.
 *
 * @param {string} email - The recipient's email address.
 * @param {string} otp - The verification code to embed in the email.
 * @returns {object} SendGrid-compatible email content object.
 */
async function getEmailContent(email, otp) {
  const filePath = path.join(__dirname, '../../../', 'templates', 'resend-otp-email.html');
  let html = fs.readFileSync(filePath, 'utf-8');

  html = html.replace('{{otp}}', otp);
  html = html.replace('{{year}}', new Date().getFullYear());

  return {
    to: email,
    from: 'Joseph From Auqli <support@auqli.com>',
    subject: 'Your New Verification Code - Auqli',
    html
  };
}

/**
 * Sends the OTP email.
 *
 * @param {string} email - Recipient email
 * @param {string} otp - OTP to send
 * @returns {Promise<void>}
 */
async function sendOTPEmail(email, otp) {
  const msg = await getEmailContent(email, otp);
  await sgMail.send(msg);
}

/**
 * Updates buyer's OTP.
 *
 * @param {Object} buyer - Buyer object
 * @param {string} otp - New OTP
 * @returns {Promise<void>}
 */
async function updateBuyerOTP(buyer, otp) {
  buyer.otp = otp;
  await buyer.save();
}

/**
 * Resends OTP to buyer's email.
 *
 * @param {string} email - Buyer's email address
 * @returns {Promise<Object>} - Resend result
 */
async function resendOTP(email) {
  // Validate input data
  await validateResendOTPData({ email });

  // Find buyer by email
  const buyer = await Buyer.findOne({ email });
  if (!buyer) {
    throw new NotFoundException('Buyer not found');
  }

  // Generate new OTP
  const otp = generateOTP();

  // Update buyer's OTP
  await updateBuyerOTP(buyer, otp);

  // Send OTP email
  await sendOTPEmail(email, otp);

  // Return success result
  return {
    message: 'OTP resent successfully'
  };
}

module.exports = {
  resendOTP,
}; 