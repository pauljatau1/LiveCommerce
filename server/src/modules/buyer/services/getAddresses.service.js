/**
 * Get Addresses Service
 *
 * This service handles the business logic for retrieving a buyer's shipping addresses.
 * It provides secure address access and validation to ensure buyers can only access
 * their own address information.
 *
 * The service ensures that:
 * - Address access is properly validated and secured
 * - Only the address owner can access address information
 * - Address information is retrieved efficiently
 * - Error handling maintains system integrity
 *
 * Address Retrieval Flow:
 * - Buyer existence validation
 * - Address retrieval with complete details
 * - Security verification and access control
 * - Success response with address information
 *
 * Security Features:
 * - Buyer existence validation
 * - Address ownership verification
 * - Access control enforcement
 * - Error handling without information leakage
 * - Secure address data retrieval
 *
 * Address Management:
 * - Retrieves all shipping addresses for buyer
 * - Handles empty address lists gracefully
 * - Maintains address data integrity
 * - Provides consistent response format
 *
 * @module getAddressesService
 */

const buyerRepository = require('../repositories/buyer.repository');
const NotFoundException = require('../../../utils/errors/NotFoundException');

/**
 * Retrieves all shipping addresses for a buyer - Main business logic function.
 *
 * This is the primary service function that orchestrates the complete
 * address retrieval process. It handles buyer validation, address access,
 * and secure address data retrieval.
 *
 * Business Logic Flow:
 * 1. Validates that the buyer exists in the database
 * 2. Retrieves all shipping addresses for the buyer
 * 3. Checks if any address is active, if not sets the first address as active by default
 * 4. Handles empty address lists gracefully
 * 5. Returns formatted address information
 *
 * Security Features:
 * - Buyer existence validation before processing
 * - Address ownership verification
 * - Secure address data retrieval
 * - Error handling without information leakage
 * - Access control enforcement
 *
 * Address Data:
 * - Complete shipping address information
 * - Address labels and types
 * - Contact information
 * - Address preferences
 * - Default address indicators
 *
 * Error Handling:
 * - NotFoundException for non-existent buyers
 * - Database operation errors
 * - Proper error propagation to controller
 * - Graceful handling of empty address lists
 *
 * @param {string} buyerId - The buyer's ID to retrieve addresses for
 * @returns {Promise<Array>} Array of shipping addresses with complete information
 *   Each address contains:
 *   - _id: {string} - Address ID
 *   - label: {string} - Address label (e.g., "Home", "Work")
 *   - firstName: {string} - Recipient first name
 *   - lastName: {string} - Recipient last name
 *   - phoneNumber: {string} - Contact phone number
 *   - address: {string} - Street address
 *   - city: {string} - City name
 *   - state: {string} - State/province
 *   - country: {string} - Country name
 *   - postalCode: {string} - Postal/ZIP code
 *   - isDefault: {boolean} - Whether this is the default address
 *   - isActive: {boolean} - Whether this is the active address for checkout
 *   - createdAt: {Date} - Address creation timestamp
 *   - updatedAt: {Date} - Address last update timestamp
 * @throws {NotFoundException} If buyer is not found
 * @throws {Error} If database operations fail
 *
 * @example
 * // Get addresses for buyer
 * const addresses = await getAddresses('507f1f77bcf86cd799439011');
 * // Returns: [
 * //   {
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
 * //     ...
 * //   }
 * // ]
 *
 * @example
 * // Empty address list
 * const addresses = await getAddresses('507f1f77bcf86cd799439011');
 * // Returns: [] (empty array)
 *
 * @example
 * // Buyer not found
 * try {
 *   await getAddresses('nonexistent-buyer-id');
 * } catch (error) {
 *   // error instanceof NotFoundException
 *   // error.message: 'Buyer not found'
 * }
 */
async function getAddresses(buyerId) {
  // Step 1: Get buyer with shipping addresses using repository
  // This fetches the buyer record with all associated shipping addresses
  const buyer = await buyerRepository.findByIdWithShippingAddresses(buyerId);

  // Step 2: Check if buyer exists
  // This prevents processing for non-existent buyers
  if (!buyer) {
    throw new NotFoundException('Buyer not found');
  }

  // Step 3: Check if there are any addresses and if any are active
  // If no addresses are active, set the first address as active by default
  const addresses = buyer.shippingAddresses || [];
  if (addresses.length > 0) {
    const hasActiveAddress = addresses.some(addr => addr.isActive === true);
    
    if (!hasActiveAddress) {
      // Set the first address as active by default
      const firstAddressId = addresses[0]._id;
      await buyerRepository.setActiveShippingAddress(buyerId, firstAddressId);
      
      // Refetch the buyer to get the updated addresses
      const updatedBuyer = await buyerRepository.findByIdWithShippingAddresses(buyerId);
      buyer.shippingAddresses = updatedBuyer.shippingAddresses;
    }
  }

  // Step 4: Default missing contact fields on each address from buyer profile
  // This ensures older addresses created before contact fields were added still expose contact info
  const firstName = buyer.firstName;
  const lastName = buyer.lastName;
  const email = buyer.email;
  const phoneNumber = buyer.phoneNumber;

  const addressesWithDefaults = (buyer.shippingAddresses || []).map(addr => ({
    ...addr.toObject?.() ? addr.toObject() : addr,
    firstName: addr.firstName ?? firstName,
    lastName: addr.lastName ?? lastName,
    email: addr.email ?? email,
    phoneNumber: addr.phoneNumber ?? phoneNumber
  }));

  return addressesWithDefaults;
}

module.exports = {
  getAddresses,
}; 