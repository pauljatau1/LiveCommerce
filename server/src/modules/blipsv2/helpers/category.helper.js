/**
 * CategoryHelper
 * Utility functions for working with buyer's selected categories
 * and matching them against product categories for personalized blips
 */
class CategoryHelper {
  /**
   * Extracts all unique category names from a buyer's selected categories
   * 
   * The buyer's selectedCategories structure:
   * [
   *   {
   *     name: "Smartphones",
   *     subCategories: [
   *       { name: "Android Phones" },
   *       { name: "iPhones" }
   *     ]
   *   },
   *   ...
   * ]
   * 
   * This method extracts the top-level category names (e.g., "Smartphones", "Tablets")
   * which can be matched against the Product.category field
   * 
   * @param {Array} selectedCategories - Array of category objects from buyer document
   * @returns {Array<string>} Array of unique category names
   */
  extractCategoryNames(selectedCategories) {
    // Return empty array if no categories provided
    if (!selectedCategories || !Array.isArray(selectedCategories) || selectedCategories.length === 0) {
      console.log('📋 [CATEGORY HELPER] No selected categories found for buyer');
      return [];
    }

    // Extract category names, filter out empty/invalid entries, and ensure uniqueness
    const categoryNames = selectedCategories
      .map(category => category?.name)
      .filter(name => name && typeof name === 'string' && name.trim().length > 0)
      .map(name => name.trim());

    // Remove duplicates using Set
    const uniqueCategoryNames = [...new Set(categoryNames)];

    console.log(`📋 [CATEGORY HELPER] Extracted ${uniqueCategoryNames.length} unique category names from ${selectedCategories.length} selected categories`);
    
    if (uniqueCategoryNames.length > 0) {
      console.log(`📋 [CATEGORY HELPER] Category names: ${uniqueCategoryNames.slice(0, 5).join(', ')}${uniqueCategoryNames.length > 5 ? '...' : ''}`);
    }

    return uniqueCategoryNames;
  }

  /**
   * Validates if a buyer has any selected categories
   * @param {Object} buyer - Buyer document
   * @returns {boolean} True if buyer has selected categories
   */
  hasSelectedCategories(buyer) {
    return !!(buyer?.selectedCategories && 
              Array.isArray(buyer.selectedCategories) && 
              buyer.selectedCategories.length > 0);
  }

  /**
   * Gets a summary of buyer's category preferences for logging
   * @param {Object} buyer - Buyer document
   * @returns {Object} Summary object with category stats
   */
  getCategorySummary(buyer) {
    if (!this.hasSelectedCategories(buyer)) {
      return {
        totalCategories: 0,
        totalSubCategories: 0,
        categoryNames: []
      };
    }

    const categoryNames = this.extractCategoryNames(buyer.selectedCategories);
    const totalSubCategories = buyer.selectedCategories.reduce((sum, cat) => {
      return sum + (cat.subCategories?.length || 0);
    }, 0);

    return {
      totalCategories: categoryNames.length,
      totalSubCategories,
      categoryNames: categoryNames.slice(0, 10) // Limit to first 10 for logging
    };
  }
}

module.exports = new CategoryHelper();

