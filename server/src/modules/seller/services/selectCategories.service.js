/**
 * Select Categories Service
 *
 * This service handles the business logic for category selection functionality
 * for sellers. It provides secure category validation, database operations,
 * and response formatting functionality.
 *
 * The service ensures that:
 * - Category selection requests are properly validated
 * - Secure category validation against database
 * - Seller categories are updated correctly
 * - Professional response formatting
 * - Error handling maintains system integrity
 *
 * Category Selection Flow:
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
 * @module selectCategoriesService
 */

const sellerRepository = require('../repositories/seller.repository');
const { validateSelectCategoriesData } = require('../validators/selectCategories.validator');
const ValidationError = require('../../../utils/errors/ValidationError');
const NotFoundException = require('../../../utils/errors/NotFoundException');
const Category = require('../../../models/Category');

/**
 * Validates categories against database.
 *
 * This function ensures all provided categories exist in the database
 * and are valid for selection. It performs comprehensive validation
 * to ensure data integrity and security.
 *
 * Category Validation Process:
 * - Extracts category IDs from input data
 * - Queries database for valid categories
 * - Compares provided categories with database results
 * - Ensures all categories are valid and exist
 *
 * Security Features:
 * - Database validation for all categories
 * - Prevents invalid category selection
 * - Maintains data integrity
 * - Error handling without information leakage
 *
 * @param {Array} categories - Categories array to validate
 * @returns {Promise<Array>} Valid categories from database
 * @throws {ValidationError} If any category is invalid or doesn't exist
 */
async function validateCategoriesAgainstDatabase(categories) {
  // Step 1: Extract category IDs from input data
  // This ensures we have the IDs needed for database validation
  const categoryIds = categories.map(cat => cat.id);

  // Step 2: Query database for valid categories
  // This ensures all provided categories exist in the database
  const validCategories = await Category.find({ _id: { $in: categoryIds } });

  // Step 3: Validate that all categories exist
  // This ensures data integrity and prevents invalid selections
  if (validCategories.length !== categories.length) {
    throw new ValidationError([{ field: 'categories', message: 'Invalid category IDs provided' }]);
  }

  // Step 4: Return valid categories for further processing
  return validCategories;
}

/**
 * Transforms categories data for database storage.
 *
 * This function transforms the input categories data into the format
 * required for database storage. It ensures proper structure and
 * data consistency.
 *
 * Transformation Process:
 * - Maps input categories to database format
 * - Preserves category names and sub-categories
 * - Ensures proper data structure
 * - Maintains data integrity
 *
 * Data Structure:
 * - Category name preservation
 * - Sub-categories structure maintenance
 * - Consistent formatting across all categories
 * - Database-compatible format
 *
 * @param {Array} categories - Categories array to transform
 * @returns {Array} Transformed categories for database storage
 */
function transformCategoriesForStorage(categories) {
  // Step 1: Transform categories to database format
  // This ensures proper structure for database storage
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
 * This function updates the seller's categories in the database
 * with the new category selection. It ensures atomic updates
 * and data consistency.
 *
 * Update Process:
 * - Updates seller categories field
 * - Saves changes to database
 * - Ensures atomic operation
 * - Maintains data consistency
 *
 * Security Features:
 * - Atomic database operations
 * - Data consistency maintenance
 * - Error handling for database failures
 * - Professional response formatting
 *
 * @param {Object} seller - Seller object to update
 * @param {Array} transformedCategories - Transformed categories for storage
 * @returns {Promise<Object>} Updated seller data
 * @throws {Error} If database update fails
 */
async function updateSellerCategories(seller, transformedCategories) {
  // Step 1: Update seller categories field
  // This ensures the new categories are assigned to the seller
  seller.categories = transformedCategories;

  // Step 2: Save changes to database
  // This ensures atomic operation and data consistency
  await sellerRepository.saveSeller(seller);

  // Step 3: Return updated seller for response
  return seller;
}

/**
 * Creates success response object with seller data.
 *
 * This function creates a standardized response object that includes
 * success message and updated seller data. It ensures consistent
 * response formatting across the application.
 *
 * Response Structure:
 * - Success message for user feedback
 * - Updated seller data for client use
 * - Consistent formatting across all responses
 * - Professional response structure
 *
 * @param {Object} seller - Updated seller object
 * @returns {Object} Response object with success message and seller data
 */
function createSuccessResponse(seller) {
  return {
    message: 'Categories selected successfully',
    seller
  };
}

/**
 * Selects categories for a seller.
 *
 * This is the main service function that handles the complete category
 * selection process for sellers. It orchestrates all validation,
 * database operations, and response formatting.
 *
 * Category Selection Process:
 * 1. Validates input data using the validator
 * 2. Finds seller by ID using repository
 * 3. Validates categories against database
 * 4. Transforms categories for storage
 * 5. Updates seller categories in database
 * 6. Returns success response with updated seller data
 *
 * Security Features:
 * - Comprehensive input validation before processing
 * - Secure category validation against database
 * - Database integrity checks
 * - Error handling without information leakage
 *
 * Data Integrity:
 * - Validates all inputs before database operations
 * - Uses atomic database updates
 * - Maintains data consistency
 * - Ensures seller exists before processing
 *
 * Error Handling:
 * - Validation errors for invalid inputs
 * - NotFoundException for non-existent sellers
 * - ValidationError for invalid categories
 * - Database operation errors
 * - Proper error propagation to controller
 *
 * @param {string} sellerId - Seller's ID
 * @param {Array} categories - Categories array to select
 * @returns {Promise<Object>} Success response with updated seller data
 *   - message: {string} - Success message for category selection
 *   - seller: {Object} - Updated seller data with new categories
 *
 * @throws {ValidationError} If input validation fails or categories are invalid
 * @throws {NotFoundException} If seller is not found
 * @throws {Error} If database operations fail
 *
 * @example
 * // Successful category selection
 * const response = await selectCategories('507f1f77bcf86cd799439011', [
 *   {
 *     id: '507f1f77bcf86cd799439012',
 *     name: 'Electronics',
 *     subCategories: [
 *       { name: 'Smartphones' },
 *       { name: 'Laptops' }
 *     ]
 *   }
 * ]);
 * // Returns: { message: 'Categories selected successfully', seller: {...} }
 *
 * @example
 * // Failed category selection - invalid categories
 * try {
 *   await selectCategories('507f1f77bcf86cd799439011', [
 *     { id: 'invalid-id', name: 'Invalid Category', subCategories: [] }
 *   ]);
 * } catch (error) {
 *   // error instanceof ValidationError
 *   // error.errors contains validation error details
 * }
 */
async function selectCategories(sellerId, categories) {
  // Step 1: Validate input data using the validator
  // This ensures categories format and structure are correct
  await validateSelectCategoriesData({ categories });

  // Step 2: Find seller by ID using repository
  // This ensures the seller exists before processing
  const seller = await sellerRepository.findById(sellerId);
  if (!seller) {
    throw new NotFoundException('Seller not found');
  }

  // Step 3: Validate categories against database
  // This ensures all provided categories exist and are valid
  await validateCategoriesAgainstDatabase(categories);

  // Step 4: Transform categories for storage
  // This ensures proper format for database storage
  const transformedCategories = transformCategoriesForStorage(categories);

  // Step 5: Update seller categories in database
  // This ensures atomic operation and data consistency
  const updatedSeller = await updateSellerCategories(seller, transformedCategories);

  // Step 6: Return success response with updated seller data
  return createSuccessResponse(updatedSeller);
}

module.exports = {
  selectCategories,
};
