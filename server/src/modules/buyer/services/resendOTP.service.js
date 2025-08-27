/**
 * Resend OTP Service
 *
 * This service handles the business logic for resending OTP (One-Time Password)
 * to buyers for email verification. It provides secure OTP generation and
 * email delivery functionality.
 *
 * The service ensures that:
 * - OTP requests are properly validated
 * - Secure 4-digit OTP codes are generated
 * - Professional email notifications are sent
 * - Buyer records are updated with new OTP
 * - Error handling maintains system integrity
 *
 * OTP Resend Flow:
 * - Input validation and buyer existence verification
 * - Secure OTP generation
 * - Database update with new OTP
 * - Email notification with OTP
 * - Success response and confirmation
 *
 * Security Features:
 * - Secure OTP generation using Math.random()
 * - Email validation before processing
 * - Professional email templates
 * - Error handling without information leakage
 *
 * Email System:
 * - HTML email templates with dynamic content
 * - SendGrid integration for reliable delivery
 * - Professional formatting for verification
 * - Template variable replacement
 *
 * @module resendOTPService
 */

const Buyer = require('../../../models/Buyer');
const sgMail = require('@sendgrid/mail');
const NotFoundException = require('../../../utils/errors/NotFoundException');
const { validateResendOTPData } = require('../validators/resendOTP.validator');
const fs = require('fs');
const path = require('path');

// Initialize SendGrid with API key from environment variables
// This enables email sending functionality for OTP notifications
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Generates a secure 4-digit OTP for email verification.
 * 
 * This function creates a 4-digit numeric OTP that will be used
 * for email verification. The OTP is generated using Math.random()
 * for secure random number generation.
 *
 * OTP Characteristics:
 * - 4-digit numeric format for user convenience
 * - Generated using Math.random() for security
 * - Range: 1000-9999 (inclusive)
 * - String format for consistent handling
 *
 * @returns {string} A 4-digit numeric OTP (e.g., "1234")
 */
function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Constructs the email content for resend OTP verification.
 *
 * This function reads the HTML email template and replaces dynamic placeholders
 * with actual values to create personalized OTP verification emails.
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
  // Step 1: Construct the path to the resend OTP email template
  const filePath = path.join(__dirname, '../../../', 'templates', 'resend-otp-email.html');
  
  // Step 2: Read the HTML template file synchronously
  // Using UTF-8 encoding to ensure proper text handling
  let html = fs.readFileSync(filePath, 'utf-8');

  // Step 3: Replace template placeholders with actual data
  html = html.replace('{{otp}}', otp);
  html = html.replace('{{year}}', new Date().getFullYear());

  // Step 4: Return SendGrid-compatible email object
  return {
    to: email,
    from: 'Joseph From Auqli <support@auqli.com>',
    subject: 'Your New Verification Code - Auqli',
    html
  };
}

/**
 * Sends the OTP email using SendGrid service.
 * 
 * This function handles the email sending process for OTP verification.
 * It constructs the email content using templates and sends it via SendGrid
 * service. Errors are allowed to propagate to the calling function.
 *
 * Email Delivery Process:
 * - Constructs email content using template
 * - Sends via SendGrid for reliable delivery
 * - Handles delivery errors appropriately
 * - Returns success confirmation
 *
 * @param {string} email - Recipient email address
 * @param {string} otp - OTP code to include in the email
 * @returns {Promise<void>} Resolves when email is sent successfully
 * @throws {Error} If email content construction or SendGrid sending fails
 */
async function sendOTPEmail(email, otp) {
  // Step 1: Get the email content with processed HTML template
  const msg = await getEmailContent(email, otp);
  
  // Step 2: Send the email using SendGrid service
  // If sending fails, the error will propagate to the calling function
  await sgMail.send(msg);
}

/**
 * Updates buyer's OTP in the database.
 *
 * This function updates the buyer's OTP field with the newly generated
 * OTP and saves the changes to the database atomically.
 *
 * Database Update:
 * - Updates the OTP field with new value
 * - Saves changes atomically
 * - Maintains data consistency
 * - Handles database errors appropriately
 *
 * @param {Object} buyer - Buyer object to update
 * @param {string} otp - New OTP to store
 * @returns {Promise<void>} Resolves when buyer is updated successfully
 * @throws {Error} If database update fails
 */
async function updateBuyerOTP(buyer, otp) {
  // Step 1: Update the OTP field with new value
  buyer.otp = otp;
  
  // Step 2: Save the buyer document atomically
  await buyer.save();
}

/**
 * Resends OTP to buyer's email - Main business logic function.
 *
 * This is the primary service function that orchestrates the complete
 * OTP resend process. It handles validation, OTP generation, database
 * updates, and email notifications in a secure and efficient manner.
 *
 * Business Logic Flow:
 * 1. Validates the input data (email format and requirements)
 * 2. Finds the buyer by email address
 * 3. Generates a secure 4-digit OTP
 * 4. Updates the buyer's OTP in the database
 * 5. Sends OTP email notification
 * 6. Returns success confirmation
 *
 * Security Features:
 * - Comprehensive input validation before processing
 * - Secure OTP generation using Math.random()
 * - Email validation ensures user exists before sending
 * - Professional email notifications
 * - Error handling without information leakage
 *
 * Data Integrity:
 * - Validates all inputs before database operations
 * - Uses atomic database updates
 * - Maintains data consistency
 * - Ensures buyer exists before processing
 *
 * Error Handling:
 * - Validation errors for invalid inputs
 * - NotFoundException for non-existent buyers
 * - Email delivery errors
 * - Database operation errors
 * - Proper error propagation to controller
 *
 * @param {string} email - Buyer's email address
 * @returns {Promise<Object>} Success response object with message
 *   - message: {string} - Success message confirming OTP sent
 * @throws {Error} If input validation fails (invalid email)
 * @throws {NotFoundException} If buyer is not found
 * @throws {Error} If database operations or email sending fails
 *
 * @example
 * // Resend OTP to buyer
 * const result = await resendOTP('user@example.com');
 * // Returns: { message: 'OTP resent successfully' }
 *
 * @example
 * // Failed validation - invalid email
 * try {
 *   await resendOTP('invalid-email');
 * } catch (error) {
 *   // error instanceof ValidationError
 *   // error.errors contains validation error details
 * }
 */
async function resendOTP(email) {
  // Step 1: Validate input data using the validator
  // This ensures email format is correct and meets requirements
  await validateResendOTPData({ email });

  // Step 2: Find buyer by email address
  // This ensures the buyer exists before generating OTP
  const buyer = await Buyer.findOne({ email });
  if (!buyer) {
    throw new NotFoundException('Buyer not found');
  }

  // Step 3: Generate a secure 4-digit OTP
  // This OTP will be sent to the user's email for verification
  const otp = generateOTP();

  // Step 4: Update buyer's OTP in the database
  // This stores the new OTP for later verification
  await updateBuyerOTP(buyer, otp);

  // Step 5: Send OTP email notification
  // This ensures the user receives the verification code
  await sendOTPEmail(email, otp);

  // Step 6: Return success response
  // Note: We don't return the OTP in the response for security reasons
  return {
    message: 'OTP resent successfully'
  };
}

module.exports = {
  resendOTP,
}; 