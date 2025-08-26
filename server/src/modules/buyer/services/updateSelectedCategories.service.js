/**
 * Update Selected Categories Service
 *
 * This service handles the business logic for updating a buyer's selected categories.
 * It provides functionality to:
 * - Validate buyer existence and input data
 * - Format and structure category data for storage
 * - Update buyer's selected categories in the database
 * - Handle nested subcategory structures
 * - Maintain data integrity and consistency
 *
 * The service ensures that category data is properly formatted before storage,
 * filtering out invalid entries and maintaining a consistent structure for
 * both major categories and their subcategories.
 *
 * @module updateSelectedCategoriesService
 */

const buyerRepository = require('../repositories/buyer.repository');
const NotFoundException = require('../../../utils/errors/NotFoundException');
const { validateUpdateSelectedCategoriesData } = require('../validators/updateSelectedCategories.validator');

/**
 * Formats categories for storage in the buyer's selectedCategories field.
 *
 * This function processes the raw category data from the request and transforms
 * it into a consistent, validated format suitable for database storage. It handles
 * nested subcategory structures and filters out invalid entries to maintain
 * data integrity.
 *
 * Business Logic:
 * - Validates input array structure
 * - Extracts category names and subcategory information
 * - Filters out invalid or empty subcategories
 * - Maintains consistent object structure for database storage
 *
 * @param {Array} selectedCategories - Array of category objects from request
 * @param {string} selectedCategories[].name - Category name
 * @param {Array} selectedCategories[].subCategories - Array of subcategory objects
 * @param {string} selectedCategories[].subCategories[].name - Subcategory name
 * @returns {Array} Formatted categories array ready for database storage
 * @example
 * // Input
 * [
 *   { name: "Electronics", subCategories: [{ name: "Phones" }, { name: "" }] },
 *   { name: "Clothing", subCategories: null }
 * ]
 * // Output
 * [
 *   { name: "Electronics", subCategories: [{ name: "Phones" }] },
 *   { name: "Clothing", subCategories: [] }
 * ]
 */
function formatCategories(selectedCategories) {
  // Handle null/undefined input by returning empty array
  if (!selectedCategories || !Array.isArray(selectedCategories)) {
    return [];
  }

  // Process each category and format it for storage
  return selectedCategories.map(category => ({
    // Extract and store the category name
    name: category.name,
    // Process subcategories: filter out invalid entries and format structure
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
 * This function orchestrates the complete process of updating a buyer's
 * selected categories. It validates the input data, ensures the buyer exists,
 * formats the category data, and updates the database record.
 *
 * Business Logic Flow:
 * 1. Validate input data using the validator
 * 2. Check buyer existence in database
 * 3. Format category data for storage
 * 4. Update buyer record with new categories
 * 5. Return updated buyer data
 *
 * Security Considerations:
 * - Input validation prevents malicious data injection
 * - Buyer existence check ensures data integrity
 * - Data formatting prevents storage of invalid structures
 *
 * @param {string} buyerId - The buyer's unique identifier
 * @param {Array} selectedCategories - Array of category objects to update
 * @param {string} selectedCategories[].name - Category name
 * @param {Array} selectedCategories[].subCategories - Array of subcategory objects
 * @returns {Promise<Object>} Updated buyer data with new selected categories
 * @throws {ValidationError} If input validation fails
 * @throws {NotFoundException} If buyer is not found
 * @throws {Error} If database operation fails
 * @example
 * const updatedBuyer = await updateSelectedCategories(
 *   "507f1f77bcf86cd799439011",
 *   [{ name: "Electronics", subCategories: [{ name: "Phones" }] }]
 * );
 */
async function updateSelectedCategories(buyerId, selectedCategories) {
  // Step 1: Validate the input data using the validator
  // This ensures buyerId format and selectedCategories structure are correct
  await validateUpdateSelectedCategoriesData({ buyerId, selectedCategories });

  // Step 2: Get buyer from database to check if exists
  // This prevents updates to non-existent buyers
  const buyer = await buyerRepository.findById(buyerId);

  if (!buyer) {
    throw new NotFoundException('Buyer not found');
  }

  // Step 3: Format the categories for storage
  // This ensures consistent data structure and filters invalid entries
  const formattedCategories = formatCategories(selectedCategories);

  // Step 4: Update the buyer's selectedCategories in the database
  // This performs the actual database update operation
  const updatedBuyer = await buyerRepository.updateById(buyerId, {
    selectedCategories: formattedCategories
  });

  // Step 5: Return the updated buyer data
  return updatedBuyer;
}

module.exports = {
  updateSelectedCategories,
  formatCategories,
}; 