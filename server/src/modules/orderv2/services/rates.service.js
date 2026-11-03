const orderRepository = require('../repositories/order.repository');
const mongoose = require('mongoose');
const terminalAPI = require('../../../config/terminalAPI');

// Simple in-memory cache for rates (5-minute TTL)
// Key: shipment_id, Value: { rates, timestamp }
const ratesCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Clean up expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of ratesCache.entries()) {
    if (now - value.timestamp > CACHE_TTL_MS) {
      ratesCache.delete(key);
    }
  }
}, 60000); // Clean every minute

/**
 * Get rates directly by shipment_id - eliminates DB round-trip
 * Use this when you already have the shipment_id from createShipmentForOrder
 */
exports.getRatesByShipmentId = async (shipmentId) => {
  try {
    if (!shipmentId) {
      return { status: 400, data: { message: 'Shipment ID is required' } };
    }

    // Check if this is a manually generated shipment ID
    if (shipmentId.startsWith('MANUAL-') || shipmentId.startsWith('PICKUP-')) {
      return { status: 400, data: { message: 'This order does not have a valid Terminal Africa shipment' } };
    }

    // Check cache first
    const cached = ratesCache.get(shipmentId);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
      console.log(`[Rates Cache] HIT for shipment_id: ${shipmentId}`);
      return {
        status: 200,
        data: {
          message: 'Shipping rates retrieved successfully (cached)',
          shipment_id: shipmentId,
          rates: cached.rates,
          cached: true
        }
      };
    }

    console.log(`[Rates Cache] MISS for shipment_id: ${shipmentId}`);
    console.log(`Fetching rates for shipment ID: ${shipmentId}`);

    // Call Terminal Africa API to get rates for this shipment
    const ratesResponse = await terminalAPI.get(`/rates/shipment?shipment_id=${shipmentId}`);

    console.log('Terminal Africa Rates Response:', {
      status: ratesResponse.data.status,
      message: ratesResponse.data.message,
      ratesCount: ratesResponse.data.data?.length || 0
    });

    if (!ratesResponse.data.status) {
      return { status: 400, data: { message: 'Failed to retrieve rates from Terminal Africa', error: ratesResponse.data.message } };
    }

    const rates = ratesResponse.data.data || [];

    // Cache the rates
    ratesCache.set(shipmentId, { rates, timestamp: Date.now() });
    console.log(`[Rates Cache] Stored rates for shipment_id: ${shipmentId}`);

    // Return the rates data
    return {
      status: 200,
      data: {
        message: 'Shipping rates retrieved successfully',
        shipment_id: shipmentId,
        rates: rates,
        cached: false
      }
    };

  } catch (error) {
    console.error('Error fetching rates by shipment ID:', error);

    // Handle timeout specifically
    if (error.isTimeout) {
      return {
        status: 504,
        data: {
          message: 'Rate lookup timed out. Please try again.',
          error: error.message,
          isTimeout: true
        }
      };
    }

    throw error;
  }
};

/**
 * Get order rates by order ID (legacy function - requires DB query)
 * Consider using getRatesByShipmentId when you already have the shipment_id
 */
exports.getOrderRates = async (orderId) => {
  try {
    // Validate orderId
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return { status: 400, data: { message: 'Invalid order ID format' } };
    }

    // Find the order
    const order = await orderRepository.findOrderById(orderId);

    if (!order) {
      return { status: 404, data: { message: 'Order not found' } };
    }

    // Check if this is a store pickup order
    if (order.isStorePickup) {
      return { status: 400, data: { message: 'Store pickup orders do not have shipping rates' } };
    }

    // Get the shipment ID from the order
    const shipmentId = order.shipping?.shipment_id;

    if (!shipmentId) {
      return { status: 400, data: { message: 'No shipment ID found for this order' } };
    }

    // Use the optimized function that supports caching
    const ratesResult = await exports.getRatesByShipmentId(shipmentId);

    // Add order-specific data to the response
    if (ratesResult.status === 200) {
      ratesResult.data.order_id = order.order_id;
      ratesResult.data.orderId = order._id;
    }

    return ratesResult;

  } catch (error) {
    console.error('Error in order service:', error);
    throw error;
  }
};