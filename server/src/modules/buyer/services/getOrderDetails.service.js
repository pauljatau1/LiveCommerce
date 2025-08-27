/**
 * Get Order Details Service
 *
 * This service handles the business logic for retrieving detailed information
 * about a specific order for a buyer. It provides secure order access and
 * validation to ensure buyers can only access their own orders.
 *
 * The service ensures that:
 * - Order access is properly validated and secured
 * - Only the order owner can access order details
 * - Order information is retrieved efficiently
 * - Error handling maintains system integrity
 *
 * Order Details Retrieval Flow:
 * - Input validation and order ID verification
 * - Buyer ownership validation
 * - Order retrieval with complete details
 * - Security verification and access control
 * - Success response with order information
 *
 * Security Features:
 * - Order ownership validation
 * - Buyer ID verification
 * - Access control enforcement
 * - Error handling without information leakage
 * - Secure order data retrieval
 *
 * Access Control:
 * - Validates buyer ownership of order
 * - Prevents unauthorized order access
 * - Ensures data privacy and security
 * - Maintains order confidentiality
 *
 * @module getOrderDetailsService
 */

const buyerRepository = require('../repositories/buyer.repository');
const { validateGetOrderDetailsData } = require('../validators/getOrderDetails.validator');
const NotFoundException = require('../../../utils/errors/NotFoundException');

/**
 * Retrieves detailed information about a specific order for a buyer - Main business logic function.
 *
 * This is the primary service function that orchestrates the complete
 * order details retrieval process. It handles validation, access control,
 * and secure order data retrieval for buyers.
 *
 * Business Logic Flow:
 * 1. Validates the input data (order ID format and requirements)
 * 2. Finds the order that belongs to the specific buyer
 * 3. Validates order ownership and access rights
 * 4. Returns complete order details
 *
 * Security Features:
 * - Comprehensive input validation before processing
 * - Order ownership validation
 * - Buyer ID verification for access control
 * - Secure order data retrieval
 * - Error handling without information leakage
 *
 * Access Control:
 * - Validates that order belongs to the requesting buyer
 * - Prevents unauthorized access to other buyers' orders
 * - Ensures data privacy and security
 * - Maintains order confidentiality
 *
 * Order Data:
 * - Complete order information
 * - Product details and quantities
 * - Payment and shipping information
 * - Order status and timestamps
 * - Seller information
 *
 * Error Handling:
 * - Validation errors for invalid inputs
 * - NotFoundException for non-existent orders
 * - Access control violations
 * - Database operation errors
 * - Proper error propagation to controller
 *
 * @param {string} buyerId - The buyer's ID for ownership validation
 * @param {string} orderId - The order's ID to retrieve details for
 * @returns {Promise<Object>} Complete order details with all information
 *   - _id: {string} - Order ID
 *   - buyer: {string} - Buyer ID
 *   - seller: {string} - Seller ID
 *   - products: {Array} - Array of ordered products
 *   - totalAmount: {number} - Total order amount
 *   - status: {string} - Order status
 *   - paymentStatus: {string} - Payment status
 *   - shippingAddress: {Object} - Shipping address details
 *   - createdAt: {Date} - Order creation timestamp
 *   - updatedAt: {Date} - Order last update timestamp
 * @throws {ValidationError} If input validation fails (invalid order ID)
 * @throws {NotFoundException} If order is not found or doesn't belong to buyer
 * @throws {Error} If database operations fail
 *
 * @example
 * // Get order details for buyer
 * const orderDetails = await getOrderDetails('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012');
 * // Returns: {
 * //   _id: '507f1f77bcf86cd799439012',
 * //   buyer: '507f1f77bcf86cd799439011',
 * //   products: [...],
 * //   totalAmount: 299.99,
 * //   status: 'pending',
 * //   ...
 * // }
 *
 * @example
 * // Failed access - order doesn't belong to buyer
 * try {
 *   await getOrderDetails('buyer1', 'order2'); // order2 belongs to different buyer
 * } catch (error) {
 *   // error instanceof NotFoundException
 *   // error.message: 'Order not found'
 * }
 */
async function getOrderDetails(buyerId, orderId) {
  // Step 1: Validate input data using the validator
  // This ensures order ID format is correct and meets requirements
  await validateGetOrderDetailsData({ id: orderId });

  // Step 2: Find the order that belongs to the buyer
  // This ensures the order exists and belongs to the requesting buyer
  const order = await buyerRepository.findOrderByIdAndBuyer(orderId, buyerId);
  
  // Step 3: Check if order exists and belongs to buyer
  // This prevents unauthorized access to other buyers' orders
  if (!order) {
    throw new NotFoundException('Order not found');
  }

  // Step 4: Return complete order details
  // The order object contains all necessary information for display
  return order;
}

module.exports = {
  getOrderDetails
}; 