const buyerRepository = require('../repositories/buyer.repository');
const NotFoundException = require('../../../utils/errors/NotFoundException');
const { validateUpdateSelectedCategoriesData } = require('../validators/updateSelectedCategories.validator');

/**
 * Formats categories for storage in the buyer's selectedCategories field.
 *
 * @param {Array} selectedCategories - Array of category objects from request
 * @returns {Array} Formatted categories array
 */
function formatCategories(selectedCategories) {
  if (!selectedCategories || !Array.isArray(selectedCategories)) {
    return [];
  }

  return selectedCategories.map(category => ({
    name: category.name,
    subCategories: (category.subCategories || [])
      .filter(subCategory => subCategory && typeof subCategory === 'object' && subCategory.name)
      .map(subCategory => ({
        name: subCategory.name,
      })),
  }));
}

/**
 * Updates the selected categories for a buyer.
 *
 * This function:
 * - Validates the buyer exists
 * - Formats the categories data
 * - Updates the buyer's selectedCategories
 * - Returns the updated buyer data
 *
 * @param {string} buyerId - The buyer's ID
 * @param {Array} selectedCategories - Array of category objects to update
 * @returns {Promise<Object>} Updated buyer data
 */
async function updateSelectedCategories(buyerId, selectedCategories) {
  // Validate buyer ID
  if (!buyerId) {
    throw new NotFoundException('Buyer ID is required');
  }

  // Validate the input data
  await validateUpdateSelectedCategoriesData({ selectedCategories });

  // Get buyer to check if exists
  const buyer = await buyerRepository.findById(buyerId);

  if (!buyer) {
    throw new NotFoundException('Buyer not found');
  }

  // Format the categories for storage
  const formattedCategories = formatCategories(selectedCategories);

  // Update the buyer's selectedCategories
  const updatedBuyer = await buyerRepository.updateById(buyerId, {
    selectedCategories: formattedCategories
  });

  return updatedBuyer;
}

module.exports = {
  updateSelectedCategories,
  formatCategories,
}; 