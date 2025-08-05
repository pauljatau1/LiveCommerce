/**
 * Forgot Password Service
 * 
 * This service handles the business logic for processing forgot password requests.
 * It provides functionality to:
 * - Validate user input data
 * - Generate secure OTP codes
 * - Update buyer records with reset information
 * - Send password reset emails using HTML templates
 * 
 * @module forgotPasswordService
 */

const buyerRepository = require('../repositories/buyer.repository');
const forgotPasswordValidator = require('../validators/forgotPassword.validator');
const { generateOTP } = require('../../../utils/helpers');
const sgMail = require('@sendgrid/mail');
const fs = require('fs');
const path = require('path');

// Configure SendGrid with API key from environment variables
// This enables email sending functionality for password reset notifications
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Generate a secure reset OTP for password reset functionality.
 * 
 * This function creates a 4-digit numeric OTP that will be used
 * to verify the user's identity during the password reset process.
 * The OTP is generated using the utility helper function for consistency.
 * 
 * @returns {string} A 4-digit numeric OTP (e.g., "1234")
 */
function generateResetOTP() {
  return generateOTP();
}

/**
 * Constructs the email content for password reset notifications.
 *
 * This function reads the HTML email template from the templates directory,
 * replaces placeholder variables with actual data, and returns a
 * SendGrid-compatible email object ready for sending.
 *
 * Template placeholders:
 * - {{otp}}: The generated reset code
 * - {{year}}: Current year for copyright information
 *
 * @param {string} email - The recipient's email address
 * @param {string} resetOTP - The reset code to embed in the email template
 * @returns {Promise<Object>} SendGrid-compatible email content object with:
 *   - to: recipient email
 *   - from: sender information
 *   - subject: email subject line
 *   - html: processed HTML template content
 * @throws {Error} If template file cannot be read or processed
 */
async function getEmailContent(email, resetOTP) {
  // Construct the path to the password reset email template
  // Template is located in src/templates/password-reset-email.html
  const filePath = path.join(__dirname, '../../../', 'templates', 'password-reset-email.html');
  
  // Read the HTML template file synchronously
  let html = fs.readFileSync(filePath, 'utf-8');

  // Replace template placeholders with actual data
  html = html.replace('{{otp}}', resetOTP);
  html = html.replace('{{year}}', new Date().getFullYear());

  // Return SendGrid-compatible email object
  return {
    to: email,
    from: 'Joseph From Auqli <support@auqli.com>',
    subject: 'Password Reset Code - Auqli',
    html
  };
}

/**
 * Send password reset email to the buyer using SendGrid.
 * 
 * This function handles the email sending process for password reset notifications.
 * It constructs the email content using the template and sends it via SendGrid.
 * Errors are allowed to propagate to the calling function for proper error handling.
 * 
 * @param {string} email - The buyer's email address to send the reset email to
 * @param {string} resetOTP - The reset OTP code to include in the email
 * @returns {Promise<boolean>} True if email sent successfully
 * @throws {Error} If email content construction fails or SendGrid sending fails
 */
async function sendResetEmail(email, resetOTP) {
  // Get the email content with processed HTML template
  const emailContent = await getEmailContent(email, resetOTP);

  // Send the email using SendGrid
  // If sending fails, the error will propagate to the calling function
  await sgMail.send(emailContent);
  return true;
}

/**
 * Process forgot password request - Main business logic function.
 * 
 * This is the primary service function that orchestrates the entire
 * forgot password workflow. It performs the following steps:
 * 
 * 1. Validates the input data (email format, user existence)
 * 2. Generates a secure 4-digit OTP
 * 3. Updates the buyer record with reset information and expiry
 * 4. Sends a password reset email with the OTP
 * 5. Returns a success response or throws appropriate errors
 * 
 * Security Features:
 * - OTP expires after 10 minutes for security
 * - Email validation ensures user exists before sending reset
 * - Error handling prevents information leakage
 * 
 * @param {Object} data - Forgot password request data
 * @param {string} data.email - The buyer's email address
 * @returns {Promise<Object>} Success response object with message
 * @throws {ValidationError} If input validation fails (invalid email, user not found)
 * @throws {Error} If database update fails or email sending fails
 * 
 * @example
 * // Successful request
 * const result = await forgotPassword({ email: 'user@example.com' });
 * // Returns: { message: 'Password reset code sent successfully' }
 * 
 * @example
 * // Failed validation
 * try {
 *   await forgotPassword({ email: 'invalid-email' });
 * } catch (error) {
 *   // error instanceof ValidationError
 * }
 */
async function forgotPassword(data) {
  // Step 1: Validate input data using the validator
  // This ensures email format is correct and user exists in the system
  await forgotPasswordValidator.validateForgotPasswordData(data);

  // Step 2: Find the buyer by email (case-insensitive search)
  // The validator ensures the buyer exists, so this should always succeed
  const buyer = await buyerRepository.findByEmail(data.email);
  
  // Step 3: Generate a secure 4-digit OTP for password reset
  const resetOTP = generateResetOTP();
  
  // Step 4: Calculate expiry time (10 minutes from current time)
  // This provides a reasonable balance between security and user convenience
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  
  // Step 5: Update the buyer record with reset OTP and expiry information
  // This stores the OTP securely in the database for later verification
  const updatedBuyer = await buyerRepository.updateResetPasswordOTP(
    buyer._id, 
    resetOTP, 
    expiresAt
  );
  
  // Verify that the database update was successful
  if (!updatedBuyer) {
    throw new Error('Failed to update buyer with reset OTP');
  }
  
  // Step 6: Send password reset email with the generated OTP
  // If email sending fails, the error will propagate to the controller
  await sendResetEmail(data.email, resetOTP);
  
  // Step 7: Return success response
  // Note: We don't return the OTP in the response for security reasons
  return {
    message: 'Password reset code sent successfully'
  };
}

// Export the main service function for use in controllers
module.exports = {
  forgotPassword
}; 