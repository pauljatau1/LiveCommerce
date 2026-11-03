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
 * Adds or updates bank details for a seller's account.
 *
 * This function handles the complete process of adding or updating bank details for a seller account.
 * It validates the input data and updates the seller's profile with the new bank information.
 * No admin approval required - sellers can directly update their bank details after verification.
 *
 * Business Logic:
 * - Validates all bank detail fields using the validator
 * - Allows both adding new bank details and updating existing ones
 * - Updates seller profile with new bank details
 * - Sets hasFilledBankDetails flag to true
 * - Sets isBankVerified to true only if bank details are verified via Paystack
 * - Returns updated seller information
 *
 * @param {string} sellerId - The ID of the seller to add/update bank details for
 * @param {Object} bankDetails - The bank details object containing all required fields
 * @param {boolean} isVerified - Optional flag indicating if bank details were verified via Paystack
 * @returns {Promise<Object>} Updated seller object with new bank details
 * @throws {ValidationError} If bank details validation fails
 * @throws {Error} If seller not found
 */
async function addBankDetails(sellerId, bankDetails, isVerified = false) {
  // Step 1: Find the seller by ID to check existence and current status
  const seller = await sellerRepository.findById(sellerId);
  
  // Step 2: Check if seller exists
  if (!seller) {
    throw new Error('Seller not found');
  }

  // Step 3: Allow direct update of bank details (no approval required)
  // Removed change request requirement - sellers can now directly update their bank details
  // as long as they go through the verification process

  // Step 4: Validate bank details using the validator (only if bankDetails is provided)
  if (bankDetails) {
    addBankDetailsValidator.validateBankDetails(bankDetails);
  }

  // Step 5: Update seller with new bank details (even if bankDetails is undefined/null)
  seller.bankDetails = bankDetails;
  seller.hasFilledBankDetails = !!bankDetails;
  
  // Step 6: Set bank verification status based on Paystack verification
  // Only mark as verified if explicitly verified via Paystack API
  const verificationStatus = isVerified && !!bankDetails;
  seller.isBankVerified = verificationStatus;
  
  // Debug logging to track verification status
  console.log('💳 Bank Details Update:', {
    sellerId: seller._id,
    hasBankDetails: !!bankDetails,
    isVerified: isVerified,
    finalVerificationStatus: verificationStatus,
    accountNumber: bankDetails?.accountNumber,
    bankName: bankDetails?.bankName
  });

  // Step 7: Save the updated seller using the repository
  const updatedSeller = await sellerRepository.save(seller);
  
  // Log after save to confirm
  console.log('✅ Bank details saved. isBankVerified:', updatedSeller.isBankVerified);

  // Step 8: Return the updated seller data
  return updatedSeller;
}

module.exports = {
  addBankDetails
};
