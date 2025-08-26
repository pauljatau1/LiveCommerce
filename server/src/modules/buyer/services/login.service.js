const Buyer = require('../../../models/Buyer');
const { saveToken, getToken } = require('../../../../Firebase');
const { generateToken } = require('../../../utils/helpers');
const ValidationError = require('../../../utils/errors/ValidationError');
const NotFoundException = require('../../../utils/errors/NotFoundException');
const UnauthorizedException = require('../../../utils/errors/UnauthorizedException');
const { validateLoginData } = require('../validators/login.validator');
const expo = require('expo-server-sdk').Expo; // Ensure `expo-server-sdk` is installed
const { findByEmail } = require('../repositories/buyer.repository');
const expoInstance = new expo();

/**
 * Logs in a buyer using email/password or Google login.
 *
 * @param {Object} data - The login request body
 * @param {string} data.email - Buyer's email
 * @param {string} data.password - Buyer's password
 * @param {string} [data.expoPushToken] - Optional Expo push token
 * @param {string} [data.googleToken] - Optional Google token
 * @returns {Promise<Object>} - Authenticated user and token
 */
async function login(data) {
  // Validate input data
  await validateLoginData(data);

  const { email, password, expoPushToken, googleToken } = data;

  if (googleToken) {
    return await googleLoginMobile(data);
  }

  const buyer = await findByEmail(email);
  if (!buyer || !(await buyer.comparePassword(password))) {
    throw new NotFoundException('Invalid credentials');
  }

  // Save Expo push token (if any)
  if (expoPushToken) {
    await saveToken(buyer._id, expoPushToken);
  }

  // Send push notification
  const userToken = await getToken(buyer._id);
  if (userToken?.token) {
    await expoInstance.sendPushNotificationsAsync([
      {
        to: userToken.token,
        title: `Welcome to Auqli`,
        body: `You have successfully logged in to your account`,
      },
    ]);
  }

  // Return buyer and JWT
  const token = generateToken(buyer._id);
  return { user: buyer, token: token };
}

/**
 * Handles Google login for mobile clients.
 * If the user does not exist, it will fallback to Google registration.
 *
 * @param {Object} data - Request body data
 * @param {string} data.email - Buyer's email
 * @param {string} data.googleToken - Token used as password (not a real Google OAuth token here)
 * @param {string} [data.expoPushToken] - Optional Expo push token for notifications
 * @returns {Promise<void>}
 */
async function googleLoginMobile(data) {
  const { email, googleToken, expoPushToken } = data;

  const buyer = await findByEmail(email);

  // If buyer does not exist, attempt registration instead
  if (!buyer) {
    return await googleRegisterMobile(data);
  }

  // Check if the token matches the password field (temporary Google login strategy)
  const isValid = await buyer.comparePassword(googleToken);
  if (!isValid) {
    throw UnauthorizedException();
  }

  // Save push token if provided
  if (expoPushToken) {
    await saveToken(buyer._id, expoPushToken);
  }

  const token = generateToken(buyer._id);

  return { user: buyer, token: token };
}

module.exports = {
  login,
};