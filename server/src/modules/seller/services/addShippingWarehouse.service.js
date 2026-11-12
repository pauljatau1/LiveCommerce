/**
 * Add Shipping Warehouse Service
 *
 * This service handles the business logic for adding shipping and warehouse information
 * to a seller's profile. It processes shipping options and warehouse details updates
 * including shipping methods, return policies, and warehouse address information.
 *
 * Business Logic:
 * - Validates shipping and warehouse information data structure
 * - Updates seller shipping options (shippingMethod, returnsAndExchangePolicy)
 * - Updates seller warehouse details (name, contactNumber, address)
 * - Updates completion flags for warehouse address
 * - Ensures data integrity and consistency
 * - Provides comprehensive error handling
 *
 * Data Processing:
 * - Updates seller shipping and warehouse information
 * - Maintains completion status flags
 * - Preserves existing seller data while updating specific fields
 * - Ensures proper data validation and sanitization
 *
 * @module addShippingWarehouseService
 */

const sellerRepository = require('../repositories/seller.repository');
const addShippingWarehouseValidator = require('../validators/addShippingWarehouse.validator');

/**
 * Update seller shipping and warehouse information.
 *
 * This function updates the seller's shipping options and warehouse details
 * including shipping methods, return policies, and warehouse address information.
 *
 * Business Logic:
 * - Updates shipping options information
 * - Updates warehouse details information
 * - Maintains completion status flags
 * - Preserves existing seller data
 * - Ensures data consistency
 *
 * @param {string} sellerId - The seller's ID
 * @param {Object} shippingWarehouseData - The shipping and warehouse information to update
 * @param {Object} [shippingWarehouseData.shippingOptions] - The shipping options
 * @param {Object} [shippingWarehouseData.warehouseDetails] - The warehouse details
 * @returns {Object} Updated seller data with shipping and warehouse information
 * @throws {Error} If seller is not found or update fails
 */
async function updateSellerShippingWarehouse(sellerId, shippingWarehouseData) {
  if (shippingWarehouseData.warehouseDetails?.address?.state) require('../../../services/serviceArea').requireState(shippingWarehouseData.warehouseDetails?.address?.state, true);

  // Step 1: Retrieve seller information from repository
  // This ensures we have the latest seller information
  const seller = await sellerRepository.findById(sellerId);
  if (!seller) {
    throw new Error('Seller not found');
  }

  // Step 2: Update shipping options if provided
  // This updates the seller's shipping options information
  if (shippingWarehouseData.shippingOptions !== undefined) {
    seller.shippingOptions = shippingWarehouseData.shippingOptions;
  }

  if (shippingWarehouseData.warehouseDetails?.address) Object.assign(shippingWarehouseData.warehouseDetails.address, require('../../../services/areaDirectory').validateArea(shippingWarehouseData.warehouseDetails.address));

  // Step 3: Update warehouse details if provided
  // This updates the seller's warehouse details information
  if (shippingWarehouseData.warehouseDetails !== undefined) {
    seller.warehouseDetails = shippingWarehouseData.warehouseDetails;
  }

  // Step 4: Update completion flags
  // This maintains the completion status for warehouse address
  if (shippingWarehouseData.warehouseDetails !== undefined) {
    seller.hasFilledWarehouseAddress = !!(shippingWarehouseData.warehouseDetails &&
      shippingWarehouseData.warehouseDetails.address &&
      shippingWarehouseData.warehouseDetails.address.addressLine1 &&
      shippingWarehouseData.warehouseDetails.address.addressLine1.trim() !== '');
  }

  // Step 5: Save the updated seller record
  // This persists the shipping and warehouse information changes
  const updatedSeller = await sellerRepository.save(seller);

  // Step 6: Return the updated seller data
  // This provides the caller with the updated seller information
  return updatedSeller;
}

/**
 * Add shipping and warehouse information to seller profile.
 *
 * This function processes shipping and warehouse information addition requests,
 * validates the data, and updates the seller's profile.
 *
 * Business Logic:
 * - Validates shipping and warehouse information data using the validator
 * - Updates seller shipping options and warehouse details information
 * - Maintains completion status flags
 * - Ensures data integrity and consistency
 *
 * Data Processing:
 * - Validates all provided fields are valid
 * - Updates seller shipping options and warehouse details information
 * - Maintains completion status flags
 * - Preserves existing seller data while updating specific fields
 *
 * @param {string} sellerId - The seller's ID
 * @param {Object} shippingWarehouseData - The shipping and warehouse information to add
 * @param {Object} [shippingWarehouseData.shippingOptions] - The shipping options
 * @param {Object} [shippingWarehouseData.warehouseDetails] - The warehouse details
 * @returns {Object} Response object with updated seller data
 * @throws {Error} If validation fails or seller is not found
 */
async function addShippingWarehouse(sellerId, shippingWarehouseData) {
  // Step 1: Validate shipping and warehouse information data using the validator
  // This ensures all provided fields are valid
  addShippingWarehouseValidator.validateAddShippingWarehouseData(shippingWarehouseData);

  // Step 2: Update seller shipping and warehouse information
  // This processes the shipping and warehouse information and updates the seller record
  const updatedSeller = await updateSellerShippingWarehouse(sellerId, shippingWarehouseData);

  // Step 3: Return success response with updated seller data
  // This provides the caller with the processing result
  return {
    message: 'Shipping and warehouse information added successfully',
    seller: {
      shippingOptions: updatedSeller.shippingOptions,
      warehouseDetails: updatedSeller.warehouseDetails
    }
  };
}

module.exports = {
  addShippingWarehouse,
};
