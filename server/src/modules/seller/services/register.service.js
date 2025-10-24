/**
 * Register Service
 *
 * This service handles the business logic for seller registration functionality.
 * It provides comprehensive registration capabilities including validation,
 * automatic email verification, and account creation.
 *
 * The service ensures that:
 * - Registration data is properly validated
 * - Email addresses are automatically verified on registration
 * - New seller accounts are created with proper initialization
 * - Welcome emails are sent to new users
 * - JWT tokens are generated for immediate authentication
 * - Agora UID is generated for live streaming capabilities
 *
 * Registration Flow:
 * - Input validation and data verification
 * - Seller object creation with Agora UID and verified email
 * - Database storage with atomic operations
 * - Welcome email sending
 * - JWT token generation
 * - Success response with user data and token
 *
 * Security Features:
 * - Comprehensive input validation
 * - Automatic email verification on registration
 * - Proper password hashing
 * - JWT token generation
 * - Unique Agora UID generation
 *
 * Email System:
 * - HTML email templates with dynamic content
 * - SendGrid integration for reliable delivery
 * - Professional formatting for welcome emails
 * - Template variable replacement
 *
 * @module registerService
 */

const sellerRepository = require('../repositories/seller.repository');
const sellerValidator = require('../validators/register.validator');
const { generateOTP, generateToken } = require('../../../utils/helpers');
const Seller = require('../../../models/Seller');
const sgMail = require('@sendgrid/mail');
const ValidationError = require('../../../utils/errors/ValidationError');
const fs = require('fs');
const path = require('path');

/**
 * Generates a unique Agora UID for live streaming.
 *
 * This function creates a unique identifier for the Agora live streaming
 * service. It ensures uniqueness by checking against existing UIDs in
 * the database and retrying if a collision occurs.
 *
 * @returns {Promise<number>} A unique Agora UID
 * @throws {Error} If unable to generate unique UID after 5 attempts
 */
async function generateUniqueAgoraUid() {
  let attempts = 0;
  let agoraUid;
  let exists;
  
  do {
    // Generate UID between 100000 and 4294967295
    agoraUid = Math.floor(100000 + Math.random() * (4294967295 - 100000));
    exists = await sellerRepository.findByAgoraUid(agoraUid);
    attempts++;
  } while (exists && attempts < 5);

  if (exists) {
    throw new Error('Failed to generate unique Agora UID after 5 attempts');
  }

  return agoraUid;
}



/**
 * Sends welcome email to new seller.
 *
 * This function sends a professional welcome email to newly registered
 * sellers with information about getting started on the platform.
 *
 * @param {string} email - Seller's email address
 * @param {string} firstName - Seller's first name
 * @returns {Promise<void>}
 */
async function sendWelcomeEmail(email, firstName) {
  // Step 1: Get the email content with processed HTML template
  const emailContent = getWelcomeEmailContent(email, firstName);

  // Step 2: Send the email using SendGrid service
  await sgMail.send(emailContent);
}

/**
 * Sends admin notification about new seller registration.
 *
 * This function sends a notification email to administrators
 * when a new seller registers on the platform.
 *
 * @param {string} firstName - Seller's first name
 * @param {string} lastName - Seller's last name
 * @param {string} email - Seller's email address
 * @param {string} phoneNumber - Seller's phone number
 * @returns {Promise<void>}
 */
async function sendAdminNotification(firstName, lastName, email, phoneNumber) {
  // Step 1: Get the email content with processed HTML template
  const emailContent = getAdminNotificationEmailContent(firstName, lastName, email, phoneNumber);

  // Step 2: Send the email using SendGrid service
  await sgMail.send(emailContent);
}

/**
 * Constructs the welcome email content for new sellers.
 *
 * This function reads the HTML email template and replaces dynamic placeholders
 * with actual values to create personalized welcome emails for new sellers.
 *
 * Template Processing:
 * - Reads HTML template from file system
 * - Replaces dynamic placeholders with actual values
 * - Handles UTF-8 encoding for proper text display
 * - Creates professional email structure
 *
 * Template Variables:
 * - {{firstName}}: The seller's first name
 * - {{year}}: Current year for copyright and branding
 *
 * @param {string} email - The recipient's email address
 * @param {string} firstName - The seller's first name
 * @returns {Promise<Object>} SendGrid-compatible email content object
 *   - to: recipient email address
 *   - from: sender information with platform branding
 *   - subject: clear email subject line
 *   - html: processed HTML template content
 * @throws {Error} If template file cannot be read or processed
 */
function getWelcomeEmailContent(email, firstName) {
  // Step 1: Construct the path to the seller welcome email template
  const filePath = path.join(__dirname, '../../../', 'templates', 'seller-welcome-email.html');
  
  // Step 2: Read the HTML template file synchronously
  // Using UTF-8 encoding to ensure proper text handling
  let html = fs.readFileSync(filePath, 'utf-8');

  // Step 3: Replace template placeholders with actual data
  html = html.replace('{{firstName}}', firstName);
  html = html.replace('{{year}}', new Date().getFullYear());

  // Step 4: Return SendGrid-compatible email object
  return {
    to: email,
    from: 'Auqli Nigeria <support@auqli.com>',
    subject: "Welcome to Auqli — Let's Get You Selling",
    html
  };
}

