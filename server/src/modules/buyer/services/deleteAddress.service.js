/**
 * Delete Address Service
 *
 * This service handles the business logic for deleting shipping addresses
 * from a buyer's account. It provides secure address management and validation
 * to ensure data integrity and proper address handling.
 *
 * The service ensures that:
 * - Address deletion is properly validated before processing
 * - Only valid buyers can delete their addresses
 * - Address ownership is verified
 * - Address information is deleted securely
 * - Error handling maintains system integrity
 *
 * Address Deletion Flow:
 * - Input validation and address data verification
 * - Buyer existence validation
 * - Address ownership verification
 * - Address deletion from buyer's shipping addresses
 * - Success response with confirmation
 *
 * Security Features:
 * - Comprehensive input validation
 * - Buyer existence verification
 * - Address ownership validation
 * - Address data sanitization
 * - Error handling without information leakage
 * - Secure address deletion
 *
 * Address Management:
 * - Deletes existing shipping addresses for buyer
 * - Maintains address data integrity
 * - Provides consistent response format
 * - Handles address validation requirements
 *
 * @module deleteAddressService
 */

const buyerRepository = require('../repositories/buyer.repository');
const deleteAddressValidator = require('../validators/deleteAddress.validator');
const NotFoundException = require('../../../utils/errors/NotFoundException');

/**
 * Deletes a shipping address for a buyer - Main business logic function.
 *
 * This is the primary service function that orchestrates the complete
 * address deletion process. It handles validation, buyer verification,
 * address ownership, and secure address deletion.
 *
 * Business Logic Flow:
 * 1. Validates the input data using comprehensive validation
 * 2. Checks if buyer exists in the database
 * 3. Verifies address ownership and existence
 * 4. Deletes the address from buyer's shipping addresses
 * 5. Returns success confirmation
 *
 * Security Features:
 * - Comprehensive input validation before processing
 * - Buyer existence verification
 * - Address ownership validation
 * - Address data sanitization and validation
 * - Secure address deletion from database
 * - Error handling without information leakage
 *
 * Address Verification:
 * - Validates buyer existence before processing
 * - Checks address ownership and existence
 * - Prevents unauthorized address deletion
 * - Ensures data integrity during deletion
 * - Maintains address list consistency
 *
 * Error Handling:
 * - Validation errors for invalid input data
 * - NotFoundException for non-existent buyers
 * - NotFoundException for non-existent addresses
 * - Database operation errors
 * - Proper error propagation to controller
 *
 * @param {string} buyerId - The buyer's ID to delete address for
 * @param {string} addressId - The address ID to delete
 * @returns {Promise<Object>} Success response with confirmation message
 *   - message: {string} - Success message confirming address deletion
 * @throws {ValidationError} If address data validation fails
 * @throws {NotFoundException} If buyer or address is not found
 * @throws {Error} If database operations fail
 *
 * @example
 * // Delete address for buyer
 * const result = await deleteAddress('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012');
 * // Returns: {
 * //   message: 'Address deleted successfully'
 * // }
 *
 * @example
 * // Failed validation - invalid address data
 * try {
 *   await deleteAddress('invalid-buyer-id', 'invalid-address-id');
 * } catch (error) {
 *   // error instanceof ValidationError
 *   // error.errors contains validation error details
 * }
 *
 * @example
 * // Address not found
 * try {
 *   await deleteAddress('507f1f77bcf86cd799439011', 'nonexistent-address-id');
 * } catch (error) {
 *   // error instanceof NotFoundException
 *   // error.message: 'Address not found'
 * }
 */
async function deleteAddress(buyerId, addressId) {
  // Step 1: Validate input data using the validator
  // This ensures address ID and buyer ID meet validation requirements
  await deleteAddressValidator.validateDeleteAddressData({ addressId, buyerId });

  // Step 2: Check if buyer exists
  // This prevents processing for non-existent buyers
  const buyer = await buyerRepository.findById(buyerId);
  if (!buyer) {
    throw new NotFoundException('Buyer not found');
  }

  // Step 3: Check if address exists for the buyer
  // This ensures the address belongs to the buyer before deletion
  const buyerWithAddresses = await buyerRepository.findByIdWithShippingAddresses(buyerId);
  if (!buyerWithAddresses || !buyerWithAddresses.shippingAddresses) {
    throw new NotFoundException('Buyer not found');
  }

  // Step 4: Verify address ownership
  // This checks if the address exists in the buyer's address list
  const addressExists = buyerWithAddresses.shippingAddresses.some(
    addr => addr._id.toString() === addressId
  );

  if (!addressExists) {
    throw new NotFoundException('Address not found');
  }

  // Step 5: Delete address from buyer using repository
  // This removes the address from the buyer's shipping addresses array
  const updatedBuyer = await buyerRepository.deleteShippingAddress(buyerId, addressId);

  // Step 6: Verify deletion was successful
  // This ensures the address was properly deleted
  if (!updatedBuyer) {
    throw new Error('Failed to delete address');
  }

  // Step 7: Return success confirmation
  return {
    message: 'Address deleted successfully'
  };
}

module.exports = {
  deleteAddress,
}; 