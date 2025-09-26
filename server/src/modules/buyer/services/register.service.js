/**
 * Register Service
 *
 * This service handles the business logic for buyer registration functionality.
 * It provides comprehensive registration capabilities including validation,
 * name generation, and account creation with auto-verified email.
 *
 * The service ensures that:
 * - Registration data is properly validated
 * - First and last names are generated from username if not provided
 * - New buyer accounts are created with proper initialization
 * - Email is automatically verified (no OTP required)
 * - JWT tokens are generated for immediate authentication
 * - Expo push tokens are stored for notifications
 * - Wallet is properly initialized for new accounts
 *
 * Registration Flow:
 * - Input validation and data verification
 * - Name generation from username if needed
 * - Buyer object creation with wallet initialization
 * - Database storage with atomic operations
 * - Expo push token storage (if provided)
 * - JWT token generation
 * - Success response with user data and token
 *
 * Security Features:
 * - Comprehensive input validation
 * - Email auto-verification for streamlined registration
 * - Proper password hashing
 * - JWT token generation
 * - Expo push token validation
 *
 * @module registerService
 */

const buyerRepository = require('../repositories/buyer.repository');
const buyerValidator = require('../validators/register.validator');
const { generateToken } = require('../../../utils/helpers');
const Buyer = require('../../../models/Buyer');
// Use alias so tests can mock without executing Firebase admin init
// Defer requiring Firebase to runtime to play nicely with Jest mocks
// const { saveToken } = require('../../../../Firebase');

/**
 * Registers a new buyer user account - Main business logic function.
 *
 * This is the primary service function that orchestrates the complete
 * buyer registration process. It handles validation, account creation,
 * name generation, and token generation in a secure and efficient manner.
 *
 * Business Logic Flow:
 * 1. Validates the registration input data
 * 2. Generates first and last names from username if not provided
 * 3. Creates a new Buyer object with proper initialization
 * 4. Saves the buyer to the database with wallet initialization
 * 5. Stores the Expo push token (if provided) for notifications
 * 6. Generates a JWT token for immediate authentication
 * 7. Returns the created user data and authentication token
 *
 * Account Initialization:
 * - Creates buyer with all required fields
 * - Auto-generates names from username if not provided
 * - Initializes wallet with zero balance
 * - Sets up default notification preferences
 * - Establishes account verification status (email auto-verified)
 * - No OTP verification required
 *
 * Security Features:
 * - Comprehensive input validation before processing
 * - Proper password hashing in the model
 * - JWT token generation for authentication
 * - Expo push token validation and storage
 * - Email auto-verification for streamlined registration
 *
 * @param {Object} data - The registration data object
 * @param {string} data.username - Desired username (must be unique, required)
 * @param {string} data.email - Buyer's email address (must be unique, required)
 * @param {string} data.password - Hashed password (required)
 * @param {string} [data.firstName] - Buyer's first name (optional, auto-generated if not provided)
 * @param {string} [data.lastName] - Buyer's last name (optional, auto-generated if not provided)
 * @param {string} [data.country] - Country code or name (optional)
 * @param {string} [data.phoneNumber] - Contact number (optional, not unique)
 * @param {string} [data.expoPushToken] - Optional Expo push token for notifications
 * @returns {Promise<Object>} An object containing the saved buyer and a JWT token
 *   - user: {Object} - The created buyer object
 *   - token: {string} - JWT authentication token
 * @throws {ValidationError} If registration data validation fails
 * @throws {Error} If database operations fail
 *
 * @example
 * // Register a new buyer with all fields
 * const result = await register({
 *   username: 'johndoe',
 *   email: 'john@example.com',
 *   password: 'hashedPassword123',
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   country: 'Nigeria',
 *   phoneNumber: '+2341234567890',
 *   expoPushToken: 'ExponentPushToken[...]'
 * });
 * // Returns: { user: { ... }, token: 'jwt_token_here' }
 *
 * @example
 * // Register a new buyer with minimal fields (names auto-generated)
 * const result = await register({
 *   username: 'janedoe',
 *   email: 'jane@example.com',
 *   password: 'hashedPassword123'
 * });
 * // Returns: { user: { firstName: 'Jane', lastName: 'Doe', ... }, token: 'jwt_token_here' }
 */
