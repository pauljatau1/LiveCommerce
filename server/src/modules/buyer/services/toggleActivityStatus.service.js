const buyerRepository = require('../repositories/buyer.repository');
const { validateToggleActivityStatusData } = require('../validators/toggleActivityStatus.validator');
const NotFoundException = require('../../../utils/errors/NotFoundException');

/**
 * Toggle the activity status of a buyer.
 *
 * This function:
 * - Validates the buyer ID
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

  // Toggle activity status using repository
  const result = await buyerRepository.toggleActivityStatus(buyerId);

  if (!result) {
    throw new NotFoundException('Buyer not found');
  }

  return result;
}



module.exports = {
  toggleActivityStatus
};
