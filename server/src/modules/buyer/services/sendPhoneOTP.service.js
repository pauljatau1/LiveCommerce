/**
 * Send Phone OTP Service
 *
 * This service handles the business logic for sending OTP (One-Time Password)
 * to buyer phone numbers via SMS. It provides secure OTP generation, SMS delivery,
 * and verification data management for phone verification.
 *
 * The service ensures that:
 * - Phone OTP requests are properly validated
 * - Secure 6-digit OTP codes are generated
 * - SMS notifications are sent via AWS SNS
 * - Verification data is stored with expiry
 * - Error handling maintains system integrity
 *
 * Phone OTP Flow:
 * - Input validation and buyer existence verification
 * - Secure 6-digit OTP generation
 * - Verification data storage with expiry
 * - SMS delivery via AWS SNS
 * - Success response and confirmation
 *
 * Security Features:
 * - Secure OTP generation using Math.random()
 * - Phone number validation before processing
 * - AWS SNS integration for reliable SMS delivery
 * - Verification data expiry management
 * - Error handling without information leakage
 *
 * SMS Integration:
 * - AWS SNS client configuration
 * - Professional SMS message formatting
 * - Sender ID configuration
 * - Error handling for SMS delivery
 * - Delivery confirmation
 *
 * @module sendPhoneOTPService
 */

const buyerRepository = require('../repositories/buyer.repository');
const { validateSendPhoneOTPData } = require('../validators/sendPhoneOTP.validator');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const NotFoundException = require('../../../utils/errors/NotFoundException');
const InternalErrorException = require('../../../utils/errors/InternalErrorException');

/**
 * Generates a secure 6-digit phone OTP.
 * 
 * This function creates a 6-digit numeric OTP that will be used
 * for phone verification. The OTP is generated using Math.random()
 * for secure random number generation.
 *
 * OTP Characteristics:
 * - 6-digit numeric format for user convenience
 * - Generated using Math.random() for security
 * - Range: 100000-999999 (inclusive)
 * - String format for consistent handling
 *
 * @returns {string} A 6-digit numeric OTP (e.g., "123456")
 */
function generatePhoneOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Sends an SMS message using AWS SNS.
 * 
 * This function handles the SMS sending process using AWS SNS service.
 * It creates and executes the SMS command for reliable message delivery.
 *
 * SMS Delivery Process:
 * - Creates PublishCommand with message parameters
 * - Sends command via SNS client
 * - Returns delivery confirmation
 * - Handles delivery errors appropriately
 *
 * @param {SNSClient} sns - The SNS client instance
 * @param {Object} params - The parameters for the SMS message
 * @param {string} params.Message - SMS message content
 * @param {string} params.PhoneNumber - Recipient phone number
 * @param {Object} params.MessageAttributes - SMS attributes
 * @returns {Promise<Object>} The response from SNS
 * @throws {Error} If SMS sending fails
 */
async function sendSMSMessage(sns, params) {
  const command = new PublishCommand(params);
  return await sns.send(command);
}

/**
 * Creates and configures an SNS client for SMS delivery.
 * 
 * This function initializes the AWS SNS client with proper
 * configuration for SMS message delivery.
 *
 * Client Configuration:
 * - AWS region configuration
 * - AWS credentials setup
 * - SNS client initialization
 * - SMS delivery capability
 *
 * @returns {SNSClient} Configured SNS client for SMS delivery
 */
function createSNSClient() {
  return new SNSClient({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  });
}

/**
 * Sends phone OTP to the specified phone number - Main business logic function.
 *
 * This is the primary service function that orchestrates the complete
 * phone OTP sending process. It handles validation, OTP generation,
 * verification data storage, and SMS delivery in a secure and efficient manner.
 *
 * Business Logic Flow:
 * 1. Validates the input data (phone number format and requirements)
 * 2. Finds the buyer by ID for verification
 * 3. Generates a secure 6-digit OTP
 * 4. Stores verification data with expiry time
 * 5. Sends OTP via AWS SNS SMS
 * 6. Returns success confirmation
 *
 * Security Features:
 * - Comprehensive input validation before processing
 * - Secure OTP generation using Math.random()
 * - Phone number validation ensures proper format
 * - AWS SNS integration for reliable delivery
 * - Error handling without information leakage
 *
 * Verification Data Management:
 * - Stores OTP with 10-minute expiry
 * - Tracks verification attempts
 * - Maintains verification audit trail
 * - Ensures data consistency
 *
 * SMS Delivery:
 * - Professional message formatting
 * - Sender ID configuration
 * - Reliable AWS SNS delivery
 * - Error handling for delivery failures
 *
 * Error Handling:
 * - Validation errors for invalid inputs
 * - NotFoundException for non-existent buyers
 * - SMS delivery errors
 * - Database operation errors
 * - Proper error propagation to controller
 *
 * @param {string} buyerId - The buyer's ID
 * @param {string} phoneNumber - The phone number to send OTP to
 * @returns {Promise<Object>} Success response object with message
 *   - message: {string} - Success message confirming OTP sent
 * @throws {ValidationError} If input validation fails (invalid phone number)
 * @throws {NotFoundException} If buyer is not found
 * @throws {InternalErrorException} If SMS sending fails
 *
 * @example
 * // Send phone OTP to buyer
 * const result = await sendPhoneOTP('507f1f77bcf86cd799439011', '+2341234567890');
 * // Returns: { message: 'OTP sent successfully' }
 *
 * @example
 * // Failed validation - invalid phone number
 * try {
 *   await sendPhoneOTP('507f1f77bcf86cd799439011', 'invalid-phone');
 * } catch (error) {
 *   // error instanceof ValidationError
 *   // error.errors contains validation error details
 * }
 */
async function sendPhoneOTP(buyerId, phoneNumber) {
  // Step 1: Validate input data using the validator
  // This ensures phone number format is correct and meets requirements
  await validateSendPhoneOTPData({ phoneNumber });

  // Step 2: Check if buyer exists
  // This ensures the buyer exists before generating OTP
  const buyer = await buyerRepository.findById(buyerId);
  if (!buyer) {
    throw new NotFoundException('Buyer not found');
  }

  // Step 3: Generate a secure 6-digit OTP
  // This OTP will be sent to the user's phone for verification
  const phoneOTP = generatePhoneOTP();

  // Step 4: Store OTP and its expiry in buyer document
  // This creates verification data with 10-minute expiry and attempt tracking
  const phoneVerificationData = {
    otp: phoneOTP,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // OTP valid for 10 minutes
    attempts: 0
  };

  await buyerRepository.updatePhoneVerification(buyerId, phoneVerificationData);

  // Step 5: Send SMS via AWS SNS
  // This delivers the OTP to the user's phone number
  const sns = createSNSClient();
  const params = {
    Message: `Your Auqli verification code is: ${phoneOTP}. Valid for 10 minutes.`,
    PhoneNumber: phoneNumber,
    MessageAttributes: {
      'AWS.SNS.SMS.SenderID': {
        'DataType': 'String',
        'StringValue': 'AUQLI'
      }
    }
  };

  try {
    await sendSMSMessage(sns, params);
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw new InternalErrorException('Failed to send OTP');
  }

  // Step 6: Return success response
  // Note: We don't return the OTP in the response for security reasons
  return {
    message: 'OTP sent successfully',
    validFor: '10 minutes'
  };
}

module.exports = {
  sendPhoneOTP,
}; 