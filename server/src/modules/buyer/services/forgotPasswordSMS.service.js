/**
 * Forgot Password SMS Service
 *
 * This service handles the business logic for processing forgot password requests via SMS.
 * It provides comprehensive password reset functionality including validation,
 * OTP generation, database updates, and SMS notifications via Termii API.
 *
 * The service ensures that:
 * - User input is properly validated before processing
 * - Secure OTP codes are generated for password reset
 * - Database records are updated with reset information
 * - Professional SMS notifications are sent to users via Termii
 * - Security measures prevent unauthorized access
 * - Error handling maintains system integrity
 *
 * Password Reset Flow:
 * - Phone number validation and user existence verification
 * - Secure OTP generation and storage
 * - Database update with expiry information
 * - SMS notification with reset instructions via Termii
 * - Proper error handling and security measures
 *
 * Security Features:
 * - OTP expiration after 10 minutes
 * - Phone number validation before processing
 * - Secure OTP generation
 * - Database atomic updates
 * - Error handling without information leakage
 *
 * SMS Integration:
 * - Termii API integration for reliable SMS delivery
 * - DND (Do Not Disturb) route for transactional messages
 * - Professional message formatting
 * - Sender ID configuration
 * - Error handling for SMS delivery
 *
 * @module forgotPasswordSMSService
 */

const buyerRepository = require('../repositories/buyer.repository');
const forgotPasswordSMSValidator = require('../validators/forgotPasswordSMS.validator');
const { generateOTP } = require('../../../utils/helpers');
const termiiAPI = require('../../../config/termii');
const InternalErrorException = require('../../../utils/errors/InternalErrorException');

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
 * - Suitable for SMS delivery and user input
 *
 * @returns {string} A 4-digit numeric OTP (e.g., "1234")
 */
function generateResetOTP() {
  return generateOTP();
}

/**
 * Formats phone number for Termii API.
 * 
 * Termii API requires phone numbers in international format without the + sign.
 * This function removes the + prefix if present to ensure proper API formatting.
 *
 * Format Requirements:
 * - Phone number must be in international format (e.g., 23490126727)
 * - Country code must be included
 * - No + prefix (Termii API requirement)
 *
 * @param {string} phoneNumber - Phone number in international format (e.g., +23490126727)
 * @returns {string} Phone number formatted for Termii API (e.g., 23490126727)
 */
function formatPhoneNumberForTermii(phoneNumber) {
  // Remove + prefix if present, as Termii API requires phone numbers without +
  return phoneNumber.startsWith('+') ? phoneNumber.substring(1) : phoneNumber;
}

/**
 * Constructs the SMS message content for password reset notifications.
 *
 * This function creates a professional SMS message with the OTP code
 * and clear instructions for the user. The message is formatted to be
 * clear and concise for SMS delivery.
 *
 * Message Format:
 * - Clear identification of the service (Auqli)
 * - OTP code prominently displayed
 * - Expiry time information
 * - Security notice
 *
 * @param {string} resetOTP - The reset code to include in the SMS
 * @returns {string} Formatted SMS message content
 */
function getSMSMessage(resetOTP) {
  return `Your Auqli password reset code is: ${resetOTP}. Valid for 10 minutes. If you didn't request this, please ignore this message.`;
}

/**
 * Sends password reset SMS to the buyer using Termii API.
 * 
 * This function handles the SMS sending process for password reset notifications.
 * It constructs the SMS payload and sends it via Termii API using the DND route
 * for reliable transactional message delivery.
 *
 * SMS Delivery Process:
 * - Formats phone number for Termii API
 * - Constructs SMS message with OTP
 * - Sends via Termii DND route for transactional messages
 * - Handles delivery errors appropriately
 * - Returns success confirmation
 *
 * Termii API Configuration:
 * - Uses DND route for transactional messages (bypasses DND restrictions)
 * - Includes API key in request body
 * - Uses configured sender ID from environment variables
 * - Plain text message type
 *
 * Error Handling:
 * - Propagates errors to calling function
 * - Allows controller to handle SMS delivery failures
 * - Maintains system integrity on delivery issues
 *
 * @param {string} phoneNumber - The buyer's phone number to send the reset SMS to (international format)
 * @param {string} resetOTP - The reset OTP code to include in the SMS
 * @returns {Promise<boolean>} True if SMS sent successfully
 * @throws {InternalErrorException} If SMS sending fails
 */
