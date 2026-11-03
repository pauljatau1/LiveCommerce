/**
 * Remove From Wishlist Service
 *
 * This service handles the business logic for removing products from a buyer's wishlist.
 * It provides functionality to:
 * - Validate remove from wishlist request data
 * - Check if product exists in buyer's wishlist
 * - Remove product from wishlist array
 * - Update buyer's database record
 * - Handle edge cases and data validation
 *
 * The service ensures that products are safely removed from the wishlist
 * while maintaining data integrity and providing appropriate error handling.
 *
 * @module removeFromWishlistService
 */

const buyerRepository = require('../repositories/buyer.repository');
const removeFromWishlistValidator = require('../validators/removeFromWishlist.validator');
const NotFoundException = require('../../../utils/errors/NotFoundException');

/**
 * Check if product exists in buyer's wishlist.
 *
 * This function examines the buyer's wishlist array to determine if
 * the specified product is currently in the wishlist. It performs
 * a case-sensitive comparison of product IDs.
 *
 * Business Logic:
 * - Validates wishlist array structure
 * - Searches through wishlist items
 * - Compares product IDs using string conversion for consistency
 * - Returns boolean indicating product presence
 * - Handles null/undefined wishlist arrays gracefully
 *
 * @param {Object} buyer - The buyer object with wishlist array
 * @param {Array} buyer.wishlist - Array of wishlist item objects
 * @param {string} buyer.wishlist[].product - Product ID in the wishlist
 * @param {string} productId - The product's ID to check
 * @returns {boolean} True if product is in wishlist, false otherwise
 * @example
 * const buyer = { wishlist: [{ product: "507f1f77bcf86cd799439011" }] };
 * const isInWishlist = isProductInWishlist(buyer, "507f1f77bcf86cd799439011"); // true
 */
function isProductInWishlist(buyer, productId) {
  // Validate wishlist array structure
  if (!buyer.wishlist || !Array.isArray(buyer.wishlist)) {
    return false;
  }
  
  // Search for product in wishlist using string comparison
  return buyer.wishlist.some(
    item => item.product.toString() === productId
  );
}

/**
 * Remove product from buyer's wishlist.
 *
 * This function removes the specified product from the buyer's wishlist
 * array, maintaining the integrity of the wishlist structure.
 *
 * Business Logic:
 * - Validates wishlist array structure
 * - Filters out the specified product from wishlist array
 * - Preserves all other wishlist items
 * - Initializes empty array if wishlist is missing
 * - Updates the buyer's wishlist array in place
 *
 * @param {Object} buyer - The buyer object to update
 * @param {Array} buyer.wishlist - Array of wishlist item objects
 * @param {string} productId - The product's ID to remove from wishlist
 */
function removeProductFromWishlist(buyer, productId) {
  // Initialize empty array if wishlist is missing or invalid
  if (!buyer.wishlist || !Array.isArray(buyer.wishlist)) {
    buyer.wishlist = [];
    return;
  }
  
  // Filter out the specified product from wishlist
  buyer.wishlist = buyer.wishlist.filter(
    item => item.product.toString() !== productId
  );
}

/**
 * Remove a product from buyer's wishlist.
 *
 * This function orchestrates the complete remove from wishlist process by
 * validating the request, checking product existence, removing the product,
 * and updating the database record.
 *
 * Business Logic Flow:
 * 1. Validate the remove from wishlist request data
 * 2. Retrieve buyer data from database
 * 3. Verify product exists in buyer's wishlist
 * 4. Remove product from wishlist array
 * 5. Save updated buyer data to database
 * 6. Return updated wishlist information
 *
 * Security Considerations:
 * - Input validation prevents unauthorized operations
 * - Product existence verification ensures data consistency
 * - Proper error handling for edge cases
 * - Data structure validation prevents corruption
 *
 * @param {string} buyerId - The buyer's unique identifier
 * @param {string} productId - The product's ID to remove from wishlist
 * @returns {Promise<Object>} An object containing the updated wishlist
 * @throws {ValidationError} If input validation fails
 * @throws {NotFoundException} If buyer is not found or product not in wishlist
 * @throws {Error} If database operation fails
 * @example
 * const result = await removeFromWishlist("507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012");
 * // Returns: { wishlist: [...] }
 */
async function removeFromWishlist(buyerId, productId) {
  // Step 1: Validate the remove from wishlist request
  // This ensures buyerId and productId are valid and properly formatted
  await removeFromWishlistValidator.validateRemoveFromWishlistData(buyerId, productId);

  // Step 2: Get buyer data from database
  // This retrieves the current buyer record with wishlist information
  const buyer = await buyerRepository.findById(buyerId);

  // Step 3: Check if product is in wishlist
  // This prevents removing non-existent products from wishlist
  if (!isProductInWishlist(buyer, productId)) {
    throw new NotFoundException('Product not found in wishlist');
  }

  // Step 4: Remove product from wishlist
  // This updates the buyer's wishlist array
  removeProductFromWishlist(buyer, productId);

  // Step 5: Save the updated buyer data
  // This persists the changes to the database
  await buyerRepository.saveBuyer(buyer);

  // Step 6: Return the updated wishlist
  return {
    wishlist: buyer.wishlist
  };
}

module.exports = {
  removeFromWishlist
}; 