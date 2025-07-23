const buyerRepository = require('../repositories/buyer.repository');
const addAddressValidator = require('../validators/addAddress.validator');
const NotFoundException = require('../../../utils/errors/NotFoundException');

/**
 * Adds a new shipping address to a buyer.
 *
 * This function:
 * - Validates the address data using the validator
 * - Checks if buyer exists
 * - Adds the new address to the buyer's shipping addresses
 * - Returns the newly added address
 *
 * @param {string} buyerId - The buyer's ID
 * @param {Object} addressData - The address data to add
 * @returns {Promise<Object>} The newly added address
 */
async function addAddress(buyerId, addressData) {
  // Validate address data
  await addAddressValidator.validateAddAddressData(addressData, buyerId);

  // Add new address to buyer
  const updatedBuyer = await buyerRepository.addShippingAddress(buyerId, addressData);

  if (!updatedBuyer) {
    throw new NotFoundException('Buyer not found');
  }

  // Return the newly added address
  const addedAddress = updatedBuyer.shippingAddresses[updatedBuyer.shippingAddresses.length - 1];

  return {
    message: 'Address added successfully',
    address: addedAddress
  };
}

module.exports = {
  addAddress,
}; 