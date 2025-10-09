/**
 * Select Major Categories Service
 *
 * This service handles the business logic for selecting major categories and their
 * associated child categories for buyers. It provides functionality to:
 * - Validate major category selection requests
 * - Retrieve active major categories with populated child categories
 * - Extract and process category hierarchies
 * - Format categories for buyer profile storage
 * - Handle duplicate category prevention
 * - Update buyer's selected categories
 * - Ensure data integrity and consistency
 * - Maintain category selection state
 *
 * The service ensures that major category selections are properly processed,
 * child categories are correctly associated, and buyer preferences are
 * maintained without duplicates.
 *
 * @module selectMajorCategoriesService
 */

const buyerRepository = require('../repositories/buyer.repository');
const majorCategoryRepository = require('../repositories/majorCategory.repository');
const categoryRepository = require('../repositories/category.repository');
const { validateSelectMajorCategoriesData } = require('../validators/selectMajorCategories.validator');
const NotFoundException = require('../../../utils/errors/NotFoundException');

/**
 * Extract category IDs from major categories
 *
 * This function processes major categories and extracts all child category IDs
 * from their populated categories arrays, creating a flat list for database queries.
 *
 * Business Logic:
 * - Iterates through each major category
 * - Extracts category IDs from populated categories arrays
 * - Creates a flat array of all child category IDs
 * - Enables efficient database queries for category details
 *
 * Data Processing:
 * - Major categories → Flat category ID array
 * - Handles nested category structures
 * - Preserves category hierarchy relationships
 *
 * @param {Array} majorCategories - Array of major categories with populated categories
 * @param {Object} majorCategories[].categories - Array of child categories
 * @param {string} majorCategories[].categories[]._id - Category ID
 * @returns {Array} Array of category IDs
 * @example
 * const categoryIds = extractCategoryIds([
 *   {
 *     categories: [{ _id: 'cat1' }, { _id: 'cat2' }]
 *   },
 *   {
 *     categories: [{ _id: 'cat3' }]
 *   }
 * ]);
 * // Returns: ['cat1', 'cat2', 'cat3']
 */
function extractCategoryIds(majorCategories) {
  // Step 1: Initialize array to store extracted category IDs
  // This will hold all child category IDs from the major categories
  const categoryIds = [];
  
  // Step 2: Iterate through each major category
  // This processes each major category to extract its child categories
  majorCategories.forEach(majorCategory => {
    // Step 3: Extract category IDs from populated categories array or raw ObjectIds
    // This flattens the nested category structure into a simple ID array
    majorCategory.categories.forEach(category => {
      // Support both populated docs (with _id) and ObjectId values
      const id = category && category._id ? category._id : category;
      if (id) {
        categoryIds.push(id);
      }
    });
  });
  
  // Step 4: Return the flat array of category IDs
  // This enables efficient database queries for category details
  return categoryIds;
}

/**
 * Format categories for buyer's selectedCategories field
 *
 * This function transforms raw category data into a standardized format
 * suitable for storage in the buyer's selectedCategories field.
 *
 * Business Logic:
 * - Maps category data to simplified structure
 * - Extracts category names and subcategory names
 * - Creates consistent format for buyer preferences
 * - Removes unnecessary data fields for storage efficiency
 *
 * Data Transformation:
 * - Raw category objects → Simplified category format
 * - Preserves category and subcategory names
 * - Removes database-specific fields (_id, etc.)
 * - Creates storage-optimized structure
 *
 * @param {Array} categories - Array of categories with subcategories
 * @param {Object} categories[].name - Category name
 * @param {Array} categories[].subCategories - Array of subcategories
 * @param {Object} categories[].subCategories[].name - Subcategory name
 * @returns {Array} Formatted categories
 * @example
 * const formatted = formatCategories([
 *   {
 *     name: 'Electronics',
 *     subCategories: [{ name: 'Phones' }, { name: 'Laptops' }]
 *   }
 * ]);
 * // Returns: [{ name: 'Electronics', subCategories: [{ name: 'Phones' }, { name: 'Laptops' }] }]
 */
