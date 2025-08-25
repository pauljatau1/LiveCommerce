const buyerRepository = require('../repositories/buyer.repository');
const { validateUpdateMajorCategoriesSelectionData } = require('../validators/updateMajorCategoriesSelection.validator');
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
 * Update major categories selection (replaces categories from selected major categories).
 *
 * This function:
 * - Validates the input data (majorCategoryIds array)
 * - Finds the specified major categories with their populated categories
 * - Extracts all category IDs from the major categories
 * - Finds all categories with their subcategories
 * - Formats categories for storage
 * - Keeps manually selected categories that are not part of any major category
 * - Replaces the buyer's selectedCategories with the combination
 * - Returns the updated buyer data with selected categories
 *
 * @param {string} buyerId - The buyer's ID
 * @param {Array} majorCategoryIds - Array of major category IDs to select
 * @returns {Promise<Object>} Object containing selected categories and selection info
 * @throws {ValidationError} If majorCategoryIds is invalid
 * @throws {NotFoundException} If buyer is not found or no active major categories found
 */
async function updateMajorCategoriesSelection(buyerId, majorCategoryIds) {
  // Validate input data
  await validateUpdateMajorCategoriesSelectionData({ buyerId, majorCategoryIds });

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

  // Format categories for buyer's selectedCategories field
  const formattedCategories = formatCategories(categories);

  // Get all category names from all major categories (to identify which categories come from major categories)
  const allMajorCategories = await buyerRepository.findAllActiveMajorCategories();
  const allMajorCategoryNames = new Set();
  allMajorCategories.forEach(majorCategory => {
    majorCategory.categories.forEach(category => {
      allMajorCategoryNames.add(category.name);
    });
  });

  // Separate manually selected categories from major category categories
  const manuallySelectedCategories = buyer.selectedCategories.filter(
    cat => !allMajorCategoryNames.has(cat.name)
  );
  
  // Replace the buyer's selectedCategories with manually selected + new major category selections
  const updatedSelectedCategories = [...manuallySelectedCategories, ...formattedCategories];
  const updatedBuyer = await buyerRepository.updateBuyerSelectedCategories(buyerId, updatedSelectedCategories);

  if (!updatedBuyer) {
    throw new NotFoundException('Failed to update buyer categories');
  }

  return {
    selectedCategories: updatedBuyer.selectedCategories,
    majorCategorySelections: formattedCategories,
    manualSelections: manuallySelectedCategories
  };
}

module.exports = {
  updateMajorCategoriesSelection
};
