const buyerRepository = require('../repositories/buyer.repository');
const updateAddressValidator = require('../validators/updateAddress.validator');
const NotFoundException = require('../../../utils/errors/NotFoundException');

/**
 * Helper to get updated address or throw if not found.
 * @param {Object} updatedBuyer
 * @param {string} addressId
 * @returns {Object} updatedAddress
 * @throws {NotFoundException}
 */
function getUpdatedAddressOrThrow(updatedBuyer, addressId) {
  const updatedAddress = updatedBuyer.shippingAddresses.find(
    addr => addr._id.toString() === addressId
  );
  if (!updatedAddress) {
    throw new NotFoundException('Address not found');
  }
  return updatedAddress;
}

/**
 * Updates a shipping address for a buyer.
 *
 * @param {string} buyerId - The buyer's ID
 * @param {string} addressId - The address ID to update
 * @param {Object} updateData - The address data to update
 * @returns {Promise<Object>} The updated address
 */
async function updateAddress(buyerId, addressId, updateData) {
  await updateAddressValidator.validateUpdateAddressData(updateData, buyerId, addressId);
  const updatedBuyer = await buyerRepository.updateShippingAddress(buyerId, addressId, updateData);
  if (!updatedBuyer) {
    throw new NotFoundException('Buyer not found');
  }
  const updatedAddress = getUpdatedAddressOrThrow(updatedBuyer, addressId);
  return {
    message: 'Address updated successfully',
    address: updatedAddress
  };
}

module.exports = {
  updateAddress,
}; 