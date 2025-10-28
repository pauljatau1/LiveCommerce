/**
 * Set Active Address Service
 *
 * This service handles the business logic for setting a shipping address as active
 * for checkout purposes. It ensures that only one address can be active at a time
 * and provides secure address management functionality.
 *
 * The service ensures that:
 * - Address activation is properly validated before processing
 * - Only valid buyers can set their addresses as active
 * - Address ownership is verified before activation
 * - Only one address can be active at a time
 * - Error handling maintains system integrity
 *
 * Address Activation Flow:
 * - Input validation and address data verification
 * - Buyer existence validation
 * - Address ownership verification
 * - Deactivation of all other addresses
 * - Activation of the specified address
 * - Success response with confirmation
 *
 * Security Features:
 * - Comprehensive input validation
 * - Buyer existence verification
 * - Address ownership validation
 * - Address data sanitization
 * - Error handling without information leakage
 * - Secure address activation
 *
 * Address Management:
 * - Sets specified address as active
 * - Deactivates all other addresses for the buyer
 * - Maintains address data integrity
 * - Provides consistent response format
 * - Handles address validation requirements
 *
 * @module setActiveAddressService
 */

const buyerRepository = require('../repositories/buyer.repository');
const setActiveAddressValidator = require('../validators/setActiveAddress.validator');
const NotFoundException = require('../../../utils/errors/NotFoundException');

/**
 * Sets a shipping address as active for a buyer - Main business logic function.
 *
 * This is the primary service function that orchestrates the complete
 * address activation process. It handles validation, buyer verification,
 * address ownership, and secure address activation.
 *
 * Business Logic Flow:
 * 1. Validates the input data using comprehensive validation
 * 2. Checks if buyer exists in the database
 * 3. Verifies address ownership and existence
 * 4. Deactivates all other addresses for the buyer
 * 5. Activates the specified address
 * 6. Returns success confirmation with updated address
 *
 * Security Features:
 * - Comprehensive input validation before processing
 * - Buyer existence verification
 * - Address ownership validation
 * - Address data sanitization and validation
 * - Secure address activation in database
 * - Error handling without information leakage
 *
 * Address Verification:
 * - Validates buyer existence before processing
 * - Checks address ownership and existence
 * - Prevents unauthorized address activation
 * - Ensures data integrity during activation
 * - Maintains address list consistency
 *
 * Error Handling:
 * - Validation errors for invalid input data
 * - NotFoundException for non-existent buyers
 * - NotFoundException for non-existent addresses
 * - Database operation errors
 * - Proper error propagation to controller
 *
 * @param {string} buyerId - The buyer's ID to set active address for
 * @param {string} addressId - The address ID to set as active
 * @returns {Promise<Object>} Success response with updated address
 *   - message: {string} - Success message confirming address activation
 *   - address: {Object} - Updated address object with isActive set to true
 *     - _id: {string} - Address ID
 *     - addressType: {string} - Address type
 *     - firstName: {string} - Recipient first name
 *     - lastName: {string} - Recipient last name
 *     - email: {string} - Contact email
 *     - phoneNumber: {string} - Contact phone number
 *     - country: {string} - Country name
 *     - state: {string} - State/province
 *     - city: {string} - City name
 *     - addressLine1: {string} - Primary address line
 *     - addressLine2: {string} - Secondary address line
 *     - zipCode: {string} - Postal/ZIP code
 *     - isActive: {boolean} - Active address indicator (true)
 * @throws {ValidationError} If address data validation fails
 * @throws {NotFoundException} If buyer or address is not found
 * @throws {Error} If database operations fail
 *
 * @example
 * // Set address as active for buyer
 * const result = await setActiveAddress('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012');
 * // Returns: {
 * //   message: 'Address set as active successfully',
 * //   address: {
 * //     _id: '507f1f77bcf86cd799439012',
 * //     addressType: 'home',
 * //     firstName: 'John',
 * //     lastName: 'Doe',
 * //     email: 'john@example.com',
 * //     phoneNumber: '+1234567890',
 * //     country: 'Nigeria',
 * //     state: 'Lagos',
 * //     city: 'Lagos',
 * //     addressLine1: '123 Main Street',
 * //     addressLine2: 'Apt 4B',
 * //     zipCode: '100001',
 * //     isActive: true
 * //   }
 * // }
 *
 * @example
 * // Failed validation - invalid address data
 * try {
 *   await setActiveAddress('invalid-buyer-id', 'invalid-address-id');
 * } catch (error) {
 *   // error instanceof ValidationError
 *   // error.errors contains validation error details
 * }
 *
 * @example
 * // Address not found
 * try {
 *   await setActiveAddress('507f1f77bcf86cd799439011', 'nonexistent-address-id');
 * } catch (error) {
 *   // error instanceof NotFoundException
 *   // error.message: 'Address not found'
 * }
 */
async function setActiveAddress(buyerId, addressId) {
  // Step 1: Validate input data using the validator
  // This ensures address ID and buyer ID meet validation requirements
  await setActiveAddressValidator.validateSetActiveAddressData({ addressId, buyerId });

  // Step 2: Check if buyer exists
  // This prevents processing for non-existent buyers
  const buyer = await buyerRepository.findById(buyerId);
  if (!buyer) {
    throw new NotFoundException('Buyer not found');
  }

  // Step 3: Check if address exists for the buyer
  // This ensures the address belongs to the buyer before activation
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

  // Step 5: Set address as active and deactivate others using repository
  // This updates the specified address to active and sets all others to inactive
  const updatedBuyer = await buyerRepository.setActiveShippingAddress(buyerId, addressId);

  // Step 6: Verify activation was successful
  // This ensures the address was properly activated
  if (!updatedBuyer) {
    throw new Error('Failed to set address as active');
  }

  // Step 7: Find the updated active address
  // This extracts the newly activated address from the updated buyer
  const activeAddress = updatedBuyer.shippingAddresses.find(
    addr => addr._id.toString() === addressId
  );

  if (!activeAddress) {
    throw new Error('Failed to retrieve updated address');
  }

  // Step 8: Return success confirmation with updated address
  return {
    message: 'Address set as active successfully',
    address: activeAddress
  };
}

module.exports = {
  setActiveAddress,
};
