const buyerRepository = require('../repositories/buyer.repository');
const NotFoundException = require('../../../utils/errors/NotFoundException');

/**
 * Check if a major category is fully selected based on selected category names
 * @param {Object} majorCategory - The major category object
 * @param {Array} selectedCategoryNames - Array of selected category names
 * @returns {boolean} True if all categories in the major category are selected
 */
function isMajorCategoryFullySelected(majorCategory, selectedCategoryNames) {
  const categoriesInMajor = majorCategory.categories.map(cat => cat.name);
  return categoriesInMajor.every(catName => selectedCategoryNames.includes(catName));
}

/**
 * Format a major category for the response
 * @param {Object} majorCategory - The major category object
 * @returns {Object} Formatted major category
 */
function formatMajorCategory(majorCategory) {
  return {
    _id: majorCategory._id,
    name: majorCategory.name,
    image: majorCategory.image,
    categoryCount: majorCategory.categories.length,
    categories: majorCategory.categories.map(cat => ({
      _id: cat._id,
      name: cat.name
    }))
  };
}

/**
 * Get selected major categories for a buyer
 * @param {string} buyerId - The buyer's ID
 * @returns {Promise<Object>} Object containing selected major categories
 */
async function getSelectedMajorCategories(buyerId) {
  // Get buyer with selected categories from repository
  const buyer = await buyerRepository.findByIdWithSelectedCategories(buyerId);
  if (!buyer) {
    throw new NotFoundException('Buyer not found');
  }

  // Extract selected category names using repository method
  const selectedCategoryNames = buyer.selectedCategories && Array.isArray(buyer.selectedCategories) 
    ? buyerRepository.extractSelectedCategoryNames(buyer)
    : [];
  
  // Get all active major categories from repository
  const allMajorCategories = await buyerRepository.findAllActiveMajorCategories();
  
  // Filter major categories that are fully selected
  const selectedMajorCategories = allMajorCategories.filter(majorCategory => 
    isMajorCategoryFullySelected(majorCategory, selectedCategoryNames)
  );

  // Format the response
  const formattedMajorCategories = selectedMajorCategories.map(formatMajorCategory);

  return {
    selectedMajorCategories: formattedMajorCategories
  };
}

module.exports = { getSelectedMajorCategories };
