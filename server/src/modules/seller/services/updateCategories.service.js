/**
 * Update Categories Service
 *
 * This service handles the business logic for category update functionality
 * for sellers. It provides secure category validation, database operations,
 * and response formatting functionality.
 *
 * The service ensures that:
 * - Category update requests are properly validated
 * - Secure category validation against database
 * - Seller categories are updated correctly
 * - Professional response formatting
 * - Error handling maintains system integrity
 *
 * Category Update Flow:
 * - Input validation and seller existence verification
 * - Category validation against database
 * - Seller categories update
 * - Success response with updated seller data
 *
 * Security Features:
 * - Secure category validation
 * - Database integrity checks
 * - Error handling without information leakage
 * - Professional response formatting
 *
 * Database Operations:
 * - Seller lookup by ID
 * - Category validation against database
 * - Seller categories update
 * - Atomic database operations
 *
 * @module updateCategoriesService
 */

const sellerRepository = require('../repositories/seller.repository');
const { validateUpdateCategoriesData } = require('../validators/updateCategories.validator');
const ValidationError = require('../../../utils/errors/ValidationError');
const NotFoundException = require('../../../utils/errors/NotFoundException');
const Category = require('../../../models/Category');

/**
 * Validates categories against database.
 *
 * This function ensures all provided categories exist in the database
 * and are valid for update operations. It performs comprehensive validation
 * to ensure data integrity and security.
 *
 * Category Validation Process:
 * - Extracts category IDs from input data
 * - Queries database for category existence
 * - Validates all categories exist in database
 * - Throws ValidationError if any category is invalid
 *
 * @param {Array} categories - Array of categories to validate
 * @throws {ValidationError} Throws ValidationError if categories are invalid
 */
async function validateCategoriesAgainstDatabase(categories) {
  // Extract category IDs for database validation
  const categoryIds = categories.map(cat => cat.id);
  
  // Query database for category existence
  const validCategories = await Category.find({ _id: { $in: categoryIds } });
  
  // Validate all categories exist in database
  if (validCategories.length !== categories.length) {
    throw new ValidationError([{ 
      field: 'categories', 
      message: 'Invalid category IDs provided' 
    }]);
  }
}

/**
 * Transforms categories for storage in seller document.
 *
 * This function converts the input category format to the format
 * required for storage in the seller document. It ensures proper
 * data structure and maintains data integrity.
 *
 * Transformation Process:
 * - Maps category data to storage format
 * - Preserves category names and subcategory structure
 * - Ensures consistent data format
 *
 * @param {Array} categories - Array of categories to transform
 * @returns {Array} Transformed categories for storage
 */
function transformCategoriesForStorage(categories) {
  return categories.map(category => ({
    name: category.name,
    subCategories: category.subCategories.map(subCategory => ({
      name: subCategory.name,
    })),
  }));
}

/**
 * Updates seller categories in database.
 *
 * This function performs the actual database update operation
 * to save the seller's updated categories. It ensures atomic
 * database operations and maintains data integrity.
 *
 * Update Process:
 * - Updates seller categories field
 * - Saves changes to database
 * - Returns updated seller data
 *
 * @param {Object} seller - Seller instance to update
 * @param {Array} transformedCategories - Transformed categories for storage
 * @returns {Promise<Object>} Updated seller data
 */
async function updateSellerCategories(seller, transformedCategories) {
  // Update seller categories
  seller.categories = transformedCategories;
  
  // Save changes to database
  return await sellerRepository.saveSeller(seller);
}

/**
 * Creates success response for category update operations.
 *
 * This function formats the response data for successful category
 * update operations. It ensures consistent response structure
 * and maintains professional API standards.
 *
 * Response Structure:
 * - Success message
 * - Updated seller data
 * - Consistent format with original API
 *
 * @param {Object} seller - Updated seller data
 * @returns {Object} Formatted success response
 */
function createSuccessResponse(seller) {
  return {
    message: 'Categories updated successfully',
    seller
  };
}

/**
 * Updates categories for a seller.
 *
 * This is the main service function that orchestrates the complete
 * category update process. It handles validation, database operations,
 * and response formatting for category update requests.
 *
 * Update Process:
 * 1. Input validation using validator
 * 2. Seller existence verification
 * 3. Category validation against database
 * 4. Category transformation for storage
 * 5. Database update operation
 * 6. Success response formatting
 *
 * @param {string} sellerId - ID of the seller to update categories for
 * @param {Array} categories - Array of categories to update
 * @returns {Promise<Object>} Success response with updated seller data
 * @throws {ValidationError} Throws ValidationError if validation fails
 * @throws {NotFoundException} Throws NotFoundException if seller not found
 * 
 * @example
 * // Update seller categories
 * const sellerId = '507f1f77bcf86cd799439011';
 * const categories = [
 *   {
 *     id: '507f1f77bcf86cd799439011',
 *     name: 'Electronics',
 *     subCategories: [
 *       { name: 'Smartphones' },
 *       { name: 'Laptops' }
 *     ]
 *   }
 * ];
 * 
 * try {
 *   const response = await updateCategories(sellerId, categories);
 *   // response: { message: 'Categories updated successfully', seller: {...} }
 * } catch (error) {
 *   // Handle validation or not found errors
 * }
 */
async function updateCategories(sellerId, categories) {
  // Step 1: Validate input data
  // This ensures all input data meets validation requirements
  await validateUpdateCategoriesData({ categories });

  // Step 2: Verify seller exists
  // This ensures the seller exists before attempting to update categories
  const seller = await sellerRepository.findById(sellerId);
  if (!seller) {
    throw new NotFoundException('Seller not found');
  }

  // Step 3: Validate categories against database
  // This ensures all provided categories exist in the database
  await validateCategoriesAgainstDatabase(categories);

  // Step 4: Transform categories for storage
  // This converts input format to storage format
  const transformedCategories = transformCategoriesForStorage(categories);

  // Step 5: Update seller categories
  // This performs the actual database update operation
  const updatedSeller = await updateSellerCategories(seller, transformedCategories);

  // Step 6: Create and return success response
  // This formats the response for the client
  return createSuccessResponse(updatedSeller);
}

module.exports = {
  updateCategories,
};
