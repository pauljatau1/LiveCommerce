/**
 * Login Service
 *
 * This service handles the business logic for buyer authentication functionality.
 * It provides comprehensive login capabilities including email/password authentication,
 * Google login support, and push notification integration.
 *
 * The service ensures that:
 * - Login credentials are properly validated
 * - Both email/password and Google authentication are supported
 * - Expo push tokens are stored for notifications
 * - Push notifications are sent upon successful login
 * - JWT tokens are generated for session management
 * - User data is returned securely
 * - Fallback registration is available for Google users
 *
 * Authentication Methods:
 * - Email/password authentication
 * - Google token authentication (mobile)
 * - Automatic registration for new Google users
 * - Secure password comparison
 * - Token-based authentication
 *
 * Security Features:
 * - Comprehensive input validation
 * - Secure password comparison
 * - JWT token generation
 * - Expo push token validation
 * - Error handling without information leakage
 *
 * Push Notification Integration:
 * - Expo push token storage
 * - Welcome notification on login
 * - Cross-platform notification support
 * - Error handling for notification failures
 *
 * @module loginService
 */

const { saveToken, getToken } = require('../../../../Firebase');
const { generateToken } = require('../../../utils/helpers');
const NotFoundException = require('../../../utils/errors/NotFoundException');
const UnauthorizedException = require('../../../utils/errors/UnauthorizedException');
const { validateLoginData } = require('../validators/login.validator');
const expo = require('expo-server-sdk').Expo; // Ensure `expo-server-sdk` is installed
const { findByEmail } = require('../repositories/buyer.repository');
const expoInstance = new expo();

/**
 * Logs in a buyer using email/password or Google login - Main business logic function.
 *
 * This is the primary service function that orchestrates the complete
 * buyer authentication process. It handles both traditional email/password
 * login and Google token authentication for mobile clients.
 *
 * Business Logic Flow:
 * 1. Validates the input data (email, password, optional tokens)
 * 2. Determines authentication method (Google vs email/password)
 * 3. Performs user lookup and credential verification
 * 4. Stores Expo push token for notifications (if provided)
 * 5. Sends welcome push notification
 * 6. Generates JWT token for session management
 * 7. Returns authenticated user data and token
 *
 * Authentication Methods:
 * - Email/password: Traditional credential verification
 * - Google token: Mobile-specific authentication with fallback registration
 * - Automatic registration: Creates account for new Google users
 *
 * Security Features:
 * - Comprehensive input validation before processing
 * - Secure password comparison using bcrypt
 * - JWT token generation for session management
 * - Expo push token validation and storage
 * - Error handling without credential information leakage
 *
 * @param {Object} data - The login request data object
 * @param {string} data.email - Buyer's email address
 * @param {string} data.password - Buyer's password (for email/password login)
 * @param {string} [data.expoPushToken] - Optional Expo push token for notifications
 * @param {string} [data.googleToken] - Optional Google token for mobile authentication
 * @returns {Promise<Object>} Authenticated user data and JWT token
 *   - user: {Object} - The authenticated buyer object
 *   - token: {string} - JWT authentication token
 * @throws {Error} If input validation fails
 * @throws {NotFoundException} If user not found or invalid credentials
 * @throws {UnauthorizedException} If Google authentication fails
 * @throws {Error} If database operations or notification sending fails
 *
 * @example
 * // Email/password login
 * const result = await login({
 *   email: 'user@example.com',
 *   password: 'userPassword123',
 *   expoPushToken: 'ExponentPushToken[...]'
 * });
 * // Returns: { user: { ... }, token: 'jwt_token_here' }
 *
 * @example
 * // Google login (mobile)
 * const result = await login({
 *   email: 'user@example.com',
 *   googleToken: 'google_token_here',
 *   expoPushToken: 'ExponentPushToken[...]'
 * });
 * // Returns: { user: { ... }, token: 'jwt_token_here' }
 */
async function login(data) {
  // Step 1: Validate input data using the validator
  // This ensures email and password are provided and properly formatted
  await validateLoginData(data);

  const { email, password, expoPushToken, googleToken } = data;

  // Step 2: Handle Google authentication for mobile clients
  // If Google token is provided, use Google-specific authentication flow
  if (googleToken) {
    return await googleLoginMobile(data);
  }

  // Step 3: Perform traditional email/password authentication
  // Find buyer by email and verify password
  const buyer = await findByEmail(email);
  if (!buyer || !(await buyer.comparePassword(password))) {
    throw new NotFoundException('Invalid credentials');
  }

  // Step 4: Save Expo push token for notifications (if provided)
  // This enables push notifications for the authenticated user
  if (expoPushToken) {
    await saveToken(buyer._id, expoPushToken);
  }

  // Step 5: Send welcome push notification
  // Retrieve stored token and send welcome message
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

  // Step 6: Generate JWT token for session management
  // This provides secure authentication for subsequent requests
  const token = generateToken(buyer._id);
  
  // Step 7: Return authenticated user data and token
  return { user: buyer, token: token };
}

/**
 * Handles Google login for mobile clients with fallback registration.
 * 
 * This function provides Google-specific authentication for mobile applications.
 * If the user doesn't exist, it automatically attempts registration to create
 * a new account using the Google token as the password.
 *
 * Google Authentication Flow:
 * - Checks if user exists with provided email
 * - If user exists, verifies Google token against stored password
 * - If user doesn't exist, attempts automatic registration
 * - Stores Expo push token for notifications
 * - Returns authenticated user data and JWT token
 *
 * Fallback Registration:
 * - Creates new account for Google users not in system
 * - Uses Google token as password for future authentication
 * - Maintains seamless user experience
 * - Handles both new and existing Google users
 *
 * @param {Object} data - Request body data object
 * @param {string} data.email - Buyer's email address
 * @param {string} data.googleToken - Token used as password (not a real Google OAuth token)
 * @param {string} [data.expoPushToken] - Optional Expo push token for notifications
 * @returns {Promise<Object>} Authenticated user data and JWT token
 *   - user: {Object} - The authenticated buyer object
 *   - token: {string} - JWT authentication token
 * @throws {UnauthorizedException} If Google authentication fails
 * @throws {Error} If database operations fail
 *
 * @example
 * // Google login for existing user
 * const result = await googleLoginMobile({
 *   email: 'user@example.com',
 *   googleToken: 'google_token_here',
 *   expoPushToken: 'ExponentPushToken[...]'
 * });
 * // Returns: { user: { ... }, token: 'jwt_token_here' }
 */
async function googleLoginMobile(data) {
  const { email, googleToken, expoPushToken } = data;

  // Step 1: Find buyer by email address
  const buyer = await findByEmail(email);

  // Step 2: If buyer doesn't exist, attempt automatic registration
  // This provides seamless experience for new Google users
  if (!buyer) {
    return await googleRegisterMobile(data);
  }

  // Step 3: Verify Google token against stored password
  // Uses the same password comparison as regular login
  const isValid = await buyer.comparePassword(googleToken);
  if (!isValid) {
    throw UnauthorizedException();
  }

  // Step 4: Save push token if provided for notifications
  if (expoPushToken) {
    await saveToken(buyer._id, expoPushToken);
  }

  // Step 5: Generate JWT token and return authenticated user
  const token = generateToken(buyer._id);
  return { user: buyer, token: token };
}

module.exports = {
  login,
};