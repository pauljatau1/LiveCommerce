/**
 * Get Wishlist Service
 *
 * This service handles the business logic for retrieving a buyer's wishlist with
 * populated product and seller information. It provides functionality to:
 * - Validate buyer ID format and existence
 * - Retrieve wishlist items with populated product details
 * - Include seller information for each product
 * - Return formatted wishlist data for display
 * - Handle edge cases and data validation
 *
 * The service ensures that wishlist data is properly retrieved and formatted
 * with all necessary product and seller information for frontend consumption.
 *
 * @module getWishlistService
 */

const buyerRepository = require('../repositories/buyer.repository');
const getWishlistValidator = require('../validators/getWishlist.validator');

/**
 * Get buyer's wishlist with populated product and seller information.
 *
 * This function orchestrates the complete process of retrieving a buyer's
 * wishlist, including validation, data retrieval, and formatting.
 *
 * Business Logic Flow:
 * 1. Validate buyer ID format and existence
 * 2. Retrieve buyer with populated wishlist data
 * 3. Return formatted wishlist array
 *
 * Data Population:
 * - Product fields: name, description, price, images, category, brand, stock
 * - Seller fields: storeName, businessName
 * - Wishlist fields: product reference, addedAt timestamp
 * - Maintains original wishlist structure with enhanced product/seller data
 *
 * Security Considerations:
 * - Buyer ID validation prevents unauthorized access
 * - Buyer existence verification ensures data integrity
 * - Repository methods handle data population securely
 * - Proper error handling prevents information leakage
 *
 * @param {string} buyerId - The buyer's unique identifier
 * @returns {Promise<Array>} An array containing the buyer's wishlist items with populated data
 *   Each item contains:
 *   - product: {Object} - Product details (name, description, price, images, etc.)
 *   - seller: {Object} - Seller information (storeName, businessName)
 *   - addedAt: {Date} - When the item was added to wishlist
 * @throws {ValidationError} If buyerId is invalid or missing
 * @throws {NotFoundException} If buyer is not found
 * @throws {Error} If database operation fails
 * @example
 * // Get wishlist for a buyer
 * const wishlist = await getWishlist('507f1f77bcf86cd799439011');
 * // Returns: [
 * //   {
 * //     product: { name: 'Product Name', price: 99.99, ... },
 * //     seller: { storeName: 'Store Name', businessName: 'Business Name' },
 * //     addedAt: '2023-01-01T00:00:00.000Z'
 * //   }
 * // ]
 */
async function getWishlist(buyerId) {
  // Step 1: Validate the get wishlist request
  // This ensures buyerId is provided and has valid format, and buyer exists
  await getWishlistValidator.validateGetWishlistData(buyerId);

  // Step 2: Get buyer with populated wishlist data
  // This fetches the buyer record with wishlist items populated with product and seller details
  // The repository handles the complex population of nested references
  const buyer = await buyerRepository.findByIdWithPopulatedWishlist(buyerId);

  // Step 3: Return the formatted wishlist
  // Return the wishlist array directly since it's already properly formatted
  // with populated product and seller information
  return buyer.wishlist;
}

module.exports = {
  getWishlist
}; 