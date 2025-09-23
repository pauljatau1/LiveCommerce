/**
 * Register Service
 *
 * This service handles the business logic for buyer registration functionality.
 * It provides comprehensive registration capabilities including validation,
 * automatic email verification, name generation, and account creation.
 *
 * The service ensures that:
 * - Registration data is properly validated
 * - First name and last name are generated from username if not provided
 * - New buyer accounts are created with proper initialization
 * - Email verification is automatic (no OTP required)
 * - JWT tokens are generated for immediate authentication
 * - Expo push tokens are stored for notifications
 * - Wallet is properly initialized for new accounts
 *
 * Registration Flow:
 * - Input validation and data verification
 * - Name generation from username if not provided
 * - Buyer object creation with wallet initialization
 * - Database storage with atomic operations
 * - Expo push token storage (if provided)
 * - JWT token generation
 * - Success response with user data and token
 *
 * Security Features:
 * - Comprehensive input validation
 * - Automatic email verification
 * - Proper password hashing
 * - JWT token generation
 * - Expo push token validation
 * - Name generation for display purposes
 *
 * Name Generation:
 * - Automatic generation from username when not provided
 * - Proper capitalization and formatting
 * - Handles single and multi-word usernames
 * - Ensures all buyers have display names
 *
 * @module registerService
 */

const buyerRepository = require('../repositories/buyer.repository');
const buyerValidator = require('../validators/register.validator');
const { generateToken } = require('../../../utils/helpers');
const Buyer = require('../../../models/Buyer');
const { saveToken, getToken } = require('../../../../Firebase');

/**
 * Registers a new buyer user account - Main business logic function.
 *
 * This is the primary service function that orchestrates the complete
 * buyer registration process. It handles validation, account creation,
 * automatic email verification, and token generation in a secure and efficient manner.
 *
 * Business Logic Flow:
 * 1. Validates the registration input data
 * 2. Generates first name and last name from username if not provided
 * 3. Creates a new Buyer object with proper initialization
 * 4. Saves the buyer to the database with wallet initialization
 * 5. Stores the Expo push token (if provided) for notifications
 * 6. Generates a JWT token for immediate authentication
 * 7. Returns the created user data and authentication token
 *
 * Account Initialization:
 * - Creates buyer with all required fields
 * - Generates names from username if not provided
 * - Initializes wallet with zero balance
 * - Sets up default notification preferences
 * - Establishes account verification status (email auto-verified)
 * - No OTP verification required
 *
 * Security Features:
 * - Comprehensive input validation before processing
 * - Automatic email verification (no OTP required)
 * - Proper password hashing in the model
 * - JWT token generation for authentication
 * - Expo push token validation and storage
 *
 * @param {Object} data - The registration data object
 * @param {string} [data.firstName] - Buyer's first name (optional, generated from username if not provided)
 * @param {string} [data.lastName] - Buyer's last name (optional, generated from username if not provided)
 * @param {string} data.username - Desired username (must be unique, required)
 * @param {string} data.email - Buyer's email address (must be unique)
 * @param {string} data.country - Country code or name
 * @param {string} data.phoneNumber - Contact number (no longer unique)
 * @param {string} data.password - Hashed password
 * @param {string} [data.expoPushToken] - Optional Expo push token for notifications
 * @returns {Promise<Object>} An object containing the saved buyer and a JWT token
 *   - user: {Object} - The created buyer object
 *   - token: {string} - JWT authentication token
 * @throws {ValidationError} If registration data validation fails
 * @throws {Error} If database operations fail
 *
 * @example
 * // Register a new buyer with names
 * const result = await register({
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   username: 'johndoe',
 *   email: 'john@example.com',
 *   country: 'Nigeria',
 *   phoneNumber: '+2341234567890',
 *   password: 'hashedPassword123',
 *   expoPushToken: 'ExponentPushToken[...]'
 * });
 * // Returns: { user: { ... }, token: 'jwt_token_here' }
 *
 * @example
 * // Register a new buyer without names (generated from username)
 * const result = await register({
 *   username: 'johndoe',
 *   email: 'john@example.com',
 *   country: 'Nigeria',
 *   phoneNumber: '+2341234567890',
 *   password: 'hashedPassword123'
 * });
 * // firstName and lastName will be generated from 'johndoe'
 */
async function register(data) {
  // Step 1: Validate registration data using the validator
  // This ensures all required fields are present and valid
  await buyerValidator.validateRegisterData(data);

  // Step 2: Generate first name and last name from username if not provided
  // This ensures all buyers have names for display purposes
  const processedData = generateNamesFromUsername(data);

  // Step 3: Create and save the new buyer with properly initialized wallet
  // This creates the buyer object and saves it to the database atomically
  const buyer = await getNewBuyerObject(processedData);
  const newBuyer = await buyerRepository.save(buyer);

  // Step 4: Save Expo push token if provided for notifications
  // This enables push notifications for the new user
  if (data.expoPushToken && data.expoPushToken != undefined) {
    await saveToken(newBuyer._id, data.expoPushToken);
  }
  
  // Step 5: Generate JWT token for immediate authentication
  // This allows the user to be logged in immediately after registration
  const token = generateToken(newBuyer._id);

  // Step 6: Return user data and authentication token
  return { user: newBuyer, token: token };
}