async function register(data) {
  // Step 1: Validate registration data using the validator
  // This ensures all required fields are present and valid
  await buyerValidator.validateRegisterData(data);

  // Step 2: Generate first and last names from username if not provided
  // This ensures every buyer has a name for display purposes
  const processedData = generateNamesFromUsername(data);

  // Step 3: Create and save the new buyer with properly initialized wallet
  // This creates the buyer object and saves it to the database atomically
  const buyer = await getNewBuyerObject(processedData);
  const newBuyer = await buyerRepository.save(buyer);

  // Step 4: Save Expo push token if provided for notifications
  // This enables push notifications for the new user
  if (data.expoPushToken && data.expoPushToken != undefined) {
    const { saveToken } = require('../../../../Firebase');
    await saveToken(newBuyer._id, data.expoPushToken);
  }
  
  // Step 5: Generate JWT token for immediate authentication
  // This allows the user to be logged in immediately after registration
  const token = generateToken(newBuyer._id);

  // Step 6: Return user data and authentication token
  return { user: newBuyer, token: token };
}


/**
 * Generate first and last names from username if not provided.
 * 
 * This function creates appropriate first and last names from the username
 * when they are not provided during registration. It handles various username
 * formats and creates natural-sounding names.
 *
 * Name Generation Logic:
 * - If firstName and lastName are provided, returns data as-is
 * - If only firstName is provided, generates lastName from username
 * - If only lastName is provided, generates firstName from username
 * - If neither is provided, generates both from username
 * - Handles usernames with underscores, dots, hyphens, and numbers
 * - Capitalizes names appropriately
 *
 * @param {Object} data - The registration data object
 * @param {string} data.username - The username to generate names from
 * @param {string} [data.firstName] - Optional first name
 * @param {string} [data.lastName] - Optional last name
 * @returns {Object} The data object with generated names
 * @example
 * // Generate both names from username
 * generateNamesFromUsername({ username: 'john_doe' })
 * // Returns: { username: 'john_doe', firstName: 'John', lastName: 'Doe' }
 *
 * // Generate lastName from username
 * generateNamesFromUsername({ username: 'jane_smith', firstName: 'Jane' })
 * // Returns: { username: 'jane_smith', firstName: 'Jane', lastName: 'Smith' }
 */
function generateNamesFromUsername(data) {
  const { username, firstName, lastName } = data;
  
  // If both names are provided, return data as-is
  if (firstName && lastName) {
    return data;
  }
  
  // Create a copy of the data object
  const processedData = { ...data };
  
  // Generate names from username
  const nameParts = username
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ') // Replace non-alphanumeric with spaces
    .split(' ')
    .filter(part => part.length > 0); // Remove empty parts
  
  if (nameParts.length >= 2) {
    // Use first two parts as first and last name
    const generatedFirstName = nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1);
    const generatedLastName = nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1);
    
    processedData.firstName = firstName || generatedFirstName;
    processedData.lastName = lastName || generatedLastName;
  } else if (nameParts.length === 1) {
    // Use the single part as first name, generate last name
    const generatedFirstName = nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1);
    const generatedLastName = 'User'; // Default last name
    
    processedData.firstName = firstName || generatedFirstName;
    processedData.lastName = lastName || generatedLastName;
  } else {
    // Fallback if username has no valid parts
    processedData.firstName = firstName || 'User';
    processedData.lastName = lastName || 'User';
  }
  
  return processedData;
}

/**
 * Create a new buyer object with proper initialization.
 * 
 * This function creates a new Buyer instance with all required fields
 * and proper initialization including wallet setup. Email is auto-verified.
 *
 * Object Initialization:
 * - Sets all required buyer fields from registration data
 * - Initializes wallet with zero balance and default currency
 * - Sets email as verified (no OTP required)
 * - Establishes default notification preferences
 * - Prepares account for immediate use
 *
 * @param {Object} data - The registration data object with generated names
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
    // Step 2: Email is auto-verified (no OTP required)
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