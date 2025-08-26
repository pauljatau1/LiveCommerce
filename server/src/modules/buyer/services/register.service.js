/**
 * Register Service
 *
 * This service handles the business logic for buyer registration functionality.
 * It provides comprehensive registration capabilities including validation,
 * OTP generation, email verification, and account creation.
 *
 * The service ensures that:
 * - Registration data is properly validated
 * - Secure OTP codes are generated for email verification
 * - New buyer accounts are created with proper initialization
 * - Email verification is sent to new users
 * - JWT tokens are generated for immediate authentication
 * - Expo push tokens are stored for notifications
 * - Wallet is properly initialized for new accounts
 *
 * Registration Flow:
 * - Input validation and data verification
 * - OTP generation for email verification
 * - Buyer object creation with wallet initialization
 * - Database storage with atomic operations
 * - Expo push token storage (if provided)
 * - Email verification sending
 * - JWT token generation
 * - Success response with user data and token
 *
 * Security Features:
 * - Comprehensive input validation
 * - Secure OTP generation
 * - Email verification requirement
 * - Proper password hashing
 * - JWT token generation
 * - Expo push token validation
 *
 * Email System:
 * - HTML email templates with dynamic content
 * - SendGrid integration for reliable delivery
 * - Professional formatting for verification
 * - Template variable replacement
 *
 * @module registerService
 */

const buyerRepository = require('../repositories/buyer.repository');
const buyerValidator = require('../validators/register.validator');
const { generateOTP, generateToken } = require('../../../utils/helpers');
const Buyer = require('../../../models/Buyer');
const { saveToken, getToken } = require('../../../../Firebase');
const sgMail = require('@sendgrid/mail');
const InternalErrorException = require('../../../utils/errors/InternalErrorException');
const fs = require('fs');
const path = require('path');

/**
 * Registers a new buyer user account - Main business logic function.
 *
 * This is the primary service function that orchestrates the complete
 * buyer registration process. It handles validation, account creation,
 * email verification, and token generation in a secure and efficient manner.
 *
 * Business Logic Flow:
 * 1. Validates the registration input data
 * 2. Generates a secure one-time password (OTP) for email verification
 * 3. Creates a new Buyer object with proper initialization
 * 4. Saves the buyer to the database with wallet initialization
 * 5. Stores the Expo push token (if provided) for notifications
 * 6. Sends a verification email with the OTP
 * 7. Generates a JWT token for immediate authentication
 * 8. Returns the created user data and authentication token
 *
 * Account Initialization:
 * - Creates buyer with all required fields
 * - Initializes wallet with zero balance
 * - Sets up default notification preferences
 * - Establishes account verification status
 * - Prepares for email verification process
 *
 * Security Features:
 * - Comprehensive input validation before processing
 * - Secure OTP generation for email verification
 * - Proper password hashing in the model
 * - JWT token generation for authentication
 * - Expo push token validation and storage
 *
 * @param {Object} data - The registration data object
 * @param {string} data.firstName - Buyer's first name
 * @param {string} data.lastName - Buyer's last name
 * @param {string} data.username - Desired username (must be unique)
 * @param {string} data.email - Buyer's email address (must be unique)
 * @param {string} data.country - Country code or name
 * @param {string} data.phoneNumber - Contact number (must be unique)
 * @param {string} data.password - Hashed password
 * @param {string} [data.expoPushToken] - Optional Expo push token for notifications
 * @returns {Promise<Object>} An object containing the saved buyer and a JWT token
 *   - user: {Object} - The created buyer object
 *   - token: {string} - JWT authentication token
 * @throws {ValidationError} If registration data validation fails
 * @throws {InternalErrorException} If email sending fails
 * @throws {Error} If database operations fail
 *
 * @example
 * // Register a new buyer
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
 */
async function register(data) {
  // Step 1: Validate registration data using the validator
  // This ensures all required fields are present and valid
  await buyerValidator.validateRegisterData(data);

  // Step 2: Generate a secure 4-digit OTP for email verification
  // This OTP will be sent to the user's email for account verification
  const otp = generateOTP();

  // Step 3: Create and save the new buyer with properly initialized wallet
  // This creates the buyer object and saves it to the database atomically
  const buyer = await getNewBuyerObject(data, otp);
  const newBuyer = await buyerRepository.save(buyer);

  // Step 4: Save Expo push token if provided for notifications
  // This enables push notifications for the new user
  if (data.expoPushToken && data.expoPushToken != undefined) {
    await saveToken(newBuyer._id, data.expoPushToken);
  }
  
  // Step 5: Send registration verification email with OTP
  // This ensures the user can verify their email address
  const emailSent = await sendRegisterEmail(data.email, otp);
  
  // Step 6: Generate JWT token for immediate authentication
  // This allows the user to be logged in immediately after registration
  const token = generateToken(newBuyer._id);

  // Step 7: Return user data and authentication token
  return { user: newBuyer, token: token };
}

