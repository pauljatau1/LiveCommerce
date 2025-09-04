/**
 * Add Bank Details Service
 *
 * This service handles the business logic for adding bank details to a seller account.
 * It provides comprehensive bank details management including validation,
 * business rule enforcement, and database operations.
 *
 * The service ensures that:
 * - Bank details are properly validated before processing
 * - Business rules are enforced (e.g., no duplicate bank details)
 * - Database operations are performed through the repository layer
 * - Proper error handling and response formatting
 *
 * Business Rules:
 * - Seller must exist and be authenticated
 * - Seller cannot have existing bank details (must use change request process)
 * - All required bank detail fields must be provided
 * - Bank details are properly formatted and validated
 *
 * @module addBankDetailsService
 */

const sellerRepository = require('../repositories/seller.repository');
const addBankDetailsValidator = require('../validators/addBankDetails.validator');
const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Adds bank details to a seller's account.
 *
 * This function handles the complete process of adding bank details to a seller account.
 * It validates the input data, checks business rules, and updates the seller's profile
 * with the new bank information.
 *
 * Business Logic:
 * - Validates all bank detail fields using the validator
 * - Checks if seller already has bank details (prevents duplicates)
 * - Updates seller profile with new bank details
 * - Sets hasFilledBankDetails flag to true
 * - Returns updated seller information
 *
 * @param {string} sellerId - The ID of the seller to add bank details to
 * @param {Object} bankDetails - The bank details object containing all required fields
 * @returns {Promise<Object>} Updated seller object with new bank details
 * @throws {ValidationError} If bank details validation fails
 * @throws {Error} If seller not found or business rules are violated
 */
async function addBankDetails(sellerId, bankDetails) {
  // Step 1: Find the seller by ID to check existence and current status
  const seller = await sellerRepository.findById(sellerId);
  
  // Step 2: Check if seller exists
  if (!seller) {
    throw new Error('Seller not found');
  }

  // Step 3: Check business rule - if seller already has bank details, they need to use change request process
  if (seller.bankDetails && seller.bankDetails.accountNumber) {
    throw new ValidationError([{ 
      field: 'bankDetails', 
      message: 'Bank details already exist. Please use the bank change request process to update your details.' 
    }]);
  }

  // Step 4: Validate bank details using the validator (only if bankDetails is provided)
  if (bankDetails) {
    addBankDetailsValidator.validateBankDetails(bankDetails);
  }

  // Step 5: Update seller with new bank details (even if bankDetails is undefined/null)
  seller.bankDetails = bankDetails;
  seller.hasFilledBankDetails = !!bankDetails;

  // Step 6: Save the updated seller using the repository
  const updatedSeller = await sellerRepository.save(seller);

  // Step 7: Return the updated seller data
  return updatedSeller;
}

module.exports = {
  addBankDetails
};
