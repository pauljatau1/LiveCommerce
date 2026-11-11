/**
 * Add Business Information Service
 *
 * This service handles the business logic for adding business contact and address information
 * to a seller's profile. It processes business information updates including business email,
 * business number, and business address details.
 *
 * Business Logic:
 * - Validates business information data structure
 * - Updates seller business contact information (businessEmail, businessNumber)
 * - Updates seller business address information (businessAddress)
 * - Updates completion flags for business address
 * - Ensures data integrity and consistency
 * - Provides comprehensive error handling
 *
 * Data Processing:
 * - Updates seller business contact and address information
 * - Maintains completion status flags
 * - Preserves existing seller data while updating specific fields
 * - Ensures proper data validation and sanitization
 *
 * @module addBusinessInformationService
 */

const sellerRepository = require('../repositories/seller.repository');
const addBusinessInformationValidator = require('../validators/addBusinessInformation.validator');
const { normalizePhoneNumber } = require('../../../helpers/formatters');

/**
 * Update seller business information.
 *
 * This function updates the seller's business contact and address information
 * including business email, business number, and business address details.
 *
 * Business Logic:
 * - Updates business contact information (email and phone)
 * - Updates business address information
 * - Maintains completion status flags
 * - Preserves existing seller data
 * - Ensures data consistency
 *
 * @param {string} sellerId - The seller's ID
 * @param {Object} businessInformation - The business information to update
 * @param {string} businessInformation.businessEmail - The business email address
 * @param {string} businessInformation.businessNumber - The business phone number
 * @param {Object} businessInformation.businessAddress - The business address details
 * @returns {Object} Updated seller data with business information
 * @throws {Error} If seller is not found or update fails
 */
async function updateSellerBusinessInformation(sellerId, businessInformation) {
  // Step 1: Retrieve seller information from repository
  // This ensures we have the latest seller information
  const seller = await sellerRepository.findById(sellerId);
  if (!seller) {
    throw new Error('Seller not found');
  }

  // Step 2: Update business contact information
  // This updates the seller's business email and phone number
  // Normalize phone number to ensure consistent format (without leading 0)
  seller.businessEmail = businessInformation.businessEmail;
  seller.businessNumber = normalizePhoneNumber(businessInformation.businessNumber);

  // Step 3: Update business address information
  // This updates the seller's business address details
  seller.businessAddress = businessInformation.businessAddress;

  // Step 4: Update completion flags
  // This maintains the completion status for business address
  seller.hasFilledBusinessAddress = !!(businessInformation.businessAddress &&
    businessInformation.businessAddress.addressLine1 &&
    businessInformation.businessAddress.addressLine1.trim() !== '');

  // Step 5: Save the updated seller record
  // This persists the business information changes
  const updatedSeller = await sellerRepository.save(seller);

  // Step 6: Return the updated seller data
  // This provides the caller with the updated seller information
  return updatedSeller;
}

/**
 * Add business information to seller profile.
 *
 * This function processes business information addition requests,
 * validates the data, and updates the seller's profile.
 *
 * Business Logic:
 * - Validates business information data using the validator
 * - Updates seller business contact and address information
 * - Maintains completion status flags
 * - Ensures data integrity and consistency
 *
 * Data Processing:
 * - Validates all required fields are present and valid
 * - Updates seller business contact and address information
 * - Maintains completion status flags
 * - Preserves existing seller data while updating specific fields
 *
 * @param {string} sellerId - The seller's ID
 * @param {Object} businessInformation - The business information to add
 * @param {string} businessInformation.businessEmail - The business email address
 * @param {string} businessInformation.businessNumber - The business phone number
 * @param {Object} businessInformation.businessAddress - The business address details
 * @returns {Object} Response object with updated seller data
 * @throws {Error} If validation fails or seller is not found
 */
async function addBusinessInformation(sellerId, businessInformation) {
  if (businessInformation.businessAddress?.state) require('../../../services/serviceArea').requireState(businessInformation.businessAddress?.state, true);

  // Step 1: Validate business information data using the validator
  // This ensures all required fields are present and valid
  addBusinessInformationValidator.validateAddBusinessInformationData(businessInformation);

  // Step 2: Update seller business information
  // This processes the business information and updates the seller record
  const updatedSeller = await updateSellerBusinessInformation(sellerId, businessInformation);

  // Step 3: Return success response with updated seller data
  // This provides the caller with the processing result
  return {
    message: 'Business information added successfully',
    seller: updatedSeller
  };
}

module.exports = {
  addBusinessInformation,
};
