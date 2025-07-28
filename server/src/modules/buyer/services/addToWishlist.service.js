const buyerRepository = require('../repositories/buyer.repository');
const addToWishlistValidator = require('../validators/addToWishlist.validator');
const Product = require('../../../models/Product');
const InternalErrorException = require('../../../utils/errors/InternalErrorException');

/**
 * Check if product is already in buyer's wishlist.
 *
 * @param {Object} buyer - The buyer object
 * @param {string} productId - The product's ID
 * @returns {boolean} True if product is in wishlist
 */
function isProductInWishlist(buyer, productId) {
  return buyer.wishlist.some(
    item => item.product.toString() === productId
  );
}

/**
 * Add product to buyer's wishlist.
 *
 * @param {Object} buyer - The buyer object
 * @param {string} productId - The product's ID
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
 * This function orchestrates the add to wishlist process by:
 * - Validating the add to wishlist request
 * - Checking if the product exists
 * - Verifying the product is not already in wishlist
 * - Adding the product to the wishlist
 *
 * @param {string} buyerId - The buyer's ID
 * @param {string} productId - The product's ID to add to wishlist
 * @returns {Promise<Object>} An object containing the updated wishlist
 */
async function addToWishlist(buyerId, productId) {
  // Validate the add to wishlist request
  await addToWishlistValidator.validateAddToWishlistData(buyerId, productId);

  // Get buyer and product data
  const [buyer, product] = await Promise.all([
    buyerRepository.findById(buyerId),
    Product.findById(productId)
  ]);

  // Check if product is already in wishlist
  if (isProductInWishlist(buyer, productId)) {
    throw new InternalErrorException('Product already in wishlist');
  }

  // Add product to wishlist
  addProductToWishlist(buyer, productId);

  // Save the buyer
  await buyerRepository.saveBuyer(buyer);

  return {
    wishlist: buyer.wishlist
  };
}

module.exports = {
  addToWishlist
}; 