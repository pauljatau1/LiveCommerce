// External dependencies
const mongoose = require('mongoose');

// Internal dependencies - utilities and repositories
const ValidationError = require('../../../utils/errors/ValidationError');
const buyerRepository = require('../repositories/buyer.repository');

/**
 * Validates the buyer ID format and existence in the database.
 * This function performs comprehensive validation of the buyer ID including:
 * - Presence validation (required field)
 * - Format validation (valid MongoDB ObjectId)
 * - Existence validation (buyer exists in database)
 * 
 * @param {string} buyerId - The buyer ID to validate (should be a valid ObjectId string)
 * @param {Array} errors - Array to collect validation errors
 */
async function validateBuyerId(buyerId, errors) {
  // Step 1: Check if buyerId is provided and not empty
  if (!buyerId) {
    errors.push({ field: 'buyerId', message: 'Buyer ID is required' });
    return;
  }
  
  // Step 2: Validate buyerId format using Mongoose ObjectId validation
  // This ensures the ID can be used safely in database queries
  if (!mongoose.Types.ObjectId.isValid(buyerId)) {
    errors.push({ field: 'buyerId', message: 'Invalid buyer ID format' });
    return;
  }
  
  // Step 3: Verify that the buyer actually exists in the database
  // This prevents operations on non-existent buyer accounts
  const buyer = await buyerRepository.findById(buyerId);
  if (!buyer) {
    errors.push({ field: 'buyerId', message: 'Buyer not found' });
  }
}

/**
 * Validates the OTP (One-Time Password) format and presence.
 * This function ensures the OTP meets security requirements:
 * - Must be present (required field)
 * - Must be a string type
 * - Must contain only numeric digits
 * - Must be exactly 4 characters long
 * 
 * @param {string} otp - The OTP to validate (expected format: "1234")
 * @param {Array} errors - Array to collect validation errors
 */
function validateOTP(otp, errors) {
  // Step 1: Check if OTP is provided (required field validation)
  if (!otp) {
    errors.push({ field: 'otp', message: 'OTP is required' });
    return;
  }
  
  // Step 2: Ensure OTP is a string type to prevent type confusion attacks
  if (typeof otp !== 'string') {
    errors.push({ field: 'otp', message: 'OTP must be a string' });
    return;
  }
  
  // Step 3: Validate OTP format when it's provided and is a string
  if (otp && typeof otp === 'string') {
    // Check if OTP contains only numeric digits using regex
    if (!/^\d+$/.test(otp)) {
      errors.push({ field: 'otp', message: 'OTP must contain only digits' });
    }
    
    // Check if OTP has exactly 4 characters for security consistency
    if (otp.length !== 4) {
      errors.push({ field: 'otp', message: 'OTP must be exactly 4 digits' });
    }
  }
}

/**
 * Validates account deletion request existence and status.
 * This function performs security checks on the account deletion process:
 * - Ensures a deletion request exists and has an OTP
 * - Verifies the OTP hasn't expired (time-based security)
 * - Checks that attempt limits haven't been exceeded (brute force protection)
 * 
 * @param {Object} buyer - The buyer object to validate (should contain accountDeletion field)
 * @param {Array} errors - Array to collect validation errors
 */
function validateAccountDeletionRequest(buyer, errors) {
  // Check if buyer has account deletion request
  if (!buyer.accountDeletion || !buyer.accountDeletion.otp) {
    errors.push({ field: 'buyerId', message: 'No account deletion request found' });
    return;
  }

  // Check if OTP has expired (24 hours)
  const now = new Date();
  const otpExpiresAt = new Date(buyer.accountDeletion.expiresAt);
  if (now > otpExpiresAt) {
    errors.push({ field: 'otp', message: 'OTP has expired' });
    return;
  }

  // Check if maximum attempts exceeded
  if (buyer.accountDeletion.attempts >= 5) {
    errors.push({ field: 'otp', message: 'Maximum OTP attempts exceeded' });
    return;
  }
}

/**
 * Validates the complete confirm account deletion data.
 * This function orchestrates the validation of both buyer ID and OTP,
 * ensuring all security requirements are met before allowing account deletion.
 * 
 * @param {string} buyerId - The buyer ID to validate
 * @param {string} otp - The OTP to validate
 * @throws {ValidationError} If validation fails
 */
async function validateConfirmAccountDeletionData(buyerId, otp) {
  const errors = [];

  // Validate OTP format first (fail fast approach)
  validateOTP(otp, errors);
  
  // Validate buyer ID format and existence
  await validateBuyerId(buyerId, errors);
  
  // If no format errors, validate account deletion request
  if (errors.length === 0) {
    const buyer = await buyerRepository.findById(buyerId);
    validateAccountDeletionRequest(buyer, errors);
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateConfirmAccountDeletionData
};