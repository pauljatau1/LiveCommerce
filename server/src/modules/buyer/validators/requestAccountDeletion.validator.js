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
 * @returns {Promise<Object>} The buyer object if validation passes
 * @throws {ValidationError} If buyerId is missing, invalid format, or buyer doesn't exist
 *
 * @example
 * // Valid buyer ID
 * const buyer = await validateBuyerId('507f1f77bcf86cd799439011');
 *
 * @example
 * // Invalid buyer ID format
 * try {
 *   await validateBuyerId('invalid-id');
 * } catch (error) {
 *   // error.message contains validation details
 * }
 */
async function validateBuyerId(buyerId) {
  const errors = [];

  // Check if buyerId is provided
  if (!buyerId) {
    errors.push({ field: 'buyerId', message: 'Buyer ID is required' });
    throw new ValidationError(errors);
  }

  // Validate buyerId format (MongoDB ObjectId)
  const mongoose = require('mongoose');
  if (!mongoose.Types.ObjectId.isValid(buyerId)) {
    errors.push({ field: 'buyerId', message: 'Invalid buyer ID format' });
    throw new ValidationError(errors);
  }

  // Check if buyer exists with this ID
  const buyer = await buyerRepository.findById(buyerId);
  if (!buyer) {
    errors.push({ field: 'buyerId', message: 'Buyer not found' });
    throw new ValidationError(errors);
  }

  // Check if buyer is already in deletion process
  if (buyer.accountDeletion && buyer.accountDeletion.otp) {
    errors.push({ field: 'buyerId', message: 'Account deletion request already in progress' });
    throw new ValidationError(errors);
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
 *
 * @example
 * // Successful validation
 * const buyer = await validateRequestAccountDeletionData('507f1f77bcf86cd799439011');
 *
 * @example
 * // Failed validation - buyer not found
 * try {
 *   await validateRequestAccountDeletionData('507f1f77bcf86cd799439011');
 * } catch (error) {
 *   // error.message contains validation details
 * }
 */
async function validateRequestAccountDeletionData(buyerId) {
  // Validate buyer ID and get buyer object
  // This also ensures the buyer exists and is not already in deletion process
  const buyer = await validateBuyerId(buyerId);

  // All validations passed, return the buyer object
  // The service layer can now proceed with account deletion request
  return buyer;
}

module.exports = {
  validateRequestAccountDeletionData
}; 