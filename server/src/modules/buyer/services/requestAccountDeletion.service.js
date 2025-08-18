/**
 * Request Account Deletion Service
 *
 * This service handles the business logic for processing account deletion requests.
 * It provides functionality to:
 * - Validate user input data
 * - Generate secure OTP codes
 * - Update buyer records with deletion information
 * - Send account deletion emails using HTML templates
 *
 * @module requestAccountDeletionService
 */

const buyerRepository = require('../repositories/buyer.repository');
const requestAccountDeletionValidator = require('../validators/requestAccountDeletion.validator');
const { generateOTP } = require('../../../utils/helpers');
const sgMail = require('@sendgrid/mail');
const fs = require('fs');
const path = require('path');

// Configure SendGrid with API key from environment variables
// This enables email sending functionality for account deletion notifications
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Generate a secure deletion OTP for account deletion functionality.
 *
 * This function creates a 4-digit numeric OTP that will be used
 * to verify the user's identity during the account deletion process.
 * The OTP is generated using the utility helper function for consistency.
 *
 * @returns {string} A 4-digit numeric OTP (e.g., "1234")
 */
function generateDeletionOTP() {
  return generateOTP();
}

/**
 * Constructs the email content for account deletion notifications.
 *
 * This function reads the HTML email template from the templates directory,
 * replaces placeholder variables with actual data, and returns a
 * SendGrid-compatible email object ready for sending.
 *
 * Template placeholders:
 * - {{otp}}: The generated deletion code
 * - {{year}}: Current year for copyright information
 *
 * @param {string} email - The recipient's email address
 * @param {string} deletionOTP - The deletion code to embed in the email template
 * @returns {Promise<Object>} SendGrid-compatible email content object with:
 *   - to: recipient email
 *   - from: sender information
 *   - subject: email subject line
 *   - html: processed HTML template content
 * @throws {Error} If template file cannot be read or processed
 */
async function getEmailContent(email, deletionOTP) {
  // Construct the path to the account deletion email template
  // Template is located in src/templates/account-deletion-email.html
  const filePath = path.join(__dirname, '../../../', 'templates', 'account-deletion-email.html');

  // Read the HTML template file synchronously
  let html = fs.readFileSync(filePath, 'utf-8');

  // Replace template placeholders with actual data
  html = html.replace('{{otp}}', deletionOTP);
  html = html.replace('{{year}}', new Date().getFullYear());

  // Return SendGrid-compatible email object
  return {
    to: email,
    from: 'Joseph From Auqli <support@auqli.com>',
    subject: 'Account Deletion Request - Auqli',
    html
  };
}

/**
 * Send account deletion email to the buyer using SendGrid.
 *
 * This function handles the email sending process for account deletion notifications.
 * It constructs the email content using the template and sends it via SendGrid.
 * Errors are allowed to propagate to the calling function for proper error handling.
 *
 * @param {string} email - The buyer's email address to send the deletion email to
 * @param {string} deletionOTP - The deletion OTP code to include in the email
 * @returns {Promise<boolean>} True if email sent successfully
 * @throws {Error} If email content construction fails or SendGrid sending fails
 */
async function sendDeletionEmail(email, deletionOTP) {
  // Get the email content with processed HTML template
  const emailContent = await getEmailContent(email, deletionOTP);

  // Send the email using SendGrid
  // If sending fails, the error will propagate to the calling function
  await sgMail.send(emailContent);
  return true;
}

/**
 * Process account deletion request - Main business logic function.
 *
 * This is the primary service function that orchestrates the entire
 * account deletion request workflow. It performs the following steps:
 *
 * 1. Validates the input data (buyer existence, no existing deletion request)
 * 2. Generates a secure 4-digit OTP
 * 3. Updates the buyer record with deletion information and expiry
 * 4. Sends an account deletion email with the OTP
 * 5. Returns a success response or throws appropriate errors
 *
 * Security Features:
 * - OTP expires after 10 minutes for security
 * - Buyer validation ensures user exists before sending deletion request
 * - Prevents multiple deletion requests for the same account
 * - Error handling prevents information leakage
 *
 * @param {string} buyerId - The buyer's ID
 * @returns {Promise<Object>} Success response object with message
 * @throws {ValidationError} If input validation fails (buyer not found, already in deletion process)
 * @throws {Error} If database update fails or email sending fails
 *
 * @example
 * // Successful request
 * const result = await requestAccountDeletion('507f1f77bcf86cd799439011');
 * // Returns: { message: 'Account deletion verification code sent to your email', validFor: '10 minutes' }
 *
 * @example
 * // Failed validation
 * try {
 *   await requestAccountDeletion('invalid-id');
 * } catch (error) {
 *   // error instanceof ValidationError
 * }
 */
async function requestAccountDeletion(buyerId) {
  // Step 1: Validate input data using the validator
  // This ensures buyer exists and is not already in deletion process
  await requestAccountDeletionValidator.validateRequestAccountDeletionData(buyerId);

  // Step 2: Get the buyer object for email and database operations
  // Since validation passed, we know the buyer exists
  const buyer = await buyerRepository.findById(buyerId);

  // Step 3: Generate a secure 4-digit OTP for account deletion
  const deletionOTP = generateDeletionOTP();

  // Step 4: Calculate expiry time (10 minutes from current time)
  // This provides a reasonable balance between security and user convenience
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  // Step 5: Update the buyer record with deletion OTP and expiry information
  // This stores the OTP securely in the database for later verification
  const updatedBuyer = await buyerRepository.updateAccountDeletionOTP(
    buyer._id,
    deletionOTP,
    expiresAt
  );

  // Verify that the database update was successful
  if (!updatedBuyer) {
    throw new Error('Failed to update buyer with deletion OTP');
  }

  // Step 6: Send account deletion email with the generated OTP
  // If email sending fails, the error will propagate to the controller
  await sendDeletionEmail(buyer.email, deletionOTP);

  // Step 7: Return success response
  // Note: We don't return the OTP in the response for security reasons
  return {
    message: 'Account deletion verification code sent to your email',
    validFor: '10 minutes'
  };
}

// Export the main service function for use in controllers
module.exports = {
  requestAccountDeletion,
  getEmailContent
}; 