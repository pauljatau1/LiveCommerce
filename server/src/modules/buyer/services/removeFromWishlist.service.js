const buyerRepository = require('../repositories/buyer.repository');
const removeFromWishlistValidator = require('../validators/removeFromWishlist.validator');
const NotFoundException = require('../../../utils/errors/NotFoundException');

/**
 * Check if product exists in buyer's wishlist.
 *
 * @param {Object} buyer - The buyer object
 * @param {string} productId - The product's ID
 * @returns {boolean} True if product is in wishlist
 */
function isProductInWishlist(buyer, productId) {
  if (!buyer.wishlist || !Array.isArray(buyer.wishlist)) {
    return false;
  }
  
  return buyer.wishlist.some(
    item => item.product.toString() === productId
  );
}

/**
 * Remove product from buyer's wishlist.
 *
 * @param {Object} buyer - The buyer object
 * @param {string} productId - The product's ID
 */
function removeProductFromWishlist(buyer, productId) {
  if (!buyer.wishlist || !Array.isArray(buyer.wishlist)) {
    buyer.wishlist = [];
    return;
  }
  
  buyer.wishlist = buyer.wishlist.filter(
    item => item.product.toString() !== productId
  );
}

/**
 * Remove a product from buyer's wishlist.
 *
 * This function orchestrates the remove from wishlist process by:
 * - Validating the remove from wishlist request
 * - Checking if the product exists in wishlist
 * - Removing the product from the wishlist
 * - Saving the updated buyer data
 *
 * @param {string} buyerId - The buyer's ID
 * @param {string} productId - The product's ID to remove from wishlist
 * @returns {Promise<Object>} An object containing the updated wishlist
 */
async function removeFromWishlist(buyerId, productId) {
  // Validate the remove from wishlist request
  await removeFromWishlistValidator.validateRemoveFromWishlistData(buyerId, productId);

  // Get buyer data
  const buyer = await buyerRepository.findById(buyerId);

  // Check if product is in wishlist
  if (!isProductInWishlist(buyer, productId)) {
    throw new NotFoundException('Product not found in wishlist');
  }

  // Remove product from wishlist
  removeProductFromWishlist(buyer, productId);

  // Save the buyer
  await buyerRepository.saveBuyer(buyer);

  return {
    wishlist: buyer.wishlist
  };
}

module.exports = {
  removeFromWishlist
}; 