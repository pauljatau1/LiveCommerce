// services/orderService.js
const orderRepository = require('../repositories/order.repository');
const mongoose = require('mongoose');

exports.selectCarrier = async (orderId, carrierData) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { rate_id, amount, carrier_name, carrier_reference, carrier_logo, carrier_rate_description, delivery_time, pickup_time, delivery_eta, pickup_eta, delivery_date, pickup_date } = carrierData;

    // Validate required fields
    if (!rate_id || !amount || !carrier_name || !carrier_reference) {
      return { status: 400, data: { message: 'Missing required carrier information' } };
    }

    // Validate orderId
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return { status: 400, data: { message: 'Invalid order ID format' } };
    }

    // Find the order
    const order = await orderRepository.findOrderById(orderId, session);

    if (!order) {
      return { status: 404, data: { message: 'Order not found' } };
    }

    if (order.status !== 'draft') {
        return { status: 400, data: { message: `Cannot select carrier for order with status '${order.status}'` } };
    }

    // Check if this is a store pickup order
    if (order.isStorePickup) {
      return { status: 400, data: { message: 'Cannot select carrier for store pickup orders' } };
    }

    console.log(`Updating order ${order.order_id} with carrier information: ${carrier_name}, rate: ${rate_id}`);

    // Update the order with the selected carrier information
    order.shipping.carrier = {
      name: carrier_name,
      reference: carrier_reference,
      logo: carrier_logo,
      rate_description: carrier_rate_description
    };

    // Update shipping fee with the selected rate amount
    order.shipping.fee = {
      amount: amount,
      currency: 'NGN'
    };

    // Update delivery and pickup estimates
    if (delivery_date) {
      order.shipping.delivery = {
        ...order.shipping.delivery,
        estimatedDate: new Date(delivery_date)
      };
    }

    if (delivery_time) {
      order.shipping.estimatedDeliveryDate = delivery_time;
    }

    if (pickup_time) {
      order.shipping.estimatedPickupDate = pickup_time;
    }

    // Add rate information to the order
    order.shipping.rate_id = rate_id;
    order.shipping.delivery_eta = delivery_eta;
    order.shipping.pickup_eta = pickup_eta;

    // Calculate new order total with shipping
    order.totalAmount = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) + amount;

    // Update order status to pending_payment
    order.status = 'pending_payment';

    // Save the updated order
    await order.save({ session });

    // Shipment arrangement is now deferred until after payment.

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    // Prepare response
    const response = {
      message: 'Carrier selected successfully. Please proceed to payment.',
      order_id: order.order_id,
      shipment_id: order.shipping?.shipment_id,
      carrier: {
        name: carrier_name,
        reference: carrier_reference,
        rate_id: rate_id,
        amount: amount,
        delivery_time: delivery_time,
        pickup_time: pickup_time
      },
      totals: {
        itemsTotal: order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        shippingFee: amount,
        orderTotal: order.totalAmount
      }
    };

    return { status: 200, data: response };

  } catch (error) {
    // Abort the transaction if it's still active
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();

    console.error('Error in selectCarrier service:', error);
    throw error;
  }
};
