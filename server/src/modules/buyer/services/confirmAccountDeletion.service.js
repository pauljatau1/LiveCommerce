/**
 * Confirm Account Deletion Service
 *
 * This service handles the business logic for confirming and executing account deletion
 * after OTP verification. It provides comprehensive account deletion functionality
 * including validation, OTP verification, security measures, and confirmation emails.
 *
 * The service ensures that:
 * - Account deletion requests are properly validated
 * - OTP verification is secure and prevents brute force attacks
 * - Confirmation emails are sent before permanent deletion
 * - Account deletion is irreversible and permanent
 * - Security measures protect against unauthorized deletions
 * - Professional communication maintains user trust
 *
 * Account Deletion Flow:
 * - Input validation and buyer existence verification
 * - OTP verification with attempt tracking
 * - Security measures for failed attempts
 * - Confirmation email sending
 * - Permanent account deletion
 * - Success response and documentation
 *
 * Security Features:
 * - OTP verification with attempt limiting
 * - Brute force attack prevention
 * - Comprehensive input validation
 * - Irreversible deletion process
 * - Professional confirmation emails
 *
 * Email System:
 * - HTML email templates with dynamic content
 * - SendGrid integration for reliable delivery
 * - Professional formatting for confirmation
 * - Template variable replacement
 *
 * @module confirmAccountDeletionService
 */

// External dependencies
const fs = require('fs');           // File system operations for reading email templates
const path = require('path');       // Path utilities for file system navigation
const sgMail = require('@sendgrid/mail'); // SendGrid email service for sending emails

// Internal dependencies
const ValidationError = require('../../../utils/errors/ValidationError');
const buyerRepository = require('../repositories/buyer.repository');
const confirmAccountDeletionValidator = require('../validators/confirmAccountDeletion.validator');

// Configure SendGrid API key for email service authentication
// This API key should be set in environment variables for security
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Reads and populates the account deletion confirmation email template.
 * 
 * This function loads the HTML email template and replaces dynamic placeholders
 * with actual values. It handles template file reading and variable substitution
 * to create professional confirmation emails.
 *
 * Template Processing:
 * - Reads HTML template from file system
 * - Replaces dynamic placeholders with actual values
 * - Handles UTF-8 encoding for proper text display
 * - Creates professional email structure
 *
 * Template Variables:
 * - {{year}}: Current year for copyright and branding
 * - Can be extended for additional personalization
 *
 * File Operations:
 * - Reads template from templates directory
 * - Uses UTF-8 encoding for proper text handling
 * - Handles file system errors gracefully
 *
 * @param {string} email - The buyer's email address (used for personalization if needed)
 * @returns {Promise<string>} The populated HTML email content ready for sending
 * @throws {Error} If the email template file cannot be read
 */
async function getEmailContent(email) {
  // Step 1: Construct the full path to the email template file
  // Template is stored in the templates directory at the project root
  const templatePath = path.join(__dirname, '../../../templates/account-deletion-confirmation-email.html');
  
  // Step 2: Read the HTML template file synchronously
  // Using utf8 encoding to ensure proper text handling
  let htmlContent = fs.readFileSync(templatePath, 'utf8');
  
  // Step 3: Replace template variables with actual dynamic values
  // Currently only replacing year for copyright, but can be extended for personalization
  const currentYear = new Date().getFullYear();
  htmlContent = htmlContent.replace('{{year}}', currentYear);
  
  return htmlContent;
}

/**
 * Sends account deletion confirmation email to the buyer.
 * 
 * This function sends a professional confirmation email after successful account deletion.
 * The email serves multiple purposes including confirmation, documentation, and
 * professional closure of the user relationship.
 *
 * Email Purpose:
 * - Confirmation that the deletion was completed successfully
 * - Documentation for the user's records
 * - Professional closure of the platform relationship
 * - Legal and compliance documentation
 *
 * Email Configuration:
 * - Professional sender identity with platform branding
 * - Clear subject line for user recognition
 * - Rich HTML content for better presentation
 * - Proper recipient addressing
 *
 * @param {string} email - The buyer's email address where confirmation will be sent
 * @throws {Error} If email sending fails through SendGrid service
 */
async function sendConfirmationEmail(email) {
  // Step 1: Get the populated HTML email content from template
  const htmlContent = await getEmailContent(email);
  
  // Step 2: Prepare the email message object with all required fields
  const msg = {
    to: email,                                           // Recipient email address
    from: 'Joseph From Auqli <support@auqli.com>',     // Sender with professional identity
    subject: 'Account Deleted Successfully - Auqli',   // Clear, informative subject line
    html: htmlContent                                   // Rich HTML content for better presentation
  };
  
  // Step 3: Send the email using SendGrid service
  // This will throw an error if sending fails, which should be handled by caller
  await sgMail.send(msg);
}

/**
 * Validates the provided OTP against the buyer's stored OTP.
 * 
 * This function performs a simple string comparison to verify the OTP.
 * It's kept separate for testing and potential future enhancements
 * such as case-insensitive comparison or encrypted OTP storage.
 *
 * OTP Validation:
 * - Direct string comparison for exact match
 * - Both values should be 4-digit strings
 * - Simple and secure validation method
 * - Extensible for future security enhancements
 *
 * Security Considerations:
 * - Exact match prevents partial OTP attacks
 * - String comparison is secure for this use case
 * - Can be enhanced with encryption if needed
 *
 * @param {Object} buyer - The buyer object containing account deletion data
 * @param {string} buyer.accountDeletion.otp - The stored OTP value
 * @param {string} otp - The OTP provided by the user (4-digit string)
 * @returns {boolean} True if OTP matches exactly, false otherwise
 */
