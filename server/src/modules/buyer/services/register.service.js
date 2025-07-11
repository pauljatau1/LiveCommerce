const buyerRepository = require('../repositories/buyer.repository');
const buyerValidator = require('../validators/register.validator');
const { generateOTP, generateToken } = require('../../../utils/helpers');
const Buyer = require('../models/buyer.model');
const { saveToken, getToken } = require('../../../../Firebase');
const sgMail = require('@sendgrid/mail');
const InternalErrorException = require('../../../utils/errors/InternalErrorException');
const fs = require('fs');
const path = require('path');

/**
 * Registers a new buyer user account.
 *
 * This function:
 * - Validates the registration input
 * - Generates a one-time password (OTP)
 * - Creates a new Buyer object
 * - Saves the buyer to the database
 * - Stores the Expo push token (if provided)
 * - Sends a verification email
 * - Generates a JWT token for the user
 *
 * @param {Object} data - The registration data
 * @param {string} data.firstName - Buyer's first name
 * @param {string} data.lastName - Buyer's last name
 * @param {string} data.username - Desired username
 * @param {string} data.email - Buyer's email address
 * @param {string} data.country - Country code or name
 * @param {string} data.phoneNumber - Contact number
 * @param {string} data.password - Hashed password
 * @param {string} [data.expoPushToken] - Optional Expo push token
 *
 * @returns {Promise<Object>} An object containing the saved buyer and a JWT token
 */
async function register(data) {
  // validate data for register
  await buyerValidator.validateRegisterData(data)

  // Helper function to generate OTP (4-digit)
  const otp = generateOTP();

  // Save the new buyer with properly initialized wallet
  const buyer = await getNewBuyerObject(data, otp)
  const newBuyer = await buyerRepository.save(buyer)

  // Only save token if provided
  if (data.expoPushToken && data.expoPushToken != undefined) {
    await saveToken(newBuyer._id, data.expoPushToken);
  }
  
  const emailSent = await sendRegisterEmail(data.email, otp)
  const token = generateToken(newBuyer._id);

  return { user: newBuyer, token: token };
}

/**
 * Sends a registration verification email using SendGrid.
 * 
 * @param {string} email - The recipient's email address.
 * @param {string} otp - The OTP code to include in the email.
 * @param {object} res - (Optional) Express response object for error handling (only use if needed here).
 */
async function sendRegisterEmail(email, otp) {
  const emailContent = await getEmailContent(email, otp);

  try {
    const sgResponse = await sgMail.send(emailContent);
    return true;
  } catch (sendError) {
    console.error('SendGrid error:', sendError);
    throw new InternalErrorException(sendError.message);
  }
}

/**
 * Constructs the email content for registration verification.
 *
 * @param {string} email - The recipient's email address.
 * @param {string} otp - The verification code to embed in the email.
 * @returns {object} SendGrid-compatible email content object.
 */
async function getEmailContent(email, otp) {
  const filePath = path.join(__dirname, '../../../', 'templates', 'register-email.html');
  let html = fs.readFileSync(filePath, 'utf-8');

  html = html.replace('{{otp}}', otp);
  html = html.replace('{{year}}', new Date().getFullYear());

  return {
    to: email,
    from: 'Auqli Nigeria <support@auqli.com>',
    subject: 'Your Email Verification Code',
    html
  };
}

/**
 * Create a new buyer object.
 * 
 * @param {Object} data - register action input
 * @param {Number} otp - 4-digit number
 */
async function getNewBuyerObject(data, otp) {
  return new Buyer({
    "firstName": data.firstName,
    "lastName": data.lastName,
    "username": data.username,
    "email": data.email,
    "country": data.country,
    "phoneNumber": data.phoneNumber,
    "password": data.password,
    "otp": otp,
    "expoPushToken": data.expoPushToken,
    wallet: {
      balance: 0,
      onHoldAmount: 0,
      currency: 'NGN',
      transactions: [], // Initialize as empty array
      onHoldItems: []  // Initialize as empty array
    },
    shippingAddresses: [],
    wishlist: [],
    selectedCategories: [],
    activityFeed: [],
    conversations: [],
    messages: [],
    posts: [],
    viewedBlips: [],
    followers: []
  });
}

module.exports = {
  register,
};