/**
 * Check Wishlist Status Validator
 *
 * This validator handles validation for check wishlist status requests.
 * It provides functionality to:
 * - Validate buyer ID format and existence
 * - Validate product ID format and existence
 * - Ensure proper data types and formats
 * - Handle edge cases and validation errors
 *
 * The validator ensures that all check wishlist status requests are properly
 * validated before processing to maintain data integrity and security.
 *
 * @module checkWishlistStatusValidator
 */

const buyerRepository = require('../repositories/buyer.repository');
const Product = require('../../../models/Product');
const ValidationError = require('../../../utils/errors/ValidationError');
const NotFoundException = require('../../../utils/errors/NotFoundException');

/**
 * Validate check wishlist status request data.
 *
 * This function validates the buyer ID and product ID for check wishlist status requests.
 * It ensures both IDs are valid MongoDB ObjectIds and that both the buyer and product exist.
 *
 * Validation Rules:
 * - buyerId must be a valid MongoDB ObjectId
 * - productId must be a valid MongoDB ObjectId
 * - buyer must exist in the database
 * - product must exist in the database
 * - Both IDs must be non-empty strings
 *
 * @param {string} buyerId - The buyer's unique identifier
 * @param {string} productId - The product's ID to check in wishlist
 * @throws {ValidationError} If buyerId or productId is invalid
 * @throws {NotFoundException} If buyer or product is not found
 * @example
 * await validateCheckWishlistStatusData('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012');
 */
async function validateCheckWishlistStatusData(buyerId, productId) {
  // Validate buyer ID format and existence
  if (!buyerId || typeof buyerId !== 'string' || buyerId.trim() === '') {
    throw new ValidationError('Buyer ID is required and must be a valid string');
  }

  // Check if buyer ID is a valid MongoDB ObjectId format
  if (!/^[0-9a-fA-F]{24}$/.test(buyerId.trim())) {
    throw new ValidationError('Buyer ID must be a valid MongoDB ObjectId');
  }

  // Validate product ID format and existence
  if (!productId || typeof productId !== 'string' || productId.trim() === '') {
    throw new ValidationError('Product ID is required and must be a valid string');
  }

  // Check if product ID is a valid MongoDB ObjectId format
  if (!/^[0-9a-fA-F]{24}$/.test(productId.trim())) {
    throw new ValidationError('Product ID must be a valid MongoDB ObjectId');
  }

  // Check if buyer exists
  const buyer = await buyerRepository.findById(buyerId.trim());
  if (!buyer) {
    throw new NotFoundException('Buyer not found');
  }

  // Check if product exists
  const product = await Product.findById(productId.trim());
  if (!product) {
    throw new NotFoundException('Product not found');
  }
}

module.exports = {
  validateCheckWishlistStatusData
};