/**
 * Generates first name and last name from username if not provided.
 *
 * This function ensures that all buyers have display names by generating
 * first name and last name from the username when they are not provided
 * during registration.
 *
 * Name Generation Logic:
 * - If firstName and lastName are provided, use them as-is
 * - If only firstName is provided, use it as firstName and generate lastName from username
 * - If only lastName is provided, use it as lastName and generate firstName from username
 * - If neither is provided, generate both from username
 *
 * Username Processing:
 * - Converts username to title case for better display
 * - Handles single word usernames by using it as firstName
 * - Handles multi-word usernames by splitting appropriately
 * - Ensures names are properly formatted and capitalized
 *
 * @param {Object} data - The registration data object
 * @param {string} [data.firstName] - Optional first name
 * @param {string} [data.lastName] - Optional last name
 * @param {string} data.username - Username to generate names from
 * @returns {Object} Data object with firstName and lastName populated
 * @example
 * // Generate names from username
 * const result = generateNamesFromUsername({
 *   username: 'johndoe',
 *   email: 'john@example.com'
 * });
 * // Returns: { username: 'johndoe', firstName: 'Johndoe', lastName: 'User', email: 'john@example.com' }
 *
 * @example
 * // Use provided names
 * const result = generateNamesFromUsername({
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   username: 'johndoe',
 *   email: 'john@example.com'
 * });
 * // Returns: { firstName: 'John', lastName: 'Doe', username: 'johndoe', email: 'john@example.com' }
 */
function generateNamesFromUsername(data) {
  // Step 1: Create a copy of the data to avoid mutation
  const processedData = { ...data };

  // Step 2: Check if both names are provided
  if (processedData.firstName && processedData.lastName) {
    // Both names provided, use them as-is
    return processedData;
  }

  // Step 3: Generate names from username
  const username = processedData.username;
  const words = username.split(/[-_]/); // Split on hyphens and underscores
  
  if (words.length >= 2) {
    // Multiple words: use first as firstName, rest as lastName
    processedData.firstName = processedData.firstName || capitalizeFirst(words[0]);
    processedData.lastName = processedData.lastName || capitalizeFirst(words.slice(1).join(' '));
  } else {
    // Single word: use as firstName, generate lastName
    processedData.firstName = processedData.firstName || capitalizeFirst(username);
    processedData.lastName = processedData.lastName || 'User';
  }

  return processedData;
}

/**
 * Capitalizes the first letter of a string.
 *
 * This utility function ensures proper capitalization for generated names.
 *
 * @param {string} str - String to capitalize
 * @returns {string} String with first letter capitalized
 * @example
 * capitalizeFirst('johndoe'); // Returns 'Johndoe'
 * capitalizeFirst('john_doe'); // Returns 'John_doe'
 */
function capitalizeFirst(str) {
  if (!str || str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Note: Email sending functionality has been removed as email verification
// is now automatic and no OTP is required for buyer registration.

/**
 * Create a new buyer object with proper initialization.
 * 
 * This function creates a new Buyer instance with all required fields
 * and proper initialization including wallet setup and automatic email verification.
 *
 * Object Initialization:
 * - Sets all required buyer fields from registration data
 * - Initializes wallet with zero balance and default currency
 * - Sets email as automatically verified (no OTP required)
 * - Establishes default notification preferences
 * - Prepares account for immediate use
 *
 * @param {Object} data - The registration data object
 * @returns {Promise<Object>} The created buyer object ready for database storage
 */
async function getNewBuyerObject(data) {
  // Step 1: Create new buyer object with registration data
  const buyer = new Buyer({
    firstName: data.firstName,
    lastName: data.lastName,
    username: data.username,
    email: data.email,
    country: data.country,
    phoneNumber: data.phoneNumber,
    password: data.password,
    // Step 2: Set email as automatically verified
    emailVerified: true,
    // Step 3: Initialize wallet with default values
    wallet: {
      balance: 0,
      currency: 'NGN',
      onHoldItems: [],
      onHoldAmount: 0
    },
    // Step 4: Set default notification preferences
    notificationPreferences: {
      orderUpdates: {
        orderConfirmation: true,
        shippingAndDelivery: true,
        orderCancellation: true,
        refundUpdates: true
      },
      liveShows: {
        allShows: true,
        followedSellers: true,
        recommendedShows: true
      },
      messages: {
        fromSellers: true,
        fromBuyers: true,
        chatReplies: true,
        mentions: true
      },
      communityActivity: {
        postComments: true,
        postLikes: true,
        repliesAndMentions: true
      },
      promotionsAndSales: {
        flashSales: true,
        couponsAndDeals: true,
        trendingProducts: true,
        recommendations: true
      }
    }
  });

  return buyer;
}

module.exports = {
  register
};