function formatCategories(categories) {
  // Transform raw category data into standardized format for buyer storage
  // This creates a simplified structure with only essential category information
  return categories.map(category => ({
    name: category.name, // Extract category name for storage
    subCategories: category.subCategories.map(subCategory => ({
      name: subCategory.name // Extract subcategory name for storage
    }))
  }));
}

/**
 * Filter out duplicate categories
 *
 * This function compares newly formatted categories with existing buyer categories
 * and returns only the categories that are not already selected by the buyer.
 *
 * Business Logic:
 * - Creates a set of existing category names for efficient lookup
 * - Filters out categories that already exist in buyer's selections
 * - Prevents duplicate category entries in buyer preferences
 * - Ensures data integrity and prevents redundant selections
 *
 * Data Processing:
 * - Compares category names for duplicate detection
 * - Returns only new, non-duplicate categories
 * - Maintains buyer preference uniqueness
 * - Enables efficient category addition
 *
 * @param {Array} formattedCategories - Array of formatted categories to check
 * @param {Array} existingCategories - Array of existing selected categories
 * @param {Object} formattedCategories[].name - Category name to check
 * @param {Object} existingCategories[].name - Existing category name
 * @returns {Array} Array of new categories (non-duplicates)
 * @example
 * const newCategories = filterNewCategories(
 *   [{ name: 'Electronics' }, { name: 'Books' }],
 *   [{ name: 'Electronics' }]
 * );
 * // Returns: [{ name: 'Books' }] (Electronics filtered out as duplicate)
 */
function filterNewCategories(formattedCategories, existingCategories) {
  // Step 1: Extract existing category names for efficient lookup
  // This creates a flat array of category names to compare against
  const existingCategoryNames = existingCategories.map(cat => cat.name);
  
  // Step 2: Filter out categories that already exist in buyer's selections
  // This prevents duplicate category entries and maintains data integrity
  return formattedCategories.filter(cat => !existingCategoryNames.includes(cat.name));
}

/**
 * Select major categories and add their child categories to buyer's selected categories.
 *
 * This function orchestrates the complete major category selection process,
 * including validation, data retrieval, processing, and buyer profile updates.
 *
 * Business Logic Flow:
 * 1. Validate input data (buyer ID and major category IDs)
 * 2. Retrieve buyer information and verify existence
 * 3. Find active major categories with populated child categories
 * 4. Extract all child category IDs from major categories
 * 5. Retrieve detailed category information with subcategories
 * 6. Format categories for buyer profile storage
 * 7. Filter out duplicate categories from existing selections (if not replacing)
 * 8. Merge new categories with existing selections (or replace if replaceMode is true)
 * 9. Update buyer's selected categories in database
 * 10. Return updated buyer data with selection information
 *
 * Replace Mode (NEW):
 * - When replaceMode is true, clears ALL previous major category selections
 * - Preserves only manually selected categories (those not from any major category)
 * - Ensures immediate algorithm update when buyer reselects categories
 * - Prevents accumulation of old category selections
 *
 * Security Considerations:
 * - Input validation prevents malicious data processing
 * - Buyer existence verification ensures data integrity
 * - Active category validation prevents selection of inactive categories
 * - Duplicate prevention maintains data consistency
 * - Repository methods handle database operations securely
 *
 * Data Processing:
 * - Major category selection → Child category extraction
 * - Category hierarchy processing → Flat category list
 * - Raw category data → Formatted storage structure
 * - Duplicate detection → Unique category additions
 * - Database update → Buyer preference persistence
 *
 * @param {string} buyerId - The buyer's unique identifier
 * @param {Array} majorCategoryIds - Array of major category IDs to select
 * @param {boolean} replaceMode - If true, replaces all previous major category selections (default: true)
 * @returns {Promise<Object>} Object containing selected categories and added categories info
 *   - selectedCategories: {Array} - Complete updated list of buyer's selected categories
 *   - addedCategories: {Array} - New categories that were added (non-duplicates)
 * @throws {Error} If majorCategoryIds is invalid
 * @throws {NotFoundException} If buyer is not found or no active major categories found
 * @throws {Error} If database operations fail
 * @example
 * // Replace mode (default - recommended for category reselection)
 * const result = await selectMajorCategories('buyer123', ['majorCat1', 'majorCat2']);
 * 
 * // Append mode (if you want to ADD to existing categories)
 * const result = await selectMajorCategories('buyer123', ['majorCat1'], false);
 * // Returns: {
 * //   selectedCategories: [...], // All buyer's selected categories
 * //   addedCategories: [...] // Only newly added categories
 * // }
 */