async function sendResetSMS(phoneNumber, resetOTP) {
  try {
    // Step 1: Format phone number for Termii API (remove + prefix)
    // Termii API requires phone numbers in international format without +
    const formattedPhoneNumber = formatPhoneNumberForTermii(phoneNumber);

    // Step 2: Construct SMS message with OTP
    // This creates a clear, professional message for the user
    const smsMessage = getSMSMessage(resetOTP);

    // Step 3: Prepare Termii API request payload
    // Using DND route for transactional messages to ensure reliable delivery
    // DND route bypasses Do Not Disturb restrictions for critical messages
    const payload = {
      api_key: process.env.TERMII_API_KEY,
      to: formattedPhoneNumber,
      from: process.env.TERMII_SENDER_ID || 'Auqli',
      sms: smsMessage,
      type: 'plain',
      channel: 'generic' 
    };

    // Step 4: Send SMS via Termii API
    // The API endpoint is /api/sms/send for single recipient messages
    const response = await termiiAPI.post('/api/sms/send', payload);

    // Step 5: Verify successful response from Termii API
    // Termii returns { code: 'ok', message: 'Successfully Sent', ... } on success
    if (response.data && response.data.code === 'ok') {
      return true;
    } else {
      // If response doesn't indicate success, throw error
      throw new InternalErrorException('Failed to send SMS: Invalid response from Termii API');
    }
  } catch (error) {
    // Step 6: Handle errors from Termii API
    // Log error details for debugging while maintaining security
    console.error('Error sending SMS via Termii:', error.response?.data || error.message);
    
    // Throw InternalErrorException to be handled by controller
    // This prevents exposing internal API details to users
    throw new InternalErrorException('Failed to send password reset code. Please try again later.');
  }
}

/**
 * Process forgot password request via SMS - Main business logic function.
 * 
 * This is the primary service function that orchestrates the entire
 * forgot password via SMS workflow. It performs comprehensive validation,
 * secure OTP generation, database updates, and SMS notifications.
 *
 * Business Logic Flow:
 * 1. Validates the input data (phone number format, user existence)
 * 2. Generates a secure 4-digit OTP for password reset
 * 3. Calculates expiry time (10 minutes from current time)
 * 4. Updates the buyer record with reset information and expiry
 * 5. Sends a password reset SMS with the OTP via Termii
 * 6. Returns a success response or throws appropriate errors
 *
 * Security Features:
 * - Comprehensive input validation before processing
 * - Secure OTP generation using utility functions
 * - 10-minute OTP expiration for security
 * - Phone number validation ensures user exists before sending reset
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
 * - SMS delivery errors for notification issues
 * - Proper error propagation to controller
 *
 * @param {Object} data - Forgot password SMS request data object
 * @param {string} data.phoneNumber - The buyer's phone number (international format, e.g., +23490126727)
 * @returns {Promise<Object>} Success response object with message
 *   - message: {string} - Success message confirming SMS sent
 * @throws {ValidationError} If input validation fails (invalid phone number, user not found)
 * @throws {InternalErrorException} If database update fails or SMS sending fails
 *
 * @example
 * // Successful password reset request via SMS
 * const result = await forgotPasswordSMS({ phoneNumber: '+23490126727' });
 * // Returns: { message: 'Password reset code sent successfully' }
 *
 * @example
 * // Failed validation - invalid phone number
 * try {
 *   await forgotPasswordSMS({ phoneNumber: 'invalid-phone' });
 * } catch (error) {
 *   // error instanceof ValidationError
 *   // error.errors contains validation error details
 * }
 *
 * @example
 * // Failed validation - user not found
 * try {
 *   await forgotPasswordSMS({ phoneNumber: '+2349999999999' });
 * } catch (error) {
 *   // error instanceof ValidationError
 *   // error.errors contains user not found error
 * }
 */
async function forgotPasswordSMS(data) {
  // Step 1: Validate input data using the validator
  // This ensures phone number format is correct and user exists in the system
  await forgotPasswordSMSValidator.validateForgotPasswordSMSData(data);

  // Step 2: Find the buyer by phone number
  // The validator ensures the buyer exists, so this should always succeed
  const buyer = await buyerRepository.findByPhoneNumber(data.phoneNumber);
  
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
    throw new InternalErrorException('Failed to update buyer with reset OTP');
  }
  
  // Step 7: Send password reset SMS with the generated OTP via Termii
  // If SMS sending fails, the error will propagate to the controller
  await sendResetSMS(data.phoneNumber, resetOTP);
  
  // Step 8: Return success response
  // Note: We don't return the OTP in the response for security reasons
  return {
    message: 'Password reset code sent successfully'
  };
}

// Export the main service function for use in controllers
module.exports = {
  forgotPasswordSMS
};

