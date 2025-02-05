const Order = require('../models/Order');
const Return = require('../models/Return');

/**
 * Validates if an order is eligible for return based on various criteria
 * @param {Object} order - The order object to check
 * @returns {Object} Object containing eligibility status and reason
 */
exports.validateReturnEligibility = async (order) => {
  try {
    // Check if order exists
    if (!order) {
      return {
        isEligible: false,
        reason: 'Order not found'
      };
    }

    // Check if order is already closed
    if (!order.isOpen) {
      return {
        isEligible: false,
        reason: 'Order is already closed'
      };
    }

    // Check delivery status using Terminal Africa tracking
    const allItemsDelivered = order.items.every(item => {
      // Check if the order has shipping tracking info
      if (!order.shipping?.tracking?.status) {
        return false;
      }
      return order.shipping.tracking.status.toLowerCase() === 'delivered';
    });

    if (!allItemsDelivered) {
      return {
        isEligible: false,
        reason: 'All items must be delivered before initiating return'
      };
    }

    // Get delivery date from Terminal Africa tracking
    const deliveryDate = order.shipping?.tracking?.history?.find(
      h => h.status.toLowerCase() === 'delivered'
    )?.timestamp;

    if (!deliveryDate) {
      return {
        isEligible: false,
        reason: 'Delivery date not found'
      };
    }

    const daysSinceDelivery = Math.floor((Date.now() - new Date(deliveryDate)) / (1000 * 60 * 60 * 24));
    if (daysSinceDelivery > 14) {
      return {
        isEligible: false,
        reason: 'Return window has expired (14 days from delivery)'
      };
    }

    // Check if return already exists for this order
    const existingReturn = await Return.findOne({ order: order._id });
    if (existingReturn) {
      return {
        isEligible: false,
        reason: 'Return request already exists for this order'
      };
    }

    // If all checks pass, order is eligible for return
    return {
      isEligible: true,
      reason: 'Order is eligible for return'
    };
  } catch (error) {
    console.error('Error in validateReturnEligibility:', error);
    return {
      isEligible: false,
      reason: 'Error validating return eligibility'
    };
  }
};

/**
 * Calculates refund amount based on return items and original order
 * @param {Object} order - Original order object
 * @param {Array} returnItems - Items being returned
 * @returns {Object} Calculated refund details
 */
exports.calculateRefundAmount = (order, returnItems) => {
  try {
    // Ensure returnItems is an array
    if (!Array.isArray(returnItems)) {
      throw new Error('Return items must be an array');
    }

    let totalRefund = 0;
    let itemizedBreakdown = [];

    returnItems.forEach(returnItem => {
      const orderItem = order.items.find(item => 
        item.product.toString() === returnItem.productId.toString()
      );

      if (orderItem) {
        const itemRefund = orderItem.price * returnItem.quantity;
        totalRefund += itemRefund;
        itemizedBreakdown.push({
          productId: returnItem.productId,
          quantity: returnItem.quantity,
          unitPrice: orderItem.price,
          subtotal: itemRefund
        });
      }
    });

    return {
      totalRefund,
      itemizedBreakdown,
      originalOrderTotal: order.total
    };
  } catch (error) {
    console.error('Error in calculateRefundAmount:', error);
    throw new Error('Failed to calculate refund amount');
  }
};

/**
 * Validates the condition evidence provided for return
 * @param {Array} evidence - Array of evidence files/urls
 * @returns {Object} Validation result
 */
exports.validateReturnEvidence = (evidence) => {
  // Ensure evidence is an array
  if (!Array.isArray(evidence)) {
    evidence = [];
  }

  // Minimum required evidence
  if (evidence.length === 0) {
    return {
      isValid: false,
      reason: 'At least one piece of evidence is required'
    };
  }

  // Maximum evidence limit
  if (evidence.length > 5) {
    return {
      isValid: false,
      reason: 'Maximum 5 pieces of evidence allowed'
    };
  }

  return {
    isValid: true,
    reason: 'Evidence validation passed'
  };
}; 