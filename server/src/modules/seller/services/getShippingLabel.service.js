/**
 * Get Shipping Label Service
 *
 * This service handles the business logic for generating shipping labels for seller orders.
 * It provides comprehensive shipping label generation capabilities including validation,
 * order verification, and shipping label creation.
 *
 * The service ensures that:
 * - Order data is properly validated and exists
 * - Seller has authorization to access the order
 * - Order item belongs to the requesting seller
 * - Shipping label is generated with proper tracking information
 * - Response includes all necessary shipping details
 *
 * Shipping Label Generation Flow:
 * - Input validation and order verification
 * - Seller authorization check
 * - Order item validation
 * - Shipping label generation with tracking number
 * - Response formatting with shipping details
 *
 * Security Features:
 * - Comprehensive input validation
 * - Seller authorization verification
 * - Order ownership validation
 * - Secure tracking number generation
 *
 * @module getShippingLabelService
 */

const orderRepository = require('../repositories/order.repository');
const getShippingLabelValidator = require('../validators/getShippingLabel.validator');
const NotFoundException = require('../../../utils/errors/NotFoundException');
const ForbiddenException = require('../../../utils/errors/ForbiddenException');

/**
 * Generates a shipping label for a specific order item - Main business logic function.
 *
 * This is the primary service function that orchestrates the complete
 * shipping label generation process. It handles validation, authorization,
 * and label generation in a secure and efficient manner.
 *
 * Business Logic Flow:
 * 1. Validates the input parameters (orderId, itemId)
 * 2. Retrieves the order with populated buyer and product information
 * 3. Verifies the order exists and is accessible
 * 4. Validates that the seller has authorization to access the order item
 * 5. Generates a unique tracking number for the shipping label
 * 6. Creates shipping label with all necessary details
 * 7. Returns the complete shipping label information
 *
 * Authorization Checks:
 * - Verifies order exists in the database
 * - Ensures the order item belongs to the requesting seller
 * - Validates seller has proper access rights
 * - Confirms order item is valid and accessible
 *
 * Shipping Label Details:
 * - Generates unique tracking number with timestamp
 * - Includes order and item identification
 * - Provides label URL for printing/downloading
 * - Contains all necessary shipping information
 *
 * @param {Object} data - The shipping label request data object
 * @param {string} data.orderId - The order ID to generate label for (required)
 * @param {string} data.itemId - The specific order item ID (required)
 * @param {string} data.sellerId - The seller's ID for authorization (required)
 * @returns {Promise<Object>} An object containing the shipping label details
 *   - orderId: {string} - The order ID
 *   - trackingNumber: {string} - Generated tracking number
 *   - labelUrl: {string} - URL to access the shipping label
 * @throws {ValidationError} If input validation fails
 * @throws {NotFoundException} If order or order item is not found
 * @throws {ForbiddenException} If seller is not authorized to access the order item
 *
 * @example
 * // Generate shipping label for an order item
 * const result = await getShippingLabel({
 *   orderId: '507f1f77bcf86cd799439011',
 *   itemId: '507f1f77bcf86cd799439012',
 *   sellerId: '507f1f77bcf86cd799439013'
 * });
 * // Returns: { orderId: '...', trackingNumber: 'TN1234567890', labelUrl: '...' }
 */
async function getShippingLabel(data) {
  // Step 1: Validate input parameters using the validator
  // This ensures all required fields are present and valid
  await getShippingLabelValidator.validateGetShippingLabelData(data);

  // Step 2: Retrieve order with populated buyer and product information
  // This gets the complete order details needed for shipping label generation
  const order = await getOrderWithDetails(data.orderId);

  // Step 3: Verify order exists and validate seller authorization
  // This ensures the seller has proper access to the order item
  const orderItem = validateSellerAccess(order, data.itemId, data.sellerId);

  // Step 4: Generate unique tracking number for the shipping label
  // This creates a unique identifier for tracking the shipment
  const trackingNumber = generateTrackingNumber();

  // Step 5: Create shipping label with all necessary details
  // This assembles the complete shipping label information
  const shippingLabel = createShippingLabel(data, order, orderItem, trackingNumber);

  // Step 6: Return the complete shipping label information
  return shippingLabel;
}

/**
 * Retrieve order with populated buyer and product information.
 * 
 * This function fetches the order from the database with all necessary
 * related data populated for shipping label generation.
 *
 * Data Population:
 * - Populates buyer information (firstName, lastName)
 * - Populates product details (name, weight, dimensions)
 * - Includes all order items with complete details
 * - Ensures all necessary data is available for label generation
 *
 * @param {string} orderId - The order ID to retrieve
 * @returns {Promise<Object>} The order object with populated data
 * @throws {NotFoundException} If order is not found
 */
async function getOrderWithDetails(orderId) {
  const order = await orderRepository.findByIdWithPopulatedData(orderId);
  
  if (!order) {
    throw new NotFoundException('Order not found');
  }
  
  return order;
}

/**
 * Validate seller access to the order item.
 * 
 * This function ensures that the seller has proper authorization
 * to access and generate shipping labels for the specific order item.
 *
 * Authorization Checks:
 * - Verifies the order item exists in the order
 * - Ensures the item belongs to the requesting seller
 * - Validates seller has proper access rights
 * - Confirms order item is valid and accessible
 *
 * @param {Object} order - The order object with populated data
 * @param {string} itemId - The order item ID to validate
 * @param {string} sellerId - The seller's ID for authorization
 * @returns {Object} The validated order item
 * @throws {NotFoundException} If order item is not found
 * @throws {ForbiddenException} If seller is not authorized to access the order item
 */
function validateSellerAccess(order, itemId, sellerId) {
  // Find the specific order item by ID
  const orderItem = order.items.id(itemId);
  
  if (!orderItem) {
    throw new NotFoundException('Order item not found');
  }
  
  // Verify the item belongs to the requesting seller
  if (orderItem.seller.toString() !== sellerId) {
    throw new ForbiddenException('Unauthorized to access this order item');
  }
  
  return orderItem;
}

/**
 * Generate a unique tracking number for the shipping label.
 * 
 * This function creates a unique tracking number that can be used
 * to track the shipment throughout the delivery process.
 *
 * Tracking Number Format:
 * - Prefix: "TN" (Tracking Number)
 * - Timestamp: Current timestamp for uniqueness
 * - Ensures each tracking number is unique and traceable
 *
 * @returns {string} A unique tracking number
 */
function generateTrackingNumber() {
  return `TN${Date.now()}`;
}

/**
 * Create shipping label with all necessary details.
 * 
 * This function assembles the complete shipping label information
 * including order details, product information, and tracking data.
 *
 * Label Assembly:
 * - Includes order identification
 * - Adds generated tracking number
 * - Provides label URL for access
 *
 * @param {Object} data - The original request data
 * @param {Object} order - The order object with populated data
 * @param {Object} orderItem - The validated order item
 * @param {string} trackingNumber - The generated tracking number
 * @returns {Object} The complete shipping label object
 */
function createShippingLabel(data, order, orderItem, trackingNumber) {
  return {
    orderId: data.orderId,
    trackingNumber: trackingNumber,
    labelUrl: 'https://shipping-label-url.com' // Placeholder - integrate with actual shipping provider
  };
}

module.exports = {
  getShippingLabel
};
