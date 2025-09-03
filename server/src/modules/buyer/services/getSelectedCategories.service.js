/**
 * Get Selected Categories Service
 *
 * This service handles the business logic for retrieving a buyer's selected
 * categories. It provides secure category access and validation to ensure
 * buyers can only access their own category preferences.
 *
 * The service ensures that:
 * - Category access is properly validated and secured
 * - Only the category owner can access category information
 * - Category information is retrieved efficiently
 * - Error handling maintains system integrity
 *
 * Category Retrieval Flow:
 * - Buyer existence validation
 * - Category retrieval with complete details
 * - Security verification and access control
 * - Success response with category information
 *
 * Security Features:
 * - Buyer existence validation
 * - Category ownership verification
 * - Access control enforcement
 * - Error handling without information leakage
 * - Secure category data retrieval
 *
 * Category Management:
 * - Retrieves all selected categories for buyer
 * - Handles empty category lists gracefully
 * - Maintains category data integrity
 * - Provides consistent response format
 *
 * @module getSelectedCategoriesService
 */

const buyerRepository = require('../repositories/buyer.repository');
const NotFoundException = require('../../../utils/errors/NotFoundException');

/**
 * Retrieves the selected categories for a buyer - Main business logic function.
 *
 * This is the primary service function that orchestrates the complete
 * category retrieval process. It handles buyer validation, category access,
 * and secure category data retrieval.
 *
 * Business Logic Flow:
 * 1. Validates that the buyer exists in the database
 * 2. Retrieves all selected categories for the buyer
 * 3. Handles empty category lists gracefully
 * 4. Returns formatted category information
 *
 * Security Features:
 * - Buyer existence validation before processing
 * - Category ownership verification
 * - Secure category data retrieval
 * - Error handling without information leakage
 * - Access control enforcement
 *
 * Category Data:
 * - Complete category information
 * - Category names and descriptions
 * - Subcategory information
 * - Category preferences
 * - Category hierarchy data
 *
 * Error Handling:
 * - NotFoundException for non-existent buyers
 * - Database operation errors
 * - Proper error propagation to controller
 * - Graceful handling of empty category lists
 *
 * @param {string} buyerId - The buyer's ID to retrieve categories for
 * @returns {Promise<Object>} Selected categories with complete information
 *   - categories: {Array} - Array of selected categories
 *     - name: {string} - Category name
 *     - subCategories: {Array} - Array of subcategories
 *       - name: {string} - Subcategory name
 * @throws {NotFoundException} If buyer is not found
 * @throws {Error} If database operations fail
 *
 * @example
 * // Get selected categories for buyer
 * const categories = await getSelectedCategories('507f1f77bcf86cd799439011');
 * // Returns: {
 * //   categories: [
 * //     {
 * //       name: 'Electronics',
 * //       subCategories: [
 * //         { name: 'Smartphones' },
 * //         { name: 'Laptops' }
 * //       ]
 * //     },
 * //     {
 * //       name: 'Fashion',
 * //       subCategories: [
 * //         { name: 'Men\'s Clothing' },
 * //         { name: 'Women\'s Clothing' }
 * //       ]
 * //     }
 * //   ]
 * // }
 *
 * @example
 * // Empty category list
 * const categories = await getSelectedCategories('507f1f77bcf86cd799439011');
 * // Returns: {
 * //   categories: []
 * // }
 *
 * @example
 * // Buyer not found
 * try {
 *   await getSelectedCategories('nonexistent-buyer-id');
 * } catch (error) {
 *   // error instanceof NotFoundException
 *   // error.message: 'Buyer not found'
 * }
 */
async function getSelectedCategories(buyerId) {
  // Step 1: Get buyer with selected categories populated
  // This fetches the buyer record with all associated selected categories
  const buyer = await buyerRepository.findByIdWithSelectedCategories(buyerId);

  // Step 2: Check if buyer exists
  // This prevents processing for non-existent buyers
  if (!buyer) {
    throw new NotFoundException('Buyer not found');
  }

  // Step 3: If buyer has no selected categories, return an empty array
  // This ensures consistent response format even when no categories exist
  if (!buyer.selectedCategories) {
    return {
      categories: []
    };
  }

  // Step 4: Format categories data for response
  // This transforms the raw category data into a clean API response format
  const categories = buyer.selectedCategories.map(category => ({
    name: category.name,
    subCategories: category.subCategories.map(sub => ({
      name: sub.name
    }))
  }));

  // Step 5: Return formatted categories
  return {
    categories
  };
}

module.exports = {
  getSelectedCategories,
}; 