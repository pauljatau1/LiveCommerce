const { authEmail } = require('../../../utils/authEmail');
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
 * - Templated email notifications via Termii Email API
 * - Dynamic content insertion using template variables
 * - Professional formatting and branding
 * - Reliable email delivery through Termii
 *
 * @module forgotPasswordService
 */

const buyerRepository = require('../repositories/buyer.repository');
const forgotPasswordValidator = require('../validators/forgotPassword.validator');
const { generateOTP } = require('../../../utils/helpers');
const termiiEmailService = require('../../../services/termiiEmailService');

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
 * Send password reset email to the buyer using Termii Email API.
 * 
 * This function handles the email sending process for password reset notifications.
 * It constructs the HTML email body in code (like SendGrid) and sends it via Termii
 * Email API using a template with a single {{email_body}} variable.
 *
 * Email Delivery Process:
 * - Constructs HTML email body with OTP and user information
 * - Sends via Termii Email API using raw HTML mode
 * - Handles delivery errors appropriately
 * - Returns success confirmation
 *
 * HTML Email Body:
 * - Professional email template with Auqli branding
 * - Displays reset OTP prominently
 * - Includes security notices and expiration information
 * - Responsive design with proper styling
 *
 * Error Handling:
 * - Propagates errors to calling function
 * - Allows controller to handle email failures
 * - Maintains system integrity on delivery issues
 *
 * @param {string} email - The buyer's email address to send the reset email to
 * @param {string} resetOTP - The reset OTP code to include in the email
 * @param {string} userName - Optional user name for personalization
 * @returns {Promise<boolean>} True if email sent successfully
 * @throws {Error} If Termii email sending fails
 */
async function sendResetEmail(email, resetOTP, userName = null) {
  // Step 1: Construct HTML email body with OTP
  // This keeps the email template in code (like SendGrid)
  // The HTML will be passed to Termii via a template variable
  const html = `
    <div style="background-color: #1a1a1a; color: #ffffff; padding: 30px; font-family: 'Arial', sans-serif; line-height: 1.6;">
      <div style="max-width: 600px; margin: 0 auto; border-radius: 8px; overflow: hidden;">
        <div style="padding: 25px; text-align: center;">
          <img src="https://res.cloudinary.com/dljgzevaj/image/upload/v1733928675/Group_178_iqez5h.png" alt="Auqli Logo" style="width: 180px; margin-bottom: 20px;">
        </div>
        
        <div style="background-color: #242424; padding: 30px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">
          <h1 style="color: #4CAF50; margin-bottom: 20px; font-size: 24px; text-align: center;">Password Reset Request</h1>
          <p style="font-size: 16px; margin-bottom: 20px; text-align: center;">${userName ? `Hi ${userName},` : 'Hi there,'} We received a request to reset your password. Use the code below to create a new password for your Auqli account.</p>
          
          <div style="background-color: #333333; padding: 25px; border-radius: 8px; margin: 25px 0; text-align: center; border-left: 4px solid #4CAF50;">
            <h3 style="color: #4CAF50; margin-bottom: 15px; font-size: 18px;">Your Reset Code</h3>
            <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0; color: #4CAF50; background-color: #1a1a1a; padding: 15px; border-radius: 4px; display: inline-block;">${resetOTP}</p>
            <p style="font-size: 14px; color: #bbbbbb;">This code will expire in 10 minutes</p>
          </div>
          
          <div style="margin: 25px 0; background-color: #1a1a1a; padding: 20px; border-radius: 8px;">
            <h3 style="color: #4CAF50; margin-bottom: 15px; font-size: 18px; text-align: center;">Security Notice</h3>
            <p style="font-size: 14px; color: #bbbbbb; text-align: center;">If you didn't request a password reset, please ignore this email or contact our support team immediately. Someone may be trying to access your account.</p>
          </div>
        </div>
        
        <div style="text-align: center; padding: 0 30px 30px 30px;">
          <p style="font-size: 14px; color: #999999; margin-bottom: 20px;">Need help? Contact our support team at <a href="mailto:support@auqli.com" style="color: #4CAF50; text-decoration: none;">support@auqli.com</a></p>
          <div style="margin: 20px 0; height: 1px; background-color: #333333;"></div>
          <p style="font-size: 12px; color: #666666;">© ${new Date().getFullYear()} Auqli. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;

  // Step 2: Send password reset email using Termii Email API with raw HTML
  // The service will pass the HTML to Termii via a template variable
  // If sending fails, the error will propagate to the calling function
  await termiiEmailService.sendPasswordResetEmail({
    email: email,
    ...authEmail({ html, subject: 'Password Reset Code - Auqli' }, { kind: 'reset', audience: 'buyer', code: resetOTP, name: userName })
  });
  
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
async function legacyForgotPassword(data) {
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
  
  // Step 7: Send password reset email with the generated OTP via Termii
  // If email sending fails, the error will propagate to the controller
  // Include buyer's name if available for personalization
  await sendResetEmail(data.email, resetOTP, buyer.firstName || buyer.name);
  
  // Step 8: Return success response
  // Note: We don't return the OTP in the response for security reasons
  return {
    message: 'Password reset code sent successfully'
  };
}

// Export the main service function for use in controllers
async function forgotPassword(data) { return require('../../../services/auth/passwordReset').issue('Buyer', data.email); }

module.exports = {
  forgotPassword
}; 