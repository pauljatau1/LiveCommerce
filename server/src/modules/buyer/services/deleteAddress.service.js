const buyerRepository = require('../repositories/buyer.repository');
const deleteAddressValidator = require('../validators/deleteAddress.validator');

/**
 * Deletes a shipping address for a buyer.
 *
 * This function:
 * - Validates the address ID and buyer existence
 * - Checks if the address exists for the buyer
 * - Deletes the address from the buyer's shipping addresses
 * - Returns a success message
 *
 * @param {string} buyerId - The buyer's ID
 * @param {string} addressId - The address ID to delete
 * @returns {Promise<Object>} Success message
 */
async function deleteAddress(buyerId, addressId) {
  // Validate address deletion data
  await deleteAddressValidator.validateDeleteAddressData(addressId, buyerId);

  // Delete address from buyer
  const updatedBuyer = await buyerRepository.deleteShippingAddress(buyerId, addressId);

  if (!updatedBuyer) {
    throw new Error('Failed to delete address');
  }

  return {
    message: 'Address deleted successfully'
  };
}

module.exports = {
  deleteAddress,
}; 