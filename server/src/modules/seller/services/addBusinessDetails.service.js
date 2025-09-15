/**
 * Add Business Details Service
 *
 * This service handles the business logic for adding business details to a seller's profile.
 * It processes business information updates, validates data, and updates seller records.
 *
 * Business Logic:
 * - Validates business details data structure
 * - Updates seller business information (businessName, businessType, taxInformation)
 * - Updates completion flags for business address and verification documents
 * - Ensures data integrity and consistency
 * - Provides comprehensive error handling
 *
 * Data Processing:
 * - Updates seller business profile information
 * - Maintains completion status flags
 * - Preserves existing seller data while updating specific fields
 * - Ensures proper data validation and sanitization
 *
 * @module addBusinessDetailsService
 */

const sellerRepository = require('../repositories/seller.repository');
const addBusinessDetailsValidator = require('../validators/addBusinessDetails.validator');

/**
 * Update seller business details.
 *
 * This function updates the seller's business information including
 * business name, type, and tax information.
 *
 * Business Logic:
 * - Updates business profile information
 * - Maintains completion status flags
 * - Preserves existing seller data
 * - Ensures data consistency
 *
 * @param {string} sellerId - The seller's ID
 * @param {Object} businessDetails - The business details to update
 * @param {string} businessDetails.businessName - The business name
 * @param {string} businessDetails.businessType - The business type
 * @param {string} businessDetails.taxInformation - The tax information
 * @returns {Object} Updated seller data with business details
 * @throws {Error} If seller is not found or update fails
 */
async function updateSellerBusinessDetails(sellerId, businessDetails) {
  // Step 1: Retrieve seller information from repository
  // This ensures we have the latest seller information
  const seller = await sellerRepository.findById(sellerId);
  if (!seller) {
    throw new Error('Seller not found');
  }

  // Step 2: Update business details
  // This updates the seller's business profile information
  seller.businessName = businessDetails.businessName;
  seller.businessType = businessDetails.businessType;
  seller.taxInformation = businessDetails.taxInformation;

  // Step 3: Update completion flags
  // This maintains the completion status for business address and verification documents
  seller.hasFilledBusinessAddress = !!seller.businessAddress;
  seller.hasFilledVerificationDocuments = !!(seller.verificationDocuments && seller.verificationDocuments.documents && seller.verificationDocuments.documents.length);

  // Step 4: Save the updated seller record
  // This persists the business details changes
  const updatedSeller = await sellerRepository.save(seller);

  // Step 5: Return the updated seller data
  // This provides the caller with the updated seller information
  return updatedSeller;
}

/**
 * Add business details to seller profile.
 *
 * This function processes business details addition requests,
 * validates the data, and updates the seller's profile.
 *
 * Business Logic:
 * - Validates business details data using the validator
 * - Updates seller business information
 * - Maintains completion status flags
 * - Ensures data integrity and consistency
 *
 * Data Processing:
 * - Validates all required fields are present and valid
 * - Updates seller business profile information
 * - Maintains completion status flags
 * - Preserves existing seller data while updating specific fields
 *
 * @param {string} sellerId - The seller's ID
 * @param {Object} businessDetails - The business details to add
 * @param {string} businessDetails.businessName - The business name
 * @param {string} businessDetails.businessType - The business type
 * @param {string} businessDetails.taxInformation - The tax information
 * @returns {Object} Response object with updated seller data
 * @throws {Error} If validation fails or seller is not found
 */
async function addBusinessDetails(sellerId, businessDetails) {
  // Step 1: Validate business details data using the validator
  // This ensures all required fields are present and valid
  addBusinessDetailsValidator.validateAddBusinessDetailsData(businessDetails);

  // Step 2: Update seller business details
  // This processes the business details and updates the seller record
  const updatedSeller = await updateSellerBusinessDetails(sellerId, businessDetails);

  // Step 3: Return success response with updated seller data
  // This provides the caller with the processing result
  return {
    message: 'Business details added successfully',
    seller: updatedSeller
  };
}

module.exports = {
  addBusinessDetails,
};
