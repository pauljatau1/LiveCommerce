/**
 * Select Account Type Service
 *
 * This service handles the business logic for seller account type selection.
 * It provides functionality to:
 * - Validate input data through dedicated validators
 * - Update seller account type in the database
 * - Check and update profile completion status
 * - Maintain data integrity and consistency
 *
 * The service ensures that account type selection is processed securely
 * and efficiently while maintaining proper business logic separation.
 *
 * @module selectAccountTypeService
 */

const sellerRepository = require('../repositories/seller.repository');
const selectAccountTypeValidator = require('../validators/selectAccountType.validator');
const NotFoundException = require('../../../utils/errors/NotFoundException');

/**
 * Helper function to check if the seller profile is complete.
 *
 * This function evaluates various profile fields to determine
 * if the seller has completed their profile setup. It checks
 * essential business information required for full functionality.
 *
 * Business Logic:
 * - Verifies account type selection
 * - Checks business name availability
 * - Validates business address presence
 * - Ensures bank details are provided
 * - Confirms category selection
 * - Verifies shipping options setup
 * - Checks warehouse address availability
 * - Validates store name presence
 *
 * @param {Object} seller - Seller object with profile information
 * @param {string} newAccountType - The new account type being set
 * @returns {boolean} True if profile is complete, false otherwise
 * @example
 * const isComplete = checkProfileCompletion(seller, 'business');
 * // Returns true if all required fields are present
 */
function checkProfileCompletion(seller, newAccountType) {
  const hasAccountType = Boolean(newAccountType);
  const hasBusinessName = Boolean(seller.businessName);
  const hasBusinessAddress = Boolean(seller.businessAddress);
  const hasBankDetails = Boolean(seller.bankDetails);
  const hasCategories = Boolean(seller.categories && seller.categories.length > 0);
  const hasShippingOptions = Boolean(seller.shippingOptions);
  const hasWarehouseAddress = Boolean(seller.warehouseAddress);
  const hasStoreName = Boolean(seller.storeName);

  return (
    hasAccountType &&
    hasBusinessName &&
    hasBusinessAddress &&
    hasBankDetails &&
    hasCategories &&
    hasShippingOptions &&
    hasWarehouseAddress &&
    hasStoreName
  );
}

/**
 * Select account type for a seller.
 *
 * This function handles the complete account type selection process,
 * including validation, database updates, and profile completion checks.
 * It ensures that the account type is properly set and profile
 * completion status is updated accordingly.
 *
 * Business Logic Flow:
 * 1. Validate input data through dedicated validator
 * 2. Retrieve seller information from database
 * 3. Update account type field
 * 4. Check and update profile completion status
 * 5. Save updated seller information
 * 6. Return updated seller data
 *
 * Security Considerations:
 * - Input validation prevents invalid account type selection
 * - Seller existence verification ensures data integrity
 * - Profile completion logic maintains business requirements
 * - Database operations are handled through repository layer
 *
 * @param {string} sellerId - The seller's ID
 * @param {Object} data - Request data containing accountType
 * @returns {Promise<Object>} Updated seller data with new account type
 * @throws {ValidationError} If input validation fails
 * @throws {NotFoundException} If seller is not found
 * @throws {Error} If database operation fails
 * @example
 * const updatedSeller = await selectAccountType("507f1f77bcf86cd799439011", { accountType: "business" });
 * // Returns seller object with updated account type and profile completion status
 */
async function selectAccountType(sellerId, data) {
  // Step 1: Validate input data through dedicated validator
  // This ensures data integrity and prevents invalid account type selection
  selectAccountTypeValidator.validateSelectAccountTypeData(data);

  // Step 2: Extract and normalize account type from validated data
  // Convert to lowercase for consistent storage and comparison
  const { accountType } = data;
  const lowerCaseAccountType = accountType.toLowerCase();

  // Step 3: Retrieve seller information from database
  // This verifies seller existence and gets current profile data
  const seller = await sellerRepository.findById(sellerId);
  if (!seller) {
    throw new NotFoundException('Seller not found');
  }

  // Step 4: Update account type field with validated value
  // This sets the selected account type for the seller
  seller.accountType = lowerCaseAccountType;

  // Step 5: Check and update profile completion status
  // This evaluates if the seller has completed all required profile fields
  // Pass the new account type to ensure correct evaluation
  seller.isProfileComplete = checkProfileCompletion(seller, lowerCaseAccountType);

  // Step 6: Save updated seller information to database
  // This persists the account type selection and profile completion status
  const updatedSeller = await sellerRepository.save(seller);

  // Step 7: Return updated seller data for response
  // This provides confirmation of successful account type selection
  return updatedSeller;
}

module.exports = {
  selectAccountType
};
