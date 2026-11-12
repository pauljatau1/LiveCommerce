/**
 * Add Address Service
 *
 * This service handles the business logic for adding new shipping addresses
 * to a buyer's account. It provides secure address management and validation
 * to ensure data integrity and proper address handling.
 *
 * The service ensures that:
 * - Address data is properly validated before processing
 * - Only valid buyers can add addresses
 * - Address information is stored securely
 * - Error handling maintains system integrity
 *
 * Address Addition Flow:
 * - Input validation and address data verification
 * - Buyer existence validation
 * - Address addition to buyer's shipping addresses
 * - Success response with new address details
 *
 * Security Features:
 * - Comprehensive input validation
 * - Buyer existence verification
 * - Address data sanitization
 * - Error handling without information leakage
 * - Secure address storage
 *
 * Address Management:
 * - Adds new shipping addresses to buyer account
 * - Maintains address data integrity
 * - Provides consistent response format
 * - Handles address validation requirements
 *
 * @module addAddressService
 */

const buyerRepository = require('../repositories/buyer.repository');
const addAddressValidator = require('../validators/addAddress.validator');
const NotFoundException = require('../../../utils/errors/NotFoundException');

/**
 * Adds a new shipping address to a buyer - Main business logic function.
 *
 * This is the primary service function that orchestrates the complete
 * address addition process. It handles validation, buyer verification,
 * and secure address storage.
 *
 * Business Logic Flow:
 * 1. Validates the address data using comprehensive validation
 * 2. Checks if buyer exists in the database
 * 3. Adds the new address to the buyer's shipping addresses
 * 4. If no addresses are active, sets the new address as active by default
 * 5. Returns the newly added address with success confirmation
 *
 * Security Features:
 * - Comprehensive input validation before processing
 * - Buyer existence verification
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
 * - Database operation errors
 * - Proper error propagation to controller
 *
 * @param {string} buyerId - The buyer's ID to add address for
 * @param {Object} addressData - The address data to add
 * @param {string} addressData.label - Address label (e.g., "Home", "Work")
 * @param {string} addressData.firstName - Recipient first name
 * @param {string} addressData.lastName - Recipient last name
 * @param {string} addressData.phoneNumber - Contact phone number
 * @param {string} addressData.address - Street address
 * @param {string} addressData.city - City name
 * @param {string} addressData.state - State/province
 * @param {string} addressData.country - Country name
 * @param {string} addressData.postalCode - Postal/ZIP code
 * @param {boolean} addressData.isDefault - Whether this is the default address
 * @returns {Promise<Object>} Success response with newly added address
 *   - message: {string} - Success message confirming address addition
 *   - address: {Object} - Complete address object with all details
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
 *     - isActive: {boolean} - Active address indicator for checkout
 *     - createdAt: {Date} - Address creation timestamp
 *     - updatedAt: {Date} - Address last update timestamp
 * @throws {ValidationError} If address data validation fails
 * @throws {NotFoundException} If buyer is not found
 * @throws {Error} If database operations fail
 *
 * @example
 * // Add new address for buyer
 * const result = await addAddress('507f1f77bcf86cd799439011', {
 *   label: 'Home',
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   phoneNumber: '+1234567890',
 *   address: '123 Main St',
 *   city: 'New York',
 *   state: 'NY',
 *   country: 'USA',
 *   postalCode: '10001',
 *   isDefault: true
 * });
 * // Returns: {
 * //   message: 'Address added successfully',
 * //   address: {
 * //     _id: '507f1f77bcf86cd799439012',
 * //     label: 'Home',
 * //     firstName: 'John',
 * //     lastName: 'Doe',
 * //     address: '123 Main St',
 * //     city: 'New York',
 * //     state: 'NY',
 * //     country: 'USA',
 * //     postalCode: '10001',
 * //     isDefault: true,
 * //     createdAt: '2023-01-01T00:00:00.000Z',
 * //     updatedAt: '2023-01-01T00:00:00.000Z'
 * //   }
 * // }
 *
 * @example
 * // Failed validation - invalid address data
 * try {
 *   await addAddress('507f1f77bcf86cd799439011', {
 *     label: '', // Invalid empty label
 *     firstName: 'John'
 *   });
 * } catch (error) {
 *   // error instanceof ValidationError
 *   // error.errors contains validation error details
 * }
 */
async function addAddress(buyerId, addressData) {
  if (addressData.state !== undefined) require('../../../services/serviceArea').requireState(addressData.state);

  // Step 1: Validate address data using the validator
  // This ensures all address fields meet validation requirements
  await addAddressValidator.validateAddAddressData(addressData, buyerId);

  // Step 2: Fetch buyer to allow defaulting missing contact fields
  // We default firstName, lastName, email, and phoneNumber from the buyer profile
  const buyer = await buyerRepository.findById(buyerId);
  if (!buyer) {
    throw new NotFoundException('Buyer not found');
  }

  // Step 3: Merge provided address data with buyer defaults for contact fields
  const mergedAddressData = {
    ...addressData,
    ...require('../../../services/areaDirectory').validateArea(addressData),
    firstName: addressData.firstName ?? buyer.firstName ?? undefined,
    lastName: addressData.lastName ?? buyer.lastName ?? undefined,
    email: addressData.email ?? buyer.email ?? undefined,
    phoneNumber: addressData.phoneNumber ?? buyer.phoneNumber ?? undefined
  };

  // Step 4: Add new address to buyer using repository
  // This adds the (potentially defaulted) address to the buyer's shipping addresses array
  const updatedBuyer = await buyerRepository.addShippingAddress(buyerId, mergedAddressData);

  // Step 5: Check if this is the first address or if no addresses are active
  // If so, set this new address as active by default
  const addresses = updatedBuyer.shippingAddresses || [];
  const hasActiveAddress = addresses.some(addr => addr.isActive === true);
  
  if (!hasActiveAddress && addresses.length > 0) {
    // Set the newly added address as active (it's the last one in the array)
    const newAddressId = addresses[addresses.length - 1]._id;
    await buyerRepository.setActiveShippingAddress(buyerId, newAddressId);
    
    // Refetch to get the updated address with isActive set to true
    const finalBuyer = await buyerRepository.findByIdWithShippingAddresses(buyerId);
    updatedBuyer.shippingAddresses = finalBuyer.shippingAddresses;
  }

  // Step 6: Return the newly added address
  // Extract the last address from the array (the newly added one)
  const addedAddress = updatedBuyer.shippingAddresses[updatedBuyer.shippingAddresses.length - 1];

  return {
    message: 'Address added successfully',
    address: addedAddress
  };
}

module.exports = {
  addAddress,
}; 