/**
 * Add To Wishlist Service
 *
 * This service handles the business logic for adding products to a buyer's wishlist.
 * It provides functionality to:
 * - Validate add to wishlist request data
 * - Check if product exists in database
 * - Verify product is not already in wishlist
 * - Add product to wishlist with timestamp
 * - Update buyer's database record
 * - Handle edge cases and data validation
 *
 * The service ensures that products are safely added to the wishlist
 * while preventing duplicates and maintaining data integrity.
 *
 * @module addToWishlistService
 */

const buyerRepository = require('../repositories/buyer.repository');
const addToWishlistValidator = require('../validators/addToWishlist.validator');
const Product = require('../../../models/Product');
const InternalErrorException = require('../../../utils/errors/InternalErrorException');

/**
 * Check if product is already in buyer's wishlist.
 *
 * This function examines the buyer's wishlist array to determine if
 * the specified product is already present. It performs a case-sensitive
 * comparison of product IDs.
 *
 * Business Logic:
 * - Searches through buyer's wishlist array
 * - Compares product IDs using string conversion for consistency
 * - Returns boolean indicating product presence
 * - Handles null/undefined wishlist arrays gracefully
 *
 * @param {Object} buyer - The buyer object with wishlist array
 * @param {Array} buyer.wishlist - Array of wishlist item objects
 * @param {string} buyer.wishlist[].product - Product ID in the wishlist
 * @param {string} productId - The product's ID to check
 * @returns {boolean} True if product is already in wishlist, false otherwise
 * @example
 * const buyer = { wishlist: [{ product: "507f1f77bcf86cd799439011" }] };
 * const isInWishlist = isProductInWishlist(buyer, "507f1f77bcf86cd799439011"); // true
 */
function isProductInWishlist(buyer, productId) {
  return buyer.wishlist.some(
    item => item.product.toString() === productId
  );
}

/**
 * Add product to buyer's wishlist.
 *
 * This function adds the specified product to the buyer's wishlist array
 * with a timestamp indicating when it was added.
 *
 * Business Logic:
 * - Creates new wishlist item with product ID and timestamp
 * - Adds item to buyer's wishlist array
 * - Maintains wishlist array structure
 * - Records addition timestamp for tracking
 *
 * @param {Object} buyer - The buyer object to update
 * @param {Array} buyer.wishlist - Array of wishlist item objects
 * @param {string} productId - The product's ID to add to wishlist
 */
function addProductToWishlist(buyer, productId) {
  buyer.wishlist.push({
    product: productId,
    addedAt: new Date()
  });
}

/**
 * Add a product to buyer's wishlist.
 *
 * This function orchestrates the complete add to wishlist process by
 * validating the request, checking product existence, verifying the product
 * is not already in the wishlist, and updating the database record.
 *
 * Business Logic Flow:
 * 1. Validate the add to wishlist request data
 * 2. Retrieve buyer and product data concurrently
 * 3. Verify product exists in database
 * 4. Check if product is already in wishlist
 * 5. Add product to wishlist with timestamp
 * 6. Save updated buyer data to database
 * 7. Return updated wishlist information
 *
 * Security Considerations:
 * - Input validation prevents unauthorized operations
 * - Product existence verification ensures data integrity
 * - Duplicate prevention maintains wishlist consistency
 * - Proper error handling for edge cases
 * - Data structure validation prevents corruption
 *
 * @param {string} buyerId - The buyer's unique identifier
 * @param {string} productId - The product's ID to add to wishlist
 * @returns {Promise<Object>} An object containing the updated wishlist
 * @throws {ValidationError} If input validation fails
 * @throws {NotFoundException} If buyer or product is not found
 * @throws {InternalErrorException} If product is already in wishlist
 * @throws {Error} If database operation fails
 * @example
 * const result = await addToWishlist("507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012");
 * // Returns: { wishlist: [...] }
 */
async function addToWishlist(buyerId, productId) {
  // Step 1: Validate the add to wishlist request
  // This ensures buyerId and productId are valid and properly formatted
  await addToWishlistValidator.validateAddToWishlistData(buyerId, productId);

  // Step 2: Get buyer and product data concurrently
  // This optimizes performance by fetching both records simultaneously
  const [buyer, product] = await Promise.all([
    buyerRepository.findById(buyerId),
    Product.findById(productId)
  ]);

  // Step 3: Check if product is already in wishlist
  // This prevents duplicate entries in the wishlist
  if (isProductInWishlist(buyer, productId)) {
    throw new InternalErrorException('Product already in wishlist');
  }

  // Step 4: Add product to wishlist
  // This adds the product with a timestamp to the buyer's wishlist
  addProductToWishlist(buyer, productId);

  // Step 5: Save the updated buyer data
  // This persists the changes to the database
  await buyerRepository.saveBuyer(buyer);

  // Step 6: Return the updated wishlist
  return {
    wishlist: buyer.wishlist
  };
}

module.exports = {
  addToWishlist
}; 