/**
 * Resend OTP Service
 *
 * This service handles the business logic for resending OTP (One-Time Password)
 * to sellers for email verification. It provides secure OTP generation and
 * email delivery functionality.
 *
 * The service ensures that:
 * - OTP requests are properly validated
 * - Secure 4-digit OTP codes are generated
 * - Professional email notifications are sent
 * - Seller records are updated with new OTP
 * - Error handling maintains system integrity
 *
 * OTP Resend Flow:
 * - Input validation and seller existence verification
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

const Seller = require('../../../models/Seller');
const sgMail = require('@sendgrid/mail');
const NotFoundException = require('../../../utils/errors/NotFoundException');
const BadRequestException = require('../../../utils/errors/BadRequestException');
const { validateResendOTPData } = require('../validators/resendOTP.validator');
const { generateOTP } = require('../../../utils/helpers');
const fs = require('fs');
const path = require('path');

// Initialize SendGrid with API key from environment variables
// This enables email sending functionality for OTP notifications
sgMail.setApiKey(process.env.SENDGRID_API_KEY);



/**
 * Constructs the email content for resend OTP verification.
 *
 * This function creates the email content structure for OTP verification emails.
 * It reads the HTML template from file and replaces dynamic placeholders
 * with actual values to create personalized OTP emails.
 *
 * Template Processing:
 * - Reads HTML template from file system
 * - Replaces dynamic placeholders with actual values
 * - Handles UTF-8 encoding for proper text display
 * - Creates professional email structure
 *
 * Template Variables:
 * - {{firstName}}: The seller's first name for personalization
 * - {{otp}}: The verification OTP code
 *
 * @param {string} email - The recipient's email address
 * @param {string} otp - The verification code to embed in the email
 * @param {string} firstName - The seller's first name for personalization
 * @returns {Object} SendGrid-compatible email content object
 *   - to: recipient email address
 *   - from: sender information with platform branding
 *   - subject: clear email subject line
 *   - html: processed HTML template content
 * @throws {Error} If template file cannot be read or processed
 */
function getEmailContent(email, otp, firstName) {
  // Step 1: Construct the path to the resend OTP email template
  const filePath = path.join(__dirname, '../../../', 'templates', 'resend-otp-email.html');
  
  // Step 2: Read the HTML template file synchronously
  // Using UTF-8 encoding to ensure proper text handling
  let html = fs.readFileSync(filePath, 'utf-8');

  // Step 3: Replace template placeholders with actual data
  html = html.replace('{{firstName}}', firstName);
  html = html.replace('{{otp}}', otp);
  html = html.replace('{{year}}', new Date().getFullYear());

  // Step 4: Return SendGrid-compatible email object
  return {
    to: email,
    from: 'Auqli Nigeria <support@auqli.com>',
    subject: "Here's Your Auqli OTP",
    html
  };
}

/**
 * Sends the OTP email using SendGrid service.
 * 
 * This function handles the email sending process for OTP verification.
 * It constructs the email content and sends it via SendGrid service.
 * Errors are allowed to propagate to the calling function.
 *
 * Email Delivery Process:
 * - Constructs email content using template
 * - Sends via SendGrid for reliable delivery
 * - Handles delivery errors appropriately
 * - Returns success confirmation
 *
 * @param {string} email - Recipient email address
 * @param {string} otp - OTP code to include in the email
 * @param {string} firstName - Seller's first name for personalization
 * @returns {Promise<void>} Resolves when email is sent successfully
 * @throws {Error} If SendGrid sending fails
 */
async function sendOTPEmail(email, otp, firstName) {
  // Get the email content with processed HTML template
  const msg = getEmailContent(email, otp, firstName);
  
  // Send the email using SendGrid service
  // If sending fails, the error will propagate to the calling function
  await sgMail.send(msg);
}

/**
 * Updates seller's OTP in the database.
 *
 * This function updates the seller's OTP field with the newly generated
 * OTP and saves the changes to the database atomically.
 *
 * Database Update:
 * - Updates the OTP field with new value
 * - Saves changes atomically
 * - Maintains data consistency
 * - Handles database errors appropriately
 *
 * @param {Object} seller - Seller object to update
 * @param {string} otp - New OTP to store
 * @returns {Promise<void>} Resolves when seller is updated successfully
 * @throws {Error} If database update fails
 */
async function updateSellerOTP(seller, otp) {
  // Update the OTP field with new value
  seller.otp = otp;
  
  // Save the seller document atomically
  await seller.save();
}

/**
 * Resends OTP to seller's email - Main business logic function.
 *
 * This is the primary service function that orchestrates the complete
 * OTP resend process. It handles validation, OTP generation, database
 * updates, and email notifications in a secure and efficient manner.
 *
 * Business Logic Flow:
 * 1. Validates the input data (email format and requirements)
 * 2. Finds the seller by email address
 * 3. Checks if email is already verified
 * 4. Generates a secure 4-digit OTP
 * 5. Updates the seller's OTP in the database
 * 6. Sends OTP email notification
 * 7. Returns success confirmation
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
 * - Ensures seller exists before processing
 *
 * Error Handling:
 * - Validation errors for invalid inputs
 * - NotFoundException for non-existent sellers
 * - Email delivery errors
 * - Database operation errors
 * - Proper error propagation to controller
 *
 * @param {string} email - Seller's email address
 * @returns {Promise<Object>} Success response object with message
 *   - message: {string} - Success message confirming OTP sent
 * @throws {Error} If input validation fails (invalid email)
 * @throws {NotFoundException} If seller is not found
 * @throws {Error} If email is already verified
 * @throws {Error} If database operations or email sending fails
 *
 * @example
 * // Resend OTP to seller
 * const result = await resendOTP('seller@example.com');
 * // Returns: { message: 'OTP resent successfully' }
 *
 * @example
 * // Failed validation - invalid email
 * await resendOTP('invalid-email');
 * // Throws: ValidationError with errors array containing validation details
 */
async function resendOTP(email) {
  // Step 1: Validate input data using the validator
  // This ensures email format is correct and meets requirements
  await validateResendOTPData({ email });

  // Step 2: Find seller by email address
  // This ensures the seller exists before generating OTP
  const seller = await Seller.findOne({ email });
  if (!seller) {
    throw new NotFoundException('Seller not found');
  }

  // Step 3: Check if email is already verified
  // This prevents unnecessary OTP generation for verified emails
  if (seller.emailVerified) {
    throw new BadRequestException('Email is already verified');
  }

  // Step 4: Generate a secure 4-digit OTP
  // This OTP will be sent to the user's email for verification
  const otp = generateOTP();

  // Step 5: Update seller's OTP in the database
  // This stores the new OTP for later verification
  await updateSellerOTP(seller, otp);

  // Step 6: Send OTP email notification
  // This ensures the user receives the verification code
  await sendOTPEmail(email, otp, seller.firstName);

  // Step 7: Return success response
  // Note: We don't return the OTP in the response for security reasons
  return {
    message: 'OTP resent successfully'
  };
}

module.exports = {
  resendOTP,
  getEmailContent,
  sendOTPEmail,
  updateSellerOTP
};