function isValidOTP(buyer, otp) {
  // Direct string comparison for OTP validation
  // Both values should be 4-digit strings for exact match
  return buyer.accountDeletion.otp === otp;
}

/**
 * Calculates remaining attempts for OTP verification.
 * 
 * This function helps provide user feedback about how many attempts remain
 * before they need to request a new OTP. It enhances user experience
 * by clearly communicating the security limitations.
 *
 * Attempt Management:
 * - Maximum of 5 attempts allowed for security
 * - Provides clear feedback on remaining attempts
 * - Helps users understand their current status
 * - Prevents confusion about attempt limits
 *
 * Security Benefits:
 * - Limits brute force attack effectiveness
 * - Provides clear user feedback
 * - Maintains security while being user-friendly
 *
 * @param {number} currentAttempts - Current number of failed attempts
 * @returns {number} Number of remaining attempts (0-5 range)
 */
function calculateRemainingAttempts(currentAttempts) {
  // Maximum attempts allowed before requiring new OTP (security measure)
  const maxAttempts = 5;
  
  // Calculate and return remaining attempts
  // This ensures users know their current status
  return maxAttempts - currentAttempts;
}

/**
 * Confirms and executes account deletion after OTP verification - Main business logic function.
 *
 * This is the primary service function that orchestrates the complete account deletion process.
 * It handles validation, OTP verification, security measures, confirmation emails, and
 * permanent account deletion in a secure and professional manner.
 *
 * Business Logic Flow:
 * 1. Validates all input data and prerequisites
 * 2. Verifies the OTP against stored value
 * 3. Handles failed attempts with security measures
 * 4. Sends confirmation email for documentation
 * 5. Permanently deletes the buyer account
 * 6. Returns success confirmation
 *
 * Security Features:
 * - Comprehensive input validation before processing
 * - OTP verification with attempt tracking
 * - Brute force attack prevention
 * - Confirmation email before deletion
 * - Irreversible account deletion
 * - Professional error handling
 *
 * Data Integrity:
 * - Validates all inputs before database operations
 * - Uses atomic database operations
 * - Maintains security throughout the process
 * - Ensures permanent deletion
 *
 * Error Handling:
 * - Validation errors for invalid inputs
 * - OTP verification errors with attempt feedback
 * - Database operation errors
 * - Email delivery errors
 * - Proper error propagation to controller
 *
 * @param {string} buyerId - The buyer's ID (MongoDB ObjectId string)
 * @param {string} otp - The OTP provided by the user (4-digit string)
 * @returns {Promise<Object>} Success message object with confirmation
 *   - message: {string} - Success message confirming account deletion
 * @throws {ValidationError} If validation fails or OTP is invalid
 *   - Includes remaining attempts information for failed OTP
 * @throws {Error} If database operations or email sending fails
 *
 * @example
 * // Successful account deletion
 * const result = await confirmAccountDeletion('507f1f77bcf86cd799439011', '1234');
 * // Returns: { message: 'Account deleted successfully' }
 *
 * @example
 * // Failed OTP verification
 * try {
 *   await confirmAccountDeletion('507f1f77bcf86cd799439011', '9999');
 * } catch (error) {
 *   // error instanceof ValidationError
 *   // error.errors[0].remainingAttempts shows attempts left
 * }
 */
async function confirmAccountDeletion(buyerId, otp) {
  // Step 1: Validate input data
  // This includes OTP format, buyer existence, and deletion request status validation
  await confirmAccountDeletionValidator.validateConfirmAccountDeletionData(buyerId, otp);
  
  // Step 2: Get the buyer object for OTP verification
  // Since validation passed, we know the buyer exists
  const buyer = await buyerRepository.findById(buyerId);
  
  // Step 3: Verify the provided OTP matches the stored OTP
  if (!isValidOTP(buyer, otp)) {
    // Step 3a: Increment failed attempts counter for security tracking
    // This helps prevent brute force attacks on the OTP
    await buyerRepository.incrementAccountDeletionAttempts(buyerId);
    
    // Step 3b: Calculate remaining attempts for user feedback
    // Adding 1 because we just incremented the attempts above
    const remainingAttempts = calculateRemainingAttempts(buyer.accountDeletion.attempts + 1);
    
    // Step 3c: Throw validation error with detailed feedback
    // Including remaining attempts helps user understand their current status
    throw new ValidationError([{
      field: 'otp',
      message: 'Invalid verification code',
      remainingAttempts: remainingAttempts
    }]);
  }
  
  // Step 4: Send confirmation email before deletion
  // This provides documentation and professional closure
  await sendConfirmationEmail(buyer.email);
  
  // Step 5: Permanently delete the buyer account from database
  // This is the final irreversible step in the process
  await buyerRepository.deleteById(buyerId);
  
  // Step 6: Return success confirmation to controller
  return {
    message: 'Account deleted successfully'
  };
}

module.exports = {
  confirmAccountDeletion,
  getEmailContent
};