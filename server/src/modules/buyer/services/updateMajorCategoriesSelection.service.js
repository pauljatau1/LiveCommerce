/**
 * Update Major Categories Selection Service
 *
 * This service handles the business logic for updating a buyer's major categories selection,
 * which replaces categories from selected major categories. It provides functionality to:
 * - Validate major category IDs and buyer existence
 * - Extract category IDs from major categories
 * - Format categories for storage
 * - Preserve manually selected categories not part of major categories
 * - Update buyer's selected categories with combined data
 * - Maintain data integrity and consistency
 *
 * The service ensures that major category selections are properly processed while
 * preserving any manually selected categories that are not part of the major categories.
 *
 * @module updateMajorCategoriesSelectionService
 */

const buyerRepository = require('../repositories/buyer.repository');
const majorCategoryRepository = require('../repositories/majorCategory.repository');
const categoryRepository = require('../repositories/category.repository');
const { validateUpdateMajorCategoriesSelectionData } = require('../validators/updateMajorCategoriesSelection.validator');
const NotFoundException = require('../../../utils/errors/NotFoundException');

/**
 * Extract category IDs from major categories.
 *
 * This function processes major categories and extracts all category IDs
 * from their nested category structures for further processing.
 *
 * Business Logic:
 * - Iterates through major categories array
 * - Extracts category IDs from nested categories
 * - Returns flat array of category IDs
 * - Handles nested category structures
 *
 * @param {Array} majorCategories - Array of major categories with populated categories
 * @param {Array} majorCategories[].categories - Array of category objects within major category
 * @param {string} majorCategories[].categories[]._id - Category unique identifier
 * @returns {Array} Array of category IDs extracted from major categories
 * @example
 * const majorCategories = [
 *   { categories: [{ _id: "123" }, { _id: "456" }] },
 *   { categories: [{ _id: "789" }] }
 * ];
 * const categoryIds = extractCategoryIds(majorCategories); // Returns ["123", "456", "789"]
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
 * Format categories for buyer's selectedCategories field.
 *
 * This function transforms category objects into the format required
 * for storage in the buyer's selectedCategories field.
 *
 * Business Logic:
 * - Maps category objects to required format
 * - Extracts category names and subcategory information
 * - Maintains consistent data structure
 * - Handles nested subcategory structures
 *
 * @param {Array} categories - Array of categories with subcategories
 * @param {string} categories[].name - Category name
 * @param {Array} categories[].subCategories - Array of subcategory objects
 * @param {string} categories[].subCategories[].name - Subcategory name
 * @returns {Array} Formatted categories ready for storage
 * @example
 * const categories = [
 *   { name: "Electronics", subCategories: [{ name: "Phones" }] }
 * ];
 * const formatted = formatCategories(categories);
 * // Returns: [{ name: "Electronics", subCategories: [{ name: "Phones" }] }]
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
 * This function orchestrates the complete process of updating a buyer's major
 * categories selection, including validation, data extraction, formatting, and
 * preserving manually selected categories.
 *
 * Business Logic Flow:
 * 1. Validate input data (majorCategoryIds array and buyer existence)
 * 2. Find active major categories with populated categories
 * 3. Extract category IDs from major categories
 * 4. Find categories with their subcategories
 * 5. Format categories for storage
 * 6. Preserve manually selected categories not part of major categories
 * 7. Update buyer's selectedCategories with combined data
 * 8. Return updated buyer data with selection information
 *
 * Security Considerations:
 * - Input validation prevents unauthorized operations
 * - Buyer existence verification ensures data integrity
 * - Major category validation prevents invalid selections
 * - Data formatting prevents storage corruption
 *
 * @param {string} buyerId - The buyer's unique identifier
 * @param {Array} majorCategoryIds - Array of major category IDs to select
 * @param {string} majorCategoryIds[] - Major category unique identifier
 * @returns {Promise<Object>} Object containing selected categories and selection info
 * @throws {Error} If majorCategoryIds is invalid
 * @throws {NotFoundException} If buyer is not found or no active major categories found
 * @throws {Error} If database operation fails
 * @example
 * const result = await updateMajorCategoriesSelection(
 *   "507f1f77bcf86cd799439011",
 *   ["507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013"]
 * );
 * // Returns: { selectedCategories: [...], selectionInfo: {...} }
 */
async function updateMajorCategoriesSelection(buyerId, majorCategoryIds) {
  // Step 1: Validate input data
  // This ensures majorCategoryIds format and buyer existence
  await validateUpdateMajorCategoriesSelectionData({ buyerId, majorCategoryIds });

  // Step 2: Find the buyer
  // This verifies buyer exists before proceeding with updates
  const buyer = await buyerRepository.findById(buyerId);
  if (!buyer) {
    throw new NotFoundException('Buyer not found');
  }

  // Step 3: Find active major categories
  // This retrieves major categories with populated category data
      const majorCategories = await majorCategoryRepository.findActiveMajorCategories(majorCategoryIds);
  if (majorCategories.length === 0) {
    throw new NotFoundException('No active major categories found with the provided IDs');
  }

  // Step 4: Extract category IDs and find categories
  // This processes major categories to get individual category data
  const categoryIds = extractCategoryIds(majorCategories);
      const categories = await categoryRepository.findCategoriesByIds(categoryIds);

  // Step 5: Format categories for buyer's selectedCategories field
  // This transforms category data into the required storage format
  const formattedCategories = formatCategories(categories);

  // Step 6: Get all category names from all major categories
  // This identifies which categories come from major categories
      const allMajorCategories = await majorCategoryRepository.findAllActiveMajorCategories();
  const allMajorCategoryNames = new Set();
  allMajorCategories.forEach(majorCategory => {
    majorCategory.categories.forEach(category => {
      allMajorCategoryNames.add(category.name);
    });
  });

  // Step 7: Separate manually selected categories from major category categories
  // This preserves categories that were manually selected and not part of major categories
  const manuallySelectedCategories = buyer.selectedCategories.filter(
    cat => !allMajorCategoryNames.has(cat.name)
  );
  
  // Step 8: Replace the buyer's selectedCategories with manually selected + new major category selections
  // This combines preserved manual selections with new major category selections
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
