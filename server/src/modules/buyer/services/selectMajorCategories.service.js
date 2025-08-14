const buyerRepository = require('../repositories/buyer.repository');
const { validateSelectMajorCategoriesData } = require('../validators/selectMajorCategories.validator');
const ValidationError = require('../../../utils/errors/ValidationError');
const NotFoundException = require('../../../utils/errors/NotFoundException');

/**
 * Select major categories and add their child categories to buyer's selected categories.
 *
 * This function:
 * - Validates the input data (majorCategoryIds array)
 * - Calls the repository to perform the selection logic
 * - Returns the updated buyer data with selected categories
 *
 * @param {string} buyerId - The buyer's ID
 * @param {Array} majorCategoryIds - Array of major category IDs to select
 * @returns {Promise<Object>} Object containing selected categories and added categories info
 * @throws {ValidationError} If majorCategoryIds is invalid
 * @throws {NotFoundException} If buyer is not found
 */
async function selectMajorCategories(buyerId, majorCategoryIds) {
  // Validate input data
  await validateSelectMajorCategoriesData({ buyerId, majorCategoryIds });

  // Call repository to perform the selection logic
  const result = await buyerRepository.selectMajorCategories(buyerId, majorCategoryIds);

  // Check if buyer was found
  if (!result) {
    throw new NotFoundException('Buyer not found');
  }

  // Check if there was an error with major categories
  if (result.error) {
    throw new NotFoundException(result.error);
  }

  return {
    selectedCategories: result.selectedCategories,
    addedCategories: result.addedCategories
  };
}

module.exports = {
  selectMajorCategories
};
