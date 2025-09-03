/**
 * Update Address Service
 *
 * This service handles the business logic for updating existing shipping addresses
 * for a buyer. It provides secure address management and validation to ensure
 * data integrity and proper address handling.
 *
 * The service ensures that:
 * - Address data is properly validated before processing
 * - Only valid buyers can update their addresses
 * - Address ownership is verified
 * - Address information is updated securely
 * - Error handling maintains system integrity
 *
 * Address Update Flow:
 * - Input validation and address data verification
 * - Buyer existence validation
 * - Address ownership verification
 * - Address update in buyer's shipping addresses
 * - Success response with updated address details
 *
 * Security Features:
 * - Comprehensive input validation
 * - Buyer existence verification
 * - Address ownership validation
 * - Address data sanitization
 * - Error handling without information leakage
 * - Secure address storage
 *
 * Address Management:
 * - Updates existing shipping addresses for buyer
 * - Maintains address data integrity
 * - Provides consistent response format
 * - Handles address validation requirements
 *
 * @module updateAddressService
 */

const buyerRepository = require('../repositories/buyer.repository');
const updateAddressValidator = require('../validators/updateAddress.validator');
const NotFoundException = require('../../../utils/errors/NotFoundException');

/**
 * Helper to get updated address or throw if not found.
 *
 * This helper function extracts the updated address from the buyer's
 * shipping addresses array and validates that the address exists.
 *
 * Address Extraction:
 * - Searches for address by ID in buyer's shipping addresses
 * - Validates address existence after update
 * - Throws NotFoundException if address not found
 * - Returns the updated address object
 *
 * @param {Object} updatedBuyer - Buyer object with updated shipping addresses
 * @param {Array} updatedBuyer.shippingAddresses - Array of shipping addresses
 * @param {string} addressId - The address ID to find
 * @returns {Object} The updated address object
 * @throws {NotFoundException} If address is not found after update
 */
function getUpdatedAddressOrThrow(updatedBuyer, addressId) {
  // Step 1: Find the updated address by ID
  // This searches through the buyer's shipping addresses for the specific address
  const updatedAddress = updatedBuyer.shippingAddresses.find(
    addr => addr._id.toString() === addressId
  );
  
  // Step 2: Check if address exists
  // This prevents returning undefined if the address was not found
  if (!updatedAddress) {
    throw new NotFoundException('Address not found');
  }
  
  return updatedAddress;
}

/**
 * Updates a shipping address for a buyer - Main business logic function.
 *
 * This is the primary service function that orchestrates the complete
 * address update process. It handles validation, buyer verification,
 * address ownership, and secure address updates.
 *
 * Business Logic Flow:
 * 1. Validates the update data using comprehensive validation
 * 2. Checks if buyer exists in the database
 * 3. Updates the address in the buyer's shipping addresses
 * 4. Verifies address ownership and existence
 * 5. Returns the updated address with success confirmation
 *
 * Security Features:
 * - Comprehensive input validation before processing
 * - Buyer existence verification
 * - Address ownership validation
 * - Address data sanitization and validation
 * - Secure address storage in database
 * - Error handling without information leakage
 *
 * Address Data:
 * - Complete shipping address information
 * - Address labels and types
 * - Contact information
 * - Address preferences
 * - Default address indicators
 *
 * Error Handling:
 * - Validation errors for invalid address data
 * - NotFoundException for non-existent buyers
 * - NotFoundException for non-existent addresses
 * - Database operation errors
 * - Proper error propagation to controller
 *
 * @param {string} buyerId - The buyer's ID to update address for
 * @param {string} addressId - The address ID to update
 * @param {Object} updateData - The address data to update
 * @param {string} updateData.label - Address label (e.g., "Home", "Work")
 * @param {string} updateData.firstName - Recipient first name
 * @param {string} updateData.lastName - Recipient last name
 * @param {string} updateData.phoneNumber - Contact phone number
 * @param {string} updateData.address - Street address
 * @param {string} updateData.city - City name
 * @param {string} updateData.state - State/province
 * @param {string} updateData.country - Country name
 * @param {string} updateData.postalCode - Postal/ZIP code
 * @param {boolean} updateData.isDefault - Whether this is the default address
 * @returns {Promise<Object>} Success response with updated address
 *   - message: {string} - Success message confirming address update
 *   - address: {Object} - Complete updated address object with all details
 *     - _id: {string} - Address ID
 *     - label: {string} - Address label
 *     - firstName: {string} - Recipient first name
 *     - lastName: {string} - Recipient last name
 *     - phoneNumber: {string} - Contact phone number
 *     - address: {string} - Street address
 *     - city: {string} - City name
 *     - state: {string} - State/province
 *     - country: {string} - Country name
 *     - postalCode: {string} - Postal/ZIP code
 *     - isDefault: {boolean} - Default address indicator
 *     - createdAt: {Date} - Address creation timestamp
 *     - updatedAt: {Date} - Address last update timestamp
 * @throws {ValidationError} If address data validation fails
 * @throws {NotFoundException} If buyer or address is not found
 * @throws {Error} If database operations fail
 *
 * @example
 * // Update address for buyer
 * const result = await updateAddress('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012', {
 *   label: 'Work',
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   phoneNumber: '+1234567890',
 *   address: '456 Business Ave',
 *   city: 'New York',
 *   state: 'NY',
 *   country: 'USA',
 *   postalCode: '10002',
 *   isDefault: false
 * });
 * // Returns: {
 * //   message: 'Address updated successfully',
 * //   address: {
 * //     _id: '507f1f77bcf86cd799439012',
 * //     label: 'Work',
 * //     firstName: 'John',
 * //     lastName: 'Doe',
 * //     address: '456 Business Ave',
 * //     city: 'New York',
 * //     state: 'NY',
 * //     country: 'USA',
 * //     postalCode: '10002',
 * //     isDefault: false,
 * //     createdAt: '2023-01-01T00:00:00.000Z',
 * //     updatedAt: '2023-01-01T00:00:00.000Z'
 * //   }
 * // }
 *
 * @example
 * // Failed validation - invalid address data
 * try {
 *   await updateAddress('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012', {
 *     label: '', // Invalid empty label
 *     firstName: 'John'
 *   });
 * } catch (error) {
 *   // error instanceof ValidationError
 *   // error.errors contains validation error details
 * }
 */
async function updateAddress(buyerId, addressId, updateData) {
  // Step 1: Validate update data using the validator
  // This ensures all address fields meet validation requirements
  await updateAddressValidator.validateUpdateAddressData(updateData, buyerId, addressId);
  
  // Step 2: Update address in buyer using repository
  // This updates the specified address in the buyer's shipping addresses array
  const updatedBuyer = await buyerRepository.updateShippingAddress(buyerId, addressId, updateData);
  
  // Step 3: Check if buyer exists
  // This prevents processing for non-existent buyers
  if (!updatedBuyer) {
    throw new NotFoundException('Buyer not found');
  }
  
  // Step 4: Get and validate the updated address
  // This ensures the address was successfully updated and exists
  const updatedAddress = getUpdatedAddressOrThrow(updatedBuyer, addressId);
  
  return {
    message: 'Address updated successfully',
    address: updatedAddress
  };
}

module.exports = {
  updateAddress,
}; 