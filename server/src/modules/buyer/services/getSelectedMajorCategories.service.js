/**
 * Get Selected Major Categories Service
 *
 * This service handles the business logic for retrieving and determining which
 * major categories are fully selected by a buyer based on their selected categories.
 * It provides functionality to:
 * - Retrieve buyer's selected categories from database
 * - Fetch all active major categories
 * - Determine which major categories are fully selected
 * - Format response data for API consumption
 * - Handle edge cases and data validation
 *
 * The service analyzes the buyer's selected categories and determines which
 * major categories have all their subcategories selected, providing insights
 * into the buyer's complete category preferences.
 *
 * @module getSelectedMajorCategoriesService
 */

const buyerRepository = require('../repositories/buyer.repository');
const majorCategoryRepository = require('../repositories/majorCategory.repository');
const NotFoundException = require('../../../utils/errors/NotFoundException');

/**
 * Check if a major category is fully selected based on selected category names.
 *
 * This function determines whether all categories within a major category
 * are selected by comparing the major category's subcategories against
 * the buyer's selected category names.
 *
 * Business Logic:
 * - Extracts category names from the major category
 * - Compares against buyer's selected category names
 * - Returns true only if ALL categories in the major category are selected
 * - Handles empty or missing category arrays gracefully
 *
 * @param {Object} majorCategory - The major category object to check
 * @param {Array} majorCategory.categories - Array of category objects within the major category
 * @param {string} majorCategory.categories[].name - Category name
 * @param {Array} selectedCategoryNames - Array of category names selected by the buyer
 * @returns {boolean} True if all categories in the major category are selected, false otherwise
 * @example
 * const majorCategory = {
 *   categories: [{ name: "Phones" }, { name: "Laptops" }]
 * };
 * const selectedNames = ["Phones", "Laptops", "Clothing"];
 * // Returns true because both "Phones" and "Laptops" are selected
 */
function isMajorCategoryFullySelected(majorCategory, selectedCategoryNames) {
  // Extract all category names from the major category
  const categoriesInMajor = majorCategory.categories.map(cat => cat.name);
  
  // Check if every category in the major category is included in selected categories
  return categoriesInMajor.every(catName => selectedCategoryNames.includes(catName));
}

/**
 * Format a major category for the API response.
 *
 * This function transforms a major category object from the database format
 * into a clean, consistent format suitable for API responses. It includes
 * essential information while maintaining a predictable structure.
 *
 * Business Logic:
 * - Extracts core major category properties
 * - Calculates category count for reference
 * - Formats subcategories with essential information only
 * - Maintains consistent response structure
 *
 * @param {Object} majorCategory - The major category object from database
 * @param {string} majorCategory._id - Major category unique identifier
 * @param {string} majorCategory.name - Major category name
 * @param {string} majorCategory.image - Major category image URL
 * @param {Array} majorCategory.categories - Array of category objects
 * @param {string} majorCategory.categories[]._id - Category unique identifier
 * @param {string} majorCategory.categories[].name - Category name
 * @returns {Object} Formatted major category object for API response
 * @example
 * // Input: Database major category object
 * // Output: { _id: "123", name: "Electronics", image: "url", categoryCount: 2, categories: [...] }
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
 * Get selected major categories for a buyer.
 *
 * This function orchestrates the complete process of determining which major
 * categories are fully selected by a buyer. It retrieves the buyer's data,
 * fetches all major categories, performs the selection analysis, and formats
 * the response.
 *
 * Business Logic Flow:
 * 1. Retrieve buyer with selected categories from database
 * 2. Extract selected category names using repository helper
 * 3. Fetch all active major categories
 * 4. Filter major categories that are fully selected
 * 5. Format response data for API consumption
 *
 * Security Considerations:
 * - Buyer existence validation prevents unauthorized access
 * - Repository methods ensure data integrity
 * - Proper error handling for missing or invalid data
 *
 * @param {string} buyerId - The buyer's unique identifier
 * @returns {Promise<Object>} Object containing selected major categories
 * @throws {NotFoundException} If buyer is not found
 * @throws {Error} If database operation fails
 * @example
 * const result = await getSelectedMajorCategories("507f1f77bcf86cd799439011");
 * // Returns: { selectedMajorCategories: [...] }
 */
async function getSelectedMajorCategories(buyerId) {
  // Step 1: Get buyer with selected categories from repository
  // This retrieves the buyer's current category selections
  const buyer = await buyerRepository.findByIdWithSelectedCategories(buyerId);
  
  if (!buyer) {
    throw new NotFoundException('Buyer not found');
  }

  // Step 2: Extract selected category names using repository method
  // This provides a clean array of category names for comparison
  const selectedCategoryNames = buyer.selectedCategories && Array.isArray(buyer.selectedCategories) 
    ? buyerRepository.extractSelectedCategoryNames(buyer)
    : [];
  
  // Step 3: Get all active major categories from repository
  // This fetches the complete list of available major categories
      const allMajorCategories = await majorCategoryRepository.findAllActiveMajorCategories();
  
  // Step 4: Filter major categories that are fully selected
  // This determines which major categories have all subcategories selected
  const selectedMajorCategories = allMajorCategories.filter(majorCategory => 
    isMajorCategoryFullySelected(majorCategory, selectedCategoryNames)
  );

  // Step 5: Format the response for API consumption
  // This transforms the data into a consistent, predictable format
  const formattedMajorCategories = selectedMajorCategories.map(formatMajorCategory);

  return {
    selectedMajorCategories: formattedMajorCategories
  };
}

module.exports = { getSelectedMajorCategories };
