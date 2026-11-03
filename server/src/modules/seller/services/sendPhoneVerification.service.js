/**
 * Send Phone Verification Service
 *
 * This service handles the business logic for sending phone verification OTP to sellers.
 * It provides comprehensive phone verification functionality including validation,
 * OTP generation, database updates, and SMS notifications via Termii API.
 *
 * The service ensures that:
 * - User input is properly validated before processing
 * - Secure OTP codes are generated for phone verification
 * - Database records are updated with verification information
 * - Professional SMS notifications are sent to sellers via Termii
 * - Security measures prevent unauthorized access
 * - Error handling maintains system integrity
 *
 * Phone Verification Flow:
 * - Phone number validation and seller existence verification
 * - Secure OTP generation and storage
 * - Database update with expiry information
 * - SMS notification with verification code via Termii
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
 * - Generic channel for transactional messages
 * - Professional message formatting
 * - Sender ID configuration
 * - Error handling for SMS delivery
 *
 * @module sendPhoneVerificationService
 */

const sellerRepository = require('../repositories/seller.repository');
const { validateSendPhoneVerificationData } = require('../validators/sendPhoneVerification.validator');
const { generateOTP } = require('../../../utils/helpers');
const termiiAPI = require('../../../config/termii');
const NotFoundException = require('../../../utils/errors/NotFoundException');
const InternalErrorException = require('../../../utils/errors/InternalErrorException');

/**
 * Formats phone number for Termii API.
 * 
 * Termii API requires phone numbers in international format without the + sign.
 * This function removes the + prefix if present to ensure proper API formatting.
 *
 * @param {string} phoneNumber - Phone number in international format (e.g., +23490126727)
 * @returns {string} Phone number formatted for Termii API (e.g., 23490126727)
 */
function formatPhoneNumberForTermii(phoneNumber) {
  // Remove + prefix if present, as Termii API requires phone numbers without +
  return phoneNumber.startsWith('+') ? phoneNumber.substring(1) : phoneNumber;
}

/**
 * Constructs the SMS message content for phone verification notifications.
 *
 * This function creates a professional SMS message with the OTP code
 * and clear instructions for the seller. The message is formatted to be
 * clear and concise for SMS delivery.
 *
 * @param {string} verificationOTP - The verification code to include in the SMS
 * @returns {string} Formatted SMS message content
 */
function getSMSMessage(verificationOTP) {
  return `Your Auqli phone verification code is: ${verificationOTP}. Valid for 10 minutes. If you didn't request this, please ignore this message.`;
}

/**
 * Sends phone verification SMS to the seller using Termii API.
 * 
 * This function handles the SMS sending process for phone verification notifications.
 * It constructs the SMS payload and sends it via Termii API using the generic channel
 * for reliable transactional message delivery.
 *
 * @param {string} phoneNumber - The seller's phone number to send the verification SMS to (international format)
 * @param {string} verificationOTP - The verification OTP code to include in the SMS
 * @returns {Promise<boolean>} True if SMS sent successfully
 * @throws {InternalErrorException} If SMS sending fails
 */
async function sendVerificationSMS(phoneNumber, verificationOTP) {
  try {
    // Step 1: Format phone number for Termii API (remove + prefix)
    const formattedPhoneNumber = formatPhoneNumberForTermii(phoneNumber);

    // Step 2: Construct SMS message with OTP
    const smsMessage = getSMSMessage(verificationOTP);

    // Step 3: Prepare Termii API request payload
    // Using generic channel for transactional messages
    const payload = {
      api_key: process.env.TERMII_API_KEY,
      to: formattedPhoneNumber,
      from: process.env.TERMII_SENDER_ID || 'Auqli',
      sms: smsMessage,
      type: 'plain',
      channel: 'generic'
    };

    // Step 4: Send SMS via Termii API
    const response = await termiiAPI.post('/api/sms/send', payload);

    // Step 5: Verify successful response from Termii API
    if (response.data && response.data.code === 'ok') {
      return true;
    } else {
      throw new InternalErrorException('Failed to send SMS: Invalid response from Termii API');
    }
  } catch (error) {
    // Step 6: Handle errors from Termii API
    console.error('Error sending SMS via Termii:', error.response?.data || error.message);
    throw new InternalErrorException('Failed to send phone verification code. Please try again later.');
  }
}

/**
 * Process send phone verification request - Main business logic function.
 * 
 * This is the primary service function that orchestrates the entire
 * phone verification OTP sending workflow. It performs comprehensive validation,
 * secure OTP generation, database updates, and SMS notifications.
 *
 * Business Logic Flow:
 * 1. Validates the input data (phone number format, seller existence)
 * 2. Generates a secure 4-digit OTP for phone verification
 * 3. Calculates expiry time (10 minutes from current time)
 * 4. Updates the seller record with verification information and expiry
 * 5. Sends a phone verification SMS with the OTP via Termii
 * 6. Returns a success response or throws appropriate errors
 *
 * @param {Object} data - Send phone verification request data object
 * @param {string} data.phoneNumber - The seller's phone number (international format, e.g., +23490126727)
 * @returns {Promise<Object>} Success response object with message
 *   - message: {string} - Success message confirming SMS sent
 * @throws {ValidationError} If input validation fails (invalid phone number, seller not found)
 * @throws {InternalErrorException} If database update fails or SMS sending fails
 */
async function sendPhoneVerification(data) {
  // Step 1: Validate input data using the validator
  await validateSendPhoneVerificationData(data);

  // Step 2: Find the seller by phone number
  const seller = await sellerRepository.findByPhoneNumber(data.phoneNumber);
  if (!seller) {
    throw new NotFoundException('No seller account found with this phone number');
  }

  // Step 3: Generate a secure 4-digit OTP for phone verification
  const verificationOTP = generateOTP();

  // Step 4: Calculate expiry time (10 minutes from current time)
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  // Step 5: Update the seller record with verification OTP and expiry information
  const updatedSeller = await sellerRepository.updatePhoneVerificationOTP(
    seller._id,
    verificationOTP,
    expiresAt
  );

  // Step 6: Verify that the database update was successful
  if (!updatedSeller) {
    throw new InternalErrorException('Failed to update seller with verification OTP');
  }

  // Step 7: Send phone verification SMS with the generated OTP via Termii
  await sendVerificationSMS(data.phoneNumber, verificationOTP);

  // Step 8: Return success response
  return {
    message: 'Phone verification code sent successfully'
  };
}

module.exports = {
  sendPhoneVerification
};

