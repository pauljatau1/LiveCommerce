/**
 * Request Account Deletion Validator
 *
 * This validator handles input validation for account deletion requests.
 * It validates that the buyer exists and is properly authenticated.
 *
 * The validator ensures that:
 * - Buyer ID is provided and valid
 * - Buyer exists in the database
 * - Buyer is not already in deletion process
 *
 * @module requestAccountDeletionValidator
 */

const mongoose = require('mongoose');
const buyerRepository = require('../repositories/buyer.repository');
const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Validate buyer ID and existence.
 *
 * This function performs comprehensive buyer validation:
 * 1. Checks if buyerId is provided (not null/undefined/empty)
 * 2. Validates buyerId format (MongoDB ObjectId)
 * 3. Verifies that a buyer account exists with this ID
 * 4. Checks that buyer is not already in deletion process
 *
 * @param {string} buyerId - The buyer's ID to validate
 * @param {Array} errors - Array to collect validation errors
 * @returns {Promise<Object|null>} The buyer object if validation passes, null if errors
 */
async function validateBuyerId(buyerId, errors) {
  // Check if buyerId is provided
  if (!buyerId) {
    errors.push({ field: 'buyerId', message: 'Buyer ID is required' });
    return null;
  }

  // Validate buyerId format (MongoDB ObjectId)
  if (!mongoose.Types.ObjectId.isValid(buyerId)) {
    errors.push({ field: 'buyerId', message: 'Invalid buyer ID format' });
    return null;
  }

  // Check if buyer exists with this ID
  const buyer = await buyerRepository.findById(buyerId);
  if (!buyer) {
    errors.push({ field: 'buyerId', message: 'Buyer not found' });
    return null;
  }

  // Check if buyer is already in deletion process
  if (buyer.accountDeletion && buyer.accountDeletion.otp) {
    errors.push({ field: 'buyerId', message: 'Account deletion request already in progress' });
    return null;
  }

  return buyer;
}

/**
 * Validate all request account deletion data before processing.
 *
 * This function orchestrates the complete validation process for account deletion requests:
 * 1. Validates buyer ID and existence
 * 2. Ensures buyer is not already in deletion process
 *
 * This is the main validation function that should be called by the service layer.
 * It ensures all input data is valid before proceeding with the account deletion request.
 *
 * @param {string} buyerId - The buyer's ID
 * @returns {Promise<Object>} The buyer object if all validations pass
 * @throws {ValidationError} If any validation fails (invalid buyerId, buyer not found, or already in deletion process)
 */
async function validateRequestAccountDeletionData(buyerId) {
  const errors = [];

  // Validate buyer ID and get buyer object
  const buyer = await validateBuyerId(buyerId, errors);

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  // All validations passed, return the buyer object
  // The service layer can now proceed with account deletion request
  return buyer;
}

module.exports = {
  validateRequestAccountDeletionData
}; 