/**
 * Sends a registration verification email using SendGrid.
 * 
 * This function handles the email sending process for registration verification.
 * It constructs the email content using HTML templates and sends it via SendGrid
 * service. Errors are handled appropriately to maintain system integrity.
 *
 * Email Features:
 * - HTML email template with professional formatting
 * - Dynamic OTP code insertion
 * - SendGrid integration for reliable delivery
 * - Error handling for failed deliveries
 *
 * @param {string} email - The recipient's email address
 * @param {string} otp - The OTP code to include in the email
 * @returns {Promise<boolean>} True if email sent successfully
 * @throws {InternalErrorException} If email content construction or sending fails
 */
async function sendRegisterEmail(email, otp) {
  // Step 1: Get the email content with processed HTML template
  const emailContent = await getEmailContent(email, otp);

  try {
    // Step 2: Send the email using SendGrid service
    const sgResponse = await sgMail.send(emailContent);
    return true;
  } catch (sendError) {
    // Step 3: Handle email sending errors
    console.error('SendGrid error:', sendError);
    throw new InternalErrorException(sendError.message);
  }
}

/**
 * Constructs the email content for registration verification.
 *
 * This function reads the HTML email template and replaces dynamic placeholders
 * with actual values to create personalized verification emails.
 *
 * Template Processing:
 * - Reads HTML template from file system
 * - Replaces dynamic placeholders with actual values
 * - Handles UTF-8 encoding for proper text display
 * - Creates professional email structure
 *
 * Template Variables:
 * - {{otp}}: The verification OTP code
 * - {{year}}: Current year for copyright and branding
 *
 * @param {string} email - The recipient's email address
 * @param {string} otp - The verification code to embed in the email
 * @returns {Promise<Object>} SendGrid-compatible email content object
 *   - to: recipient email address
 *   - from: sender information with platform branding
 *   - subject: clear email subject line
 *   - html: processed HTML template content
 * @throws {Error} If template file cannot be read or processed
 */
async function getEmailContent(email, otp) {
  // Step 1: Construct the path to the registration email template
  const filePath = path.join(__dirname, '../../../', 'templates', 'register-email.html');
  
  // Step 2: Read the HTML template file synchronously
  // Using UTF-8 encoding to ensure proper text handling
  let html = fs.readFileSync(filePath, 'utf-8');

  // Step 3: Replace template placeholders with actual data
  html = html.replace('{{otp}}', otp);
  html = html.replace('{{year}}', new Date().getFullYear());

  // Step 4: Return SendGrid-compatible email object
  return {
    to: email,
    from: 'Auqli Nigeria <support@auqli.com>',
    subject: 'Your Email Verification Code',
    html
  };
}

/**
 * Create a new buyer object with proper initialization.
 * 
 * This function creates a new Buyer instance with all required fields
 * and proper initialization including wallet setup and verification data.
 *
 * Object Initialization:
 * - Sets all required buyer fields from registration data
 * - Initializes wallet with zero balance and default currency
 * - Sets up email verification with OTP and expiry
 * - Establishes default notification preferences
 * - Prepares account for email verification process
 *
 * @param {Object} data - The registration data object
 * @param {string} otp - The OTP code for email verification
 * @returns {Promise<Object>} The created buyer object ready for database storage
 */
async function getNewBuyerObject(data, otp) {
  // Step 1: Create new buyer object with registration data
  const buyer = new Buyer({
    firstName: data.firstName,
    lastName: data.lastName,
    username: data.username,
    email: data.email,
    country: data.country,
    phoneNumber: data.phoneNumber,
    password: data.password,
    // Step 2: Initialize email verification with OTP
    emailVerification: {
      otp: otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes expiry
    },
    // Step 3: Initialize wallet with default values
    wallet: {
      balance: 0,
      currency: 'NGN',
      onHoldItems: [],
      onHoldAmount: 0
    },
    // Step 4: Set default notification preferences
    notificationPreferences: {
      orderUpdates: true,
      liveShows: true,
      messages: true,
      communityActivity: true,
      promotionsAndSales: true
    }
  });

  return buyer;
}

module.exports = {
  register
};