/**
 * Request Account Deletion Validator
 *
 * This validator handles input validation for account deletion requests.
 * It provides functionality to:
 * - Validate buyer ID format and structure
 * - Ensure buyer ID is provided and properly formatted
 * - Validate MongoDB ObjectId format requirements
 * - Verify buyer existence in database
 * - Check if buyer is already in deletion process
 * - Prevent duplicate deletion requests
 * - Maintain consistent validation standards
 *
 * The validator ensures that account deletion requests are properly
 * formatted and authenticated to prevent unauthorized deletion attempts
 * and duplicate requests.
 *
 * @module requestAccountDeletionValidator
 */

const mongoose = require('mongoose');
const buyerRepository = require('../repositories/buyer.repository');
const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Validate buyer ID and existence.
 *
 * This function performs comprehensive buyer validation for account deletion
 * requests, ensuring the buyer exists and is eligible for deletion.
 *
 * Business Logic:
 * - Checks if buyerId is provided (required parameter)
 * - Validates buyerId format (MongoDB ObjectId)
 * - Verifies that a buyer account exists with this ID
 * - Checks that buyer is not already in deletion process
 * - Prevents duplicate deletion requests
 * - Collects validation errors for reporting
 *
 * @param {string} buyerId - The buyer's ID to validate
 * @param {Array} errors - Array to collect validation errors
 * @example
 * const errors = [];
 * await validateBuyerId("507f1f77bcf86cd799439011", errors); // Valid if exists and not in deletion
 * await validateBuyerId("invalid-id", errors); // Invalid, adds error
 * await validateBuyerId("", errors); // Invalid, adds error
 */
async function validateBuyerId(buyerId, errors) {
  // Step 1: Check if buyerId is provided (required parameter)
  if (!buyerId) {
    errors.push({ field: 'buyerId', message: 'Buyer ID is required' });
    return;
  }

  // Step 2: Validate buyerId format (MongoDB ObjectId)
  if (!mongoose.Types.ObjectId.isValid(buyerId)) {
    errors.push({ field: 'buyerId', message: 'Invalid buyer ID format' });
    return;
  }

  // Step 3: Check if buyer exists with this ID
  // This prevents deletion requests for non-existent accounts
  const buyer = await buyerRepository.findById(buyerId);
  if (!buyer) {
    errors.push({ field: 'buyerId', message: 'Buyer not found' });
    return;
  }

  // Step 4: Check if buyer is already in deletion process
  // This prevents duplicate deletion requests and ensures data integrity
  if (buyer.accountDeletion && buyer.accountDeletion.otp) {
    errors.push({ field: 'buyerId', message: 'Account deletion request already in progress' });
  }
}

/**
 * Validate all request account deletion data before processing.
 *
 * This function orchestrates the complete validation process for account
 * deletion requests, ensuring all requirements are met before proceeding.
 *
 * Business Logic Flow:
 * 1. Initialize error collection array
 * 2. Validate buyer ID format and existence
 * 3. Check if buyer is already in deletion process
 * 4. Throw ValidationError if any validation fails
 *
 * Security Considerations:
 * - Buyer ID validation prevents unauthorized deletion attempts
 * - MongoDB ObjectId validation ensures data integrity
 * - Buyer existence verification prevents deletion of non-existent accounts
 * - Duplicate request prevention maintains system consistency
 * - Error collection provides comprehensive feedback
 *
 * @param {string} buyerId - The buyer's ID to validate
 * @throws {ValidationError} If any validation fails (invalid buyerId, buyer not found, or already in deletion process)
 * @example
 * // Valid request
 * await validateRequestAccountDeletionData("507f1f77bcf86cd799439011");
 * 
 * // Invalid request - will throw ValidationError
 * await validateRequestAccountDeletionData("invalid-id");
 */
async function validateRequestAccountDeletionData(buyerId) {
  // Initialize error collection array
  const errors = [];

  // Validate buyer ID and check all deletion requirements
  await validateBuyerId(buyerId, errors);

  // If any validation errors were found, throw ValidationError
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateRequestAccountDeletionData
}; 