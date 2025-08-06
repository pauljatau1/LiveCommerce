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
 * @returns {Promise<Object>} The buyer object if validation passes
 * @throws {ValidationError} If buyer ID is invalid or buyer doesn't exist
 */
async function validateBuyerId(buyerId) {
  // Initialize errors array to collect all validation errors
  const errors = [];
  
  // Step 1: Check if buyerId is provided and not empty
  if (!buyerId) {
    errors.push({ field: 'buyerId', message: 'Buyer ID is required' });
    throw new ValidationError(errors);
  }
  
  // Step 2: Validate buyerId format using Mongoose ObjectId validation
  // This ensures the ID can be used safely in database queries
  if (!mongoose.Types.ObjectId.isValid(buyerId)) {
    errors.push({ field: 'buyerId', message: 'Invalid buyer ID format' });
    throw new ValidationError(errors);
  }
  
  // Step 3: Verify that the buyer actually exists in the database
  // This prevents operations on non-existent buyer accounts
  const buyer = await buyerRepository.findById(buyerId);
  if (!buyer) {
    errors.push({ field: 'buyerId', message: 'Buyer not found' });
    throw new ValidationError(errors);
  }
  
  // Return the buyer object for use in subsequent validation steps
  return buyer;
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
 * @throws {ValidationError} If OTP is invalid or doesn't meet format requirements
 */
function validateOTP(otp) {
  // Initialize errors array to collect validation errors
  const errors = [];
  
  // Step 1: Check if OTP is provided (required field validation)
  if (!otp) {
    errors.push({ field: 'otp', message: 'OTP is required' });
  }
  
  // Step 2: Ensure OTP is a string type to prevent type confusion attacks
  if (typeof otp !== 'string') {
    errors.push({ field: 'otp', message: 'OTP must be a string' });
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
  
  // If any validation errors occurred, throw ValidationError
  if (errors.length > 0) {
    throw new ValidationError(errors);
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
 * @throws {ValidationError} If no deletion request found or request is invalid
 */
function validateAccountDeletionRequest(buyer) {
  // Initialize errors array for collecting validation issues
  const errors = [];
  
  // Step 1: Verify that an account deletion request exists with an OTP
  // This ensures the user has initiated the deletion process properly
  if (!buyer.accountDeletion || !buyer.accountDeletion.otp) {
    errors.push({ 
      field: 'accountDeletion', 
      message: 'No deletion request found. Please request account deletion first.' 
    });
    throw new ValidationError(errors);
  }
  
  // Step 2: Check if the OTP has expired (time-based security measure)
  // This prevents the use of old OTPs and ensures timely action
  if (new Date() > buyer.accountDeletion.expiresAt) {
    errors.push({ 
      field: 'accountDeletion', 
      message: 'Verification code has expired. Please request a new one.' 
    });
    throw new ValidationError(errors);
  }
  
  // Step 3: Validate attempt count to prevent brute force attacks
  // Maximum of 5 attempts allowed before requiring a new OTP
  if (buyer.accountDeletion.attempts >= 5) {
    errors.push({ 
      field: 'accountDeletion', 
      message: 'Too many failed attempts. Please request a new verification code.' 
    });
    throw new ValidationError(errors);
  }
}

/**
 * Validates the complete confirm account deletion request data.
 * This is the main validation function that orchestrates all validation steps:
 * 1. OTP format validation
 * 2. Buyer ID validation and existence check
 * 3. Account deletion request validation
 * 
 * @param {string} buyerId - The buyer ID (MongoDB ObjectId string)
 * @param {string} otp - The OTP provided by user (4-digit string)
 * @returns {Promise<Object>} The validated buyer object if all checks pass
 * @throws {ValidationError} If any validation step fails
 */
async function validateConfirmAccountDeletionData(buyerId, otp) {
  // Step 1: Validate OTP format first (fail fast approach)
  // This prevents unnecessary database queries if OTP format is invalid
  validateOTP(otp);
  
  // Step 2: Validate buyer ID and retrieve buyer from database
  // This ensures the buyer exists and is accessible
  const buyer = await validateBuyerId(buyerId);
  
  // Step 3: Validate the account deletion request status
  // This checks OTP expiration, attempt limits, and request existence
  validateAccountDeletionRequest(buyer);
  
  // Return validated buyer object for use in service layer
  return buyer;
}

module.exports = {
  validateConfirmAccountDeletionData
};