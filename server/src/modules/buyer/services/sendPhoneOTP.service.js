const buyerRepository = require('../repositories/buyer.repository');
const sendPhoneOTPValidator = require('../validators/sendPhoneOTP.validator');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const NotFoundException = require('../../../utils/errors/NotFoundException');
const InternalErrorException = require('../../../utils/errors/InternalErrorException');

/**
 * Generates a 6-digit phone OTP.
 * 
 * @returns {string} A 6-digit OTP string
 */
function generatePhoneOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Sends an SMS message using AWS SNS.
 * 
 * @param {SNSClient} sns - The SNS client instance
 * @param {Object} params - The parameters for the SMS message
 * @returns {Promise<Object>} The response from SNS
 */
async function sendSMSMessage(sns, params) {
  const command = new PublishCommand(params);
  return await sns.send(command);
}

/**
 * Creates and configures an SNS client.
 * 
 * @returns {SNSClient} Configured SNS client
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
 * Sends phone OTP to the specified phone number.
 * 
 * This function:
 * - Validates the phone number format
 * - Checks if the buyer exists
 * - Generates a 6-digit OTP
 * - Stores the OTP with expiry time in the buyer document
 * - Sends the OTP via AWS SNS
 * 
 * @param {string} buyerId - The buyer's ID
 * @param {string} phoneNumber - The phone number to send OTP to
 * @returns {Promise<Object>} Response object with success message and validity period
 */
async function sendPhoneOTP(buyerId, phoneNumber) {
  // Validate phone number format
  await sendPhoneOTPValidator.validatePhoneNumberFormat(phoneNumber);

  // Check if buyer exists
  const buyer = await buyerRepository.findById(buyerId);
  if (!buyer) {
    throw new NotFoundException('Buyer not found');
  }

  // Generate OTP
  const phoneOTP = generatePhoneOTP();

  // Store OTP and its expiry in buyer document
  const phoneVerificationData = {
    otp: phoneOTP,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // OTP valid for 10 minutes
    attempts: 0
  };

  await buyerRepository.updatePhoneVerification(buyerId, phoneVerificationData);

  // Send SMS via AWS SNS
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

  return {
    message: 'OTP sent successfully',
    validFor: '10 minutes'
  };
}

module.exports = {
  sendPhoneOTP
}; 