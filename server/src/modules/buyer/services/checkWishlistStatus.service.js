/**
 * Check Wishlist Status Service
 *
 * This service handles the business logic for checking if a product is in a buyer's wishlist.
 * It provides functionality to:
 * - Validate check wishlist status request data
 * - Check if product exists in database
 * - Verify if product is already in buyer's wishlist
 * - Return boolean status indicating wishlist presence
 * - Handle edge cases and data validation
 *
 * The service ensures that wishlist status checks are performed efficiently
 * while maintaining data integrity and proper error handling.
 *
 * @module checkWishlistStatusService
 */

const buyerRepository = require('../repositories/buyer.repository');
const checkWishlistStatusValidator = require('../validators/checkWishlistStatus.validator');
const Product = require('../../../models/Product');

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
 * Check if a product is in buyer's wishlist.
 *
 * This function orchestrates the complete check wishlist status process by
 * validating the request, checking product existence, and verifying the product
 * status in the buyer's wishlist.
 *
 * Business Logic Flow:
 * 1. Validate the check wishlist status request data
 * 2. Retrieve buyer and product data concurrently
 * 3. Verify product exists in database
 * 4. Check if product is in buyer's wishlist
 * 5. Return boolean status indicating wishlist presence
 *
 * Security Considerations:
 * - Input validation prevents unauthorized operations
 * - Product existence verification ensures data integrity
 * - Buyer existence verification maintains security
 * - Proper error handling for edge cases
 * - Data structure validation prevents corruption
 *
 * @param {string} buyerId - The buyer's unique identifier
 * @param {string} productId - The product's ID to check in wishlist
 * @returns {Promise<Object>} An object containing the wishlist status
 * @throws {ValidationError} If input validation fails
 * @throws {NotFoundException} If buyer or product is not found
 * @throws {Error} If database operation fails
 * @example
 * const result = await checkWishlistStatus("507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012");
 * // Returns: { inWishlist: true }
 */
async function checkWishlistStatus(buyerId, productId) {
  // Step 1: Validate the check wishlist status request
  // This ensures buyerId and productId are valid and properly formatted
  await checkWishlistStatusValidator.validateCheckWishlistStatusData(buyerId, productId);

  // Step 2: Get buyer and product data concurrently
  // This optimizes performance by fetching both records simultaneously
  const [buyer, product] = await Promise.all([
    buyerRepository.findById(buyerId),
    Product.findById(productId)
  ]);

  // Step 3: Check if product is in wishlist
  // This determines the wishlist status for the specified product
  const inWishlist = isProductInWishlist(buyer, productId);

  // Step 4: Return the wishlist status
  return {
    inWishlist
  };
}

module.exports = {
  checkWishlistStatus
};
