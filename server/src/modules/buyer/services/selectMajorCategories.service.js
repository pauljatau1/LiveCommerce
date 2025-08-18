const buyerRepository = require('../repositories/buyer.repository');
const { validateSelectMajorCategoriesData } = require('../validators/selectMajorCategories.validator');
const ValidationError = require('../../../utils/errors/ValidationError');
const NotFoundException = require('../../../utils/errors/NotFoundException');

/**
 * Extract category IDs from major categories
 * @param {Array} majorCategories - Array of major categories with populated categories
 * @returns {Array} Array of category IDs
 */
function extractCategoryIds(majorCategories) {
  const categoryIds = [];
  majorCategories.forEach(majorCategory => {
    majorCategory.categories.forEach(category => {
      categoryIds.push(category._id);
    });
  });
  return categoryIds;
}

/**
 * Format categories for buyer's selectedCategories field
 * @param {Array} categories - Array of categories with subcategories
 * @returns {Array} Formatted categories
 */
function formatCategories(categories) {
  return categories.map(category => ({
    name: category.name,
    subCategories: category.subCategories.map(subCategory => ({
      name: subCategory.name
    }))
  }));
}

/**
 * Filter out duplicate categories
 * @param {Array} formattedCategories - Array of formatted categories
 * @param {Array} existingCategories - Array of existing selected categories
 * @returns {Array} Array of new categories (non-duplicates)
 */
function filterNewCategories(formattedCategories, existingCategories) {
  const existingCategoryNames = existingCategories.map(cat => cat.name);
  return formattedCategories.filter(cat => !existingCategoryNames.includes(cat.name));
}

/**
 * Select major categories and add their child categories to buyer's selected categories.
 *
 * This function:
 * - Validates the input data (majorCategoryIds array)
 * - Finds the specified major categories with their populated categories
 * - Extracts all category IDs from the major categories
 * - Finds all categories with their subcategories
 * - Formats categories for storage
 * - Merges with existing categories to avoid duplicates
 * - Updates the buyer's selectedCategories
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

  // Find the buyer
  const buyer = await buyerRepository.findById(buyerId);
  if (!buyer) {
    throw new NotFoundException('Buyer not found');
  }

  // Find active major categories
  const majorCategories = await buyerRepository.findActiveMajorCategories(majorCategoryIds);
  if (majorCategories.length === 0) {
    throw new NotFoundException('No active major categories found with the provided IDs');
  }

  // Extract category IDs and find categories
  const categoryIds = extractCategoryIds(majorCategories);
  const categories = await buyerRepository.findCategoriesByIds(categoryIds);

  // Format categories and filter duplicates
  const formattedCategories = formatCategories(categories);
  const newCategories = filterNewCategories(formattedCategories, buyer.selectedCategories);
  
  // Update buyer's selected categories
  const updatedSelectedCategories = [...buyer.selectedCategories, ...newCategories];
  const updatedBuyer = await buyerRepository.updateBuyerSelectedCategories(buyerId, updatedSelectedCategories);

  if (!updatedBuyer) {
    throw new NotFoundException('Failed to update buyer categories');
  }

  return {
    selectedCategories: updatedBuyer.selectedCategories,
    addedCategories: newCategories
  };
}

module.exports = {
  selectMajorCategories
};
