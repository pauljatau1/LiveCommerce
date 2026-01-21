const orderRepository = require('../repositories/order.repository');
const mongoose = require('mongoose');
const terminalAPI = require('../../../config/terminalAPI');

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

    // Check if the shipment ID is a manually generated one
    if (shipmentId.startsWith('MANUAL-') || shipmentId.startsWith('PICKUP-')) {
      return { status: 400, data: { message: 'This order does not have a valid Terminal Africa shipment' } };
    }

    console.log(`Fetching rates for shipment ID: ${shipmentId}`);

    // Call Terminal Africa API to get rates for this shipment
    const ratesResponse = await terminalAPI.get(`/rates/shipment?shipment_id=${shipmentId}`);

    console.log('Terminal Africa Rates Response:', ratesResponse);
    // Log the response for debugging
    console.log('Terminal Africa Rates Response:', {
      status: ratesResponse.data.status,
      message: ratesResponse.data.message,
      data: ratesResponse.data.data,
      ratesCount: ratesResponse.data.data?.length || 0
    });

    if (!ratesResponse.data.status) {
      return { status: 400, data: { message: 'Failed to retrieve rates from Terminal Africa', error: ratesResponse.data.message } };
    }

    // Return the rates data
    return {
      status: 200,
      data: {
        message: 'Shipping rates retrieved successfully',
        order_id: order.order_id,
        orderId: order._id,
        shipment_id: shipmentId,
        rates: ratesResponse.data.data || []
      }
    };

  } catch (error) {
    console.error('Error in order service:', error);
    throw error;
  }
};