/**
 * Constructs the admin notification email content for new seller registrations.
 *
 * This function reads the HTML email template and replaces dynamic placeholders
 * with actual values to create admin notification emails for new seller registrations.
 *
 * Template Processing:
 * - Reads HTML template from file system
 * - Replaces dynamic placeholders with actual values
 * - Handles UTF-8 encoding for proper text display
 * - Creates professional email structure
 *
 * Template Variables:
 * - {{firstName}}: The seller's first name
 * - {{lastName}}: The seller's last name
 * - {{email}}: The seller's email address
 * - {{phoneNumber}}: The seller's phone number
 * - {{year}}: Current year for copyright and branding
 *
 * @param {string} firstName - The seller's first name
 * @param {string} lastName - The seller's last name
 * @param {string} email - The seller's email address
 * @param {string} phoneNumber - The seller's phone number
 * @returns {Promise<Object>} SendGrid-compatible email content object
 *   - to: admin email addresses
 *   - from: sender information with platform branding
 *   - subject: clear email subject line
 *   - html: processed HTML template content
 * @throws {Error} If template file cannot be read or processed
 */
function getAdminNotificationEmailContent(firstName, lastName, email, phoneNumber) {
  // Step 1: Construct the path to the admin notification email template
  const filePath = path.join(__dirname, '../../../', 'templates', 'seller-admin-notification-email.html');
  
  // Step 2: Read the HTML template file synchronously
  // Using UTF-8 encoding to ensure proper text handling
  let html = fs.readFileSync(filePath, 'utf-8');

  // Step 3: Replace template placeholders with actual data
  html = html.replace('{{firstName}}', firstName);
  html = html.replace('{{lastName}}', lastName);
  html = html.replace('{{email}}', email);
  html = html.replace('{{phoneNumber}}', phoneNumber);
  html = html.replace('{{year}}', new Date().getFullYear());

  // Step 4: Return SendGrid-compatible email object
  return {
    to: ['admin@auqli.com'],
    from: 'Auqli Admin <support@auqli.com>',
    subject: 'New Seller Registration - Auqli',
    html
  };
}

/**
 * Registers a new seller user account - Main business logic function.
 *
 * This is the primary service function that orchestrates the complete
 * seller registration process. It handles validation, account creation,
 * email verification, and token generation in a secure and efficient manner.
 *
 * Business Logic Flow:
 * 1. Validates the registration input data
 * 2. Checks if email already exists in the system
 * 3. Generates a unique Agora UID for live streaming
 * 4. Creates a new Seller object with email automatically verified
 * 5. Saves the seller to the database
 * 6. Sends welcome email to the new seller
 * 7. Sends admin notification about the new registration
 * 8. Generates a JWT token for immediate authentication
 * 9. Returns the created user data and authentication token
 *
 * Account Initialization:
 * - Creates seller with all required fields
 * - Sets up default notification preferences
 * - Automatically verifies email address
 * - Initializes Agora UID for live streaming
 *
 * Security Features:
 * - Comprehensive input validation before processing
 * - Automatic email verification on registration
 * - Proper password hashing in the model
 * - JWT token generation for authentication
 * - Unique Agora UID generation
 *
 * @param {Object} data - The registration data object
 * @param {string} data.firstName - Seller's first name
 * @param {string} data.lastName - Seller's last name
 * @param {string} data.email - Seller's email address (must be unique)
 * @param {string} data.password - Seller's password
 * @param {string} data.phoneNumber - Seller's phone number
 * @param {string} data.storeName - Seller's store name
 * @returns {Promise<Object>} An object containing the saved seller and a JWT token
 *   - user: {Object} - The created seller object
 *   - token: {string} - JWT authentication token
 * @throws {Object} If registration data validation fails
 * @throws {Error} If email already exists
 * @throws {Error} If database operations fail
 * @throws {Error} If email sending fails
 */
async function register(data) {
  // Validate registration data
  sellerValidator.validateRegisterData(data);

  // Check if email already exists
  const existingSeller = await sellerRepository.findByEmail(data.email);
  if (existingSeller) {
    throw new ValidationError([{ field: 'email', message: 'Email is already in use.' }]);
  }

  // Generate unique Agora UID for live streaming
  const agoraUid = await generateUniqueAgoraUid();

  // Create new seller object with email automatically verified
  const newSeller = new Seller({
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    password: data.password,
    phoneNumber: data.phoneNumber,
    storeName: data.storeName,
    emailVerified: true, // Automatically verify email on registration
    agoraUid: agoraUid
  });

  // Save seller to database
  const savedSeller = await sellerRepository.saveSeller(newSeller);

  // Generate JWT token
  const token = generateToken(savedSeller._id, 'Seller', '2w');

  // Send welcome email and admin notification
  await Promise.all([
    sendWelcomeEmail(data.email, data.firstName),
    sendAdminNotification(data.firstName, data.lastName, data.email, data.phoneNumber)
  ]);

  // Return success response (exclude password for security)
  const userResponse = savedSeller.toObject ? savedSeller.toObject() : { ...savedSeller };
  delete userResponse.password;
  return {
    user: userResponse,
    token: token
  };
}

module.exports = {
  register
};
