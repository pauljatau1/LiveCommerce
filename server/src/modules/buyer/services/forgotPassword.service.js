/**
 * Forgot Password Service
 *
 * This service handles the business logic for processing forgot password requests.
 * It provides comprehensive password reset functionality including validation,
 * OTP generation, database updates, and email notifications.
 *
 * The service ensures that:
 * - User input is properly validated before processing
 * - Secure OTP codes are generated for password reset
 * - Database records are updated with reset information
 * - Professional email notifications are sent to users
 * - Security measures prevent unauthorized access
 * - Error handling maintains system integrity
 *
 * Password Reset Flow:
 * - Email validation and user existence verification
 * - Secure OTP generation and storage
 * - Database update with expiry information
 * - Email notification with reset instructions
 * - Proper error handling and security measures
 *
 * Security Features:
 * - OTP expiration after 10 minutes
 * - Email validation before processing
 * - Secure OTP generation
 * - Database atomic updates
 * - Error handling without information leakage
 *
 * Email System:
 * - HTML email templates with dynamic content
 * - SendGrid integration for reliable delivery
 * - Professional formatting and branding
 * - Template variable replacement
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
 * The OTP is generated using the utility helper function for consistency
 * and security across the application.
 *
 * OTP Characteristics:
 * - 4-digit numeric format for user convenience
 * - Generated using secure utility function
 * - Consistent with other OTP generation in the system
 * - Suitable for email delivery and user input
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
 * Template Processing:
 * - Reads HTML template from file system
 * - Replaces dynamic placeholders with actual values
 * - Handles UTF-8 encoding for proper text display
 * - Creates professional email structure
 *
 * Template Placeholders:
 * - {{otp}}: The generated reset code for user verification
 * - {{year}}: Current year for copyright and branding
 *
 * Email Configuration:
 * - Professional sender identity with platform branding
 * - Clear subject line for user recognition
 * - Rich HTML content for better presentation
 * - Proper recipient addressing
 *
 * @param {string} email - The recipient's email address
 * @param {string} resetOTP - The reset code to embed in the email template
 * @returns {Promise<Object>} SendGrid-compatible email content object with:
 *   - to: recipient email address
 *   - from: sender information with platform branding
 *   - subject: clear email subject line
 *   - html: processed HTML template content
 * @throws {Error} If template file cannot be read or processed
 */
async function getEmailContent(email, resetOTP) {
  // Step 1: Construct the path to the password reset email template
  // Template is located in src/templates/password-reset-email.html
  const filePath = path.join(__dirname, '../../../', 'templates', 'password-reset-email.html');
  
  // Step 2: Read the HTML template file synchronously
  // Using UTF-8 encoding to ensure proper text handling
  let html = fs.readFileSync(filePath, 'utf-8');

  // Step 3: Replace template placeholders with actual data
  html = html.replace('{{otp}}', resetOTP);
  html = html.replace('{{year}}', new Date().getFullYear());

  // Step 4: Return SendGrid-compatible email object
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
 * It constructs the email content using the template and sends it via SendGrid
 * service. Errors are allowed to propagate to the calling function for proper
 * error handling and user feedback.
 *
 * Email Delivery Process:
 * - Constructs email content using template
 * - Sends via SendGrid for reliable delivery
 * - Handles delivery errors appropriately
 * - Returns success confirmation
 *
 * Error Handling:
 * - Propagates errors to calling function
 * - Allows controller to handle email failures
 * - Maintains system integrity on delivery issues
 *
 * @param {string} email - The buyer's email address to send the reset email to
 * @param {string} resetOTP - The reset OTP code to include in the email
 * @returns {Promise<boolean>} True if email sent successfully
 * @throws {Error} If email content construction fails or SendGrid sending fails
 */
async function sendResetEmail(email, resetOTP) {
  // Step 1: Get the email content with processed HTML template
  const emailContent = await getEmailContent(email, resetOTP);

  // Step 2: Send the email using SendGrid
  // If sending fails, the error will propagate to the calling function
  await sgMail.send(emailContent);
  return true;
}

/**
 * Process forgot password request - Main business logic function.
 * 
 * This is the primary service function that orchestrates the entire
 * forgot password workflow. It performs comprehensive validation,
 * secure OTP generation, database updates, and email notifications.
 *
 * Business Logic Flow:
 * 1. Validates the input data (email format, user existence)
 * 2. Generates a secure 4-digit OTP for password reset
 * 3. Calculates expiry time (10 minutes from current time)
 * 4. Updates the buyer record with reset information and expiry
 * 5. Sends a password reset email with the OTP
 * 6. Returns a success response or throws appropriate errors
 *
 * Security Features:
 * - Comprehensive input validation before processing
 * - Secure OTP generation using utility functions
 * - 10-minute OTP expiration for security
 * - Email validation ensures user exists before sending reset
 * - Database atomic updates for data consistency
 * - Error handling prevents information leakage
 * - No OTP returned in response for security
 *
 * Data Integrity:
 * - Validates all inputs before database operations
 * - Uses atomic database updates
 * - Verifies database update success
 * - Maintains referential integrity
 *
 * Error Handling:
 * - Validation errors for invalid inputs
 * - Database errors for update failures
 * - Email delivery errors for notification issues
 * - Proper error propagation to controller
 *
 * @param {Object} data - Forgot password request data object
 * @param {string} data.email - The buyer's email address
 * @returns {Promise<Object>} Success response object with message
 *   - message: {string} - Success message confirming email sent
 * @throws {ValidationError} If input validation fails (invalid email, user not found)
 * @throws {Error} If database update fails or email sending fails
 *
 * @example
 * // Successful password reset request
 * const result = await forgotPassword({ email: 'user@example.com' });
 * // Returns: { message: 'Password reset code sent successfully' }
 *
 * @example
 * // Failed validation - invalid email
 * try {
 *   await forgotPassword({ email: 'invalid-email' });
 * } catch (error) {
 *   // error instanceof ValidationError
 *   // error.errors contains validation error details
 * }
 *
 * @example
 * // Failed validation - user not found
 * try {
 *   await forgotPassword({ email: 'nonexistent@example.com' });
 * } catch (error) {
 *   // error instanceof ValidationError
 *   // error.errors contains user not found error
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
  // This OTP will be used to verify user identity during reset process
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
  
  // Step 6: Verify that the database update was successful
  // This ensures data integrity and prevents silent failures
  if (!updatedBuyer) {
    throw new Error('Failed to update buyer with reset OTP');
  }
  
  // Step 7: Send password reset email with the generated OTP
  // If email sending fails, the error will propagate to the controller
  await sendResetEmail(data.email, resetOTP);
  
  // Step 8: Return success response
  // Note: We don't return the OTP in the response for security reasons
  return {
    message: 'Password reset code sent successfully'
  };
}

// Export the main service function for use in controllers
module.exports = {
  forgotPassword
}; 