async function selectMajorCategories(buyerId, majorCategoryIds, replaceMode = true) {
  // Step 1: Validate input data (buyer ID and major category IDs)
  // This ensures all input parameters meet validation requirements
  await validateSelectMajorCategoriesData({ buyerId, majorCategoryIds });

  // Step 2: Retrieve buyer information and verify existence
  // This ensures the buyer exists before processing category selections
  const buyer = await buyerRepository.findById(buyerId);
  if (!buyer) {
    throw new NotFoundException('Buyer not found');
  }

  // Step 3: Find active major categories with populated child categories
  // This retrieves only active major categories to prevent selection of inactive ones
      const majorCategories = await majorCategoryRepository.findActiveMajorCategories(majorCategoryIds);
  if (majorCategories.length === 0) {
    throw new NotFoundException('No active major categories found with the provided IDs');
  }

  // Step 4: Extract all child category IDs from major categories
  // This flattens the category hierarchy for efficient database queries
  const categoryIds = extractCategoryIds(majorCategories);
  
  // Step 5: Retrieve detailed category information with subcategories
  // This fetches complete category data including subcategory information
      const categories = await categoryRepository.findCategoriesByIds(categoryIds);

  // Step 6: Format categories for buyer profile storage
  // This transforms raw category data into storage-optimized format
  const formattedCategories = formatCategories(categories);
  
  let updatedSelectedCategories;
  let newCategories;
  
  if (replaceMode) {
    // REPLACE MODE: Clear old major category selections, keep only manual selections
    console.log(`🔄 [CATEGORIES DEBUG] Replace mode enabled - clearing old major category selections`);
    
    // Get all major categories to identify which categories come from major categories
    const allMajorCategories = await majorCategoryRepository.findAllActiveMajorCategories();
    const allMajorCategoryNames = new Set();
    
    allMajorCategories.forEach(majorCategory => {
      majorCategory.categories.forEach(category => {
        allMajorCategoryNames.add(category.name);
      });
    });
    
    // Preserve only manually selected categories (those not from any major category)
    const manuallySelectedCategories = buyer.selectedCategories.filter(
      cat => !allMajorCategoryNames.has(cat.name)
    );
    
    console.log(`📌 [CATEGORIES DEBUG] Preserved ${manuallySelectedCategories.length} manually selected categories`);
    console.log(`✨ [CATEGORIES DEBUG] Adding ${formattedCategories.length} new categories from selected major categories`);
    
    // Replace with manually selected + new major category selections
    updatedSelectedCategories = [...manuallySelectedCategories, ...formattedCategories];
    newCategories = formattedCategories;
  } else {
    // APPEND MODE: Add new categories to existing ones (original behavior)
    // Step 7: Filter out duplicate categories from existing selections
    // This prevents duplicate entries and maintains data integrity
    newCategories = filterNewCategories(formattedCategories, buyer.selectedCategories);
    
    // Step 8: Merge new categories with existing selections
    // This combines existing and new categories for the complete selection
    updatedSelectedCategories = [...buyer.selectedCategories, ...newCategories];
  }
  
  // Step 9: Update buyer's selected categories in database
  // This persists the updated category selections to the buyer's profile
  const updatedBuyer = await buyerRepository.updateBuyerSelectedCategories(buyerId, updatedSelectedCategories);

  // Step 10: Verify successful database update
  // This ensures the update operation completed successfully
  if (!updatedBuyer) {
    throw new NotFoundException('Failed to update buyer categories');
  }

  // Step 11: Return updated buyer data with selection information
  // This provides the caller with complete updated data and new additions
  return {
    selectedCategories: updatedBuyer.selectedCategories, // Complete updated category list
    addedCategories: newCategories // Only newly added categories (non-duplicates)
  };
}

module.exports = {
  selectMajorCategories
};
