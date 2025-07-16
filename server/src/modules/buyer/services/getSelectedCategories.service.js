const buyerRepository = require('../repositories/buyer.repository');
const NotFoundException = require('../../../utils/errors/NotFoundException');

/**
 * Retrieves the selected categories for a buyer.
 *
 * This function:
 * - Fetches the buyer's selected categories with populated category data
 * - Formats the categories data for API response
 * - Returns the formatted categories with subcategories
 *
 * @param {string} buyerId - The buyer's ID
 * @returns {Promise<Object>} Formatted categories data
 */
async function getSelectedCategories(buyerId) {
  // Get buyer with selected categories populated
  const buyer = await buyerRepository.findByIdWithSelectedCategories(buyerId);

  if (!buyer) {
    throw new NotFoundException('Buyer not found');
  }

  // If buyer has no selected categories, return an empty array
  if (!buyer.selectedCategories) {
    return {
      categories: []
    };
  }

  // Format categories data for response
  const categories = buyer.selectedCategories.map(category => ({
    name: category.name,
    subCategories: category.subCategories.map(sub => ({
      name: sub.name
    }))
  }));

  return {
    categories
  };
}

module.exports = {
  getSelectedCategories,
}; 