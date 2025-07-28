const buyerRepository = require('../repositories/buyer.repository');
const getWishlistValidator = require('../validators/getWishlist.validator');

/**
 * Get buyer's wishlist with populated product and seller information.
 *
 * This function orchestrates the get wishlist process by:
 * - Validating the get wishlist request
 * - Retrieving buyer with populated wishlist data
 * - Returning the formatted wishlist
 *
 * @param {string} buyerId - The buyer's ID
 * @returns {Promise<Array>} An array containing the buyer's wishlist items
 */
async function getWishlist(buyerId) {
  // Validate the get wishlist request
  await getWishlistValidator.validateGetWishlistData(buyerId);

  // Get buyer with populated wishlist data
  const buyer = await buyerRepository.findByIdWithPopulatedWishlist(buyerId);

  return buyer.wishlist;
}

module.exports = {
  getWishlist
}; 