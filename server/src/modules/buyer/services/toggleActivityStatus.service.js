const buyerRepository = require('../repositories/buyer.repository');
const { validateToggleActivityStatusData } = require('../validators/toggleActivityStatus.validator');
const NotFoundException = require('../../../utils/errors/NotFoundException');

/**
 * Toggle the activity status of a buyer.
 *
 * This function:
 * - Validates the buyer ID
 * - Gets the current activity status
 * - Toggles the buyer's isActive status
 * - Returns the updated status and a success message
 *
 * @param {string} buyerId - The buyer's ID
 * @returns {Promise<Object>} Object containing isActive status and message
 * @throws {NotFoundException} If buyer is not found
 * @throws {ValidationError} If buyer ID is invalid
 */
async function toggleActivityStatus(buyerId) {
  // Validate input parameters
  await validateToggleActivityStatusData({ buyerId });

  // Get current activity status
  const currentBuyer = await buyerRepository.getActivityStatus(buyerId);
  if (!currentBuyer) {
    throw new NotFoundException('Buyer not found');
  }

  // Toggle the status
  const newStatus = !currentBuyer.isActive;

  // Update activity status using repository
  const updatedBuyer = await buyerRepository.toggleActivityStatus(buyerId, newStatus);

  if (!updatedBuyer) {
    throw new NotFoundException('Buyer not found');
  }

  return {
    isActive: updatedBuyer.isActive,
    message: `Account successfully ${updatedBuyer.isActive ? 'activated' : 'deactivated'}`
  };
}

module.exports = {
  toggleActivityStatus
};
