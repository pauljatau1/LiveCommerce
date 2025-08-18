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
 * This function loads the HTML email template and replaces dynamic placeholders
 * with actual values (e.g., current year for copyright).
 * 
 * @param {string} email - The buyer's email address (used for personalization if needed)
 * @returns {Promise<string>} The populated HTML email content ready for sending
 * @throws {Error} If the email template file cannot be read
 */
async function getEmailContent(email) {
  // Construct the full path to the email template file
  // Template is stored in the templates directory at the project root
  const templatePath = path.join(__dirname, '../../../templates/account-deletion-confirmation-email.html');
  
  // Read the HTML template file synchronously
  // Using utf8 encoding to ensure proper text handling
  let htmlContent = fs.readFileSync(templatePath, 'utf8');
  
  // Replace template variables with actual dynamic values
  // Currently only replacing year for copyright, but can be extended for personalization
  const currentYear = new Date().getFullYear();
  htmlContent = htmlContent.replace('{{year}}', currentYear);
  
  return htmlContent;
}

/**
 * Sends account deletion confirmation email to the buyer.
 * This function sends a professional confirmation email after successful account deletion.
 * The email serves as:
 * - Confirmation that the deletion was completed
 * - Documentation for the user's records
 * - Professional closure of the relationship
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
 * This function performs a simple string comparison to verify the OTP.
 * It's kept separate for testing and potential future enhancements
 * (e.g., case-insensitive comparison, encrypted OTP storage).
 * 
 * @param {Object} buyer - The buyer object containing account deletion data
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
 * This function helps provide user feedback about how many attempts remain
 * before they need to request a new OTP. It enhances user experience
 * by clearly communicating the security limitations.
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
 * Confirms and executes account deletion after OTP verification.
 * This is the main service function that orchestrates the complete account deletion process:
 * 1. Validates all input data and prerequisites
 * 2. Verifies the OTP against stored value
 * 3. Handles failed attempts with security measures
 * 4. Sends confirmation email for documentation
 * 5. Permanently deletes the buyer account
 * 
 * @param {string} buyerId - The buyer's ID (MongoDB ObjectId string)
 * @param {string} otp - The OTP provided by the user (4-digit string)
 * @returns {Promise<Object>} Success message object with confirmation
 * @throws {ValidationError} If validation fails or OTP is invalid
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