const crypto = require('crypto');
const Order = require('../models/Order');
const notificationController = require('../controllers/notificationController');

const verifyWebhookSignature = (signature, body, secret) => {
  const computedSignature = crypto
    .createHmac('sha512', secret)
    .update(JSON.stringify(body))
    .digest('hex');
  return signature === computedSignature;
};

const handleShipmentUpdate = async (shipmentData) => {
  const order = await Order.findOne({ 'shipping.tracking.number': shipmentData.tracking_number });
  if (!order) return;

  // Update shipping status
  order.shipping.tracking.status = shipmentData.status;
  order.shipping.tracking.lastUpdate = new Date();
  order.shipping.tracking.history.push({
    status: shipmentData.status,
    location: shipmentData.location,
    timestamp: new Date()
  });

  await order.save();

  // Send notifications
  await notificationController.createNotification(
    order.buyer,
    'shipping_update',
    'Shipping Update',
    `Your order #${order._id} is now ${shipmentData.status}`,
    { orderId: order._id }
  );
};

const handleDeliveryException = async (exceptionData) => {
  const order = await Order.findOne({ 'shipping.tracking.number': exceptionData.tracking_number });
  if (!order) return;

  order.shipping.tracking.status = 'exception';
  order.notes.push({
    type: 'system',
    content: `Delivery exception: ${exceptionData.reason}`,
    createdAt: new Date()
  });

  await order.save();

  // Send notifications
  await notificationController.createNotification(
    order.buyer,
    'shipping_exception',
    'Delivery Exception',
    `There's an issue with your order #${order._id}: ${exceptionData.reason}`,
    { orderId: order._id }
  );
};

const handleShipmentCreated = async (data) => {
  try {
    const order = await Order.findOne({ 'shipping.shipment_id': data.shipment_id });
    if (!order) {
      console.log('No order found for shipment:', data.shipment_id);
      return;
    }

    // Update order with shipment details
    order.shipping = {
      ...order.shipping,
      status: data.status,
      fee: data.shipment_cost || 0,
      carrier: {
        name: data.carrier_name,
        reference: data.carrier_slug
      },
      tracking: {
        number: data.tracking_number,
        url: data.carrier_tracking_url,
        status: data.status,
        carrier: data.carrier_name,
        lastUpdate: new Date(),
        history: [{
          status: data.status,
          location: data.events[0]?.location,
          timestamp: new Date(),
          description: data.events[0]?.description
        }]
      },
      documents: {
        shippingLabel: data.shipping_label_url,
        commercialInvoice: data.commercial_invoice_url
      },
      delivery: {
        estimatedDate: data.delivery_date,
        actualDate: null
      }
    };

    await order.save();
    console.log('Order updated with shipment details:', order._id);

    // Notify buyer
    await notificationController.createNotification(
      order.buyer,
      'shipment_created',
      'Shipment Created',
      `Your shipment for order #${order._id} has been created. Tracking number: ${data.tracking_number}`,
      { orderId: order._id }
    );
  } catch (error) {
    console.error('Error handling shipment.created:', error);
  }
};

const handleShipmentInTransit = async (data) => {
  try {
    const order = await Order.findOne({ 'shipping.shipment_id': data.shipment_id });
    if (!order) return;

    // Update tracking history
    order.shipping.tracking.status = data.status;
    order.shipping.tracking.lastUpdate = new Date();
    order.shipping.tracking.history.push({
      status: data.status,
      location: data.events[0]?.location,
      timestamp: new Date(),
      description: data.events[0]?.description
    });

    await order.save();

    // Notify buyer
    await notificationController.createNotification(
      order.buyer,
      'order_updated',
      'Shipment In Transit',
      `Your order #${order._id} is now in transit. Current location: ${data.events[0]?.location}`,
      { orderId: order._id }
    );
  } catch (error) {
    console.error('Error handling shipment.in-transit:', error);
  }
};

const handleShipmentDelivered = async (data) => {
  try {
    const order = await Order.findOne({ 'shipping.shipment_id': data.shipment_id });
    if (!order) return;

    // Update order status
    order.shipping.tracking.status = data.status;
    order.shipping.tracking.lastUpdate = new Date();
    order.shipping.tracking.history.push({
      status: data.status,
      location: data.events[0]?.location,
      timestamp: new Date(),
      description: data.events[0]?.description
    });
    
    if (!order.shipping.delivery) {
      order.shipping.delivery = {};
    }
    order.shipping.delivery.actualDate = new Date();

    await order.save();

    // Notify both parties
    await Promise.all([
      notificationController.createNotification(
        order.buyer,
        'order_delivered',
        'Order Delivered',
        `Your order #${order._id} has been delivered!`,
        { orderId: order._id }
      ),
      notificationController.createNotification(
        order.seller,
        'order_delivered',
        'Order Delivered',
        `Order #${order._id} has been delivered to the customer`,
        { orderId: order._id }
      )
    ]);
  } catch (error) {
    console.error('Error handling shipment.delivered:', error);
  }
};

module.exports = {
  handleWebhook: async (req, res) => {
    const signature = req.headers['x-terminal-signature'];
    console.log('Received Terminal webhook:', {
      event: req.body.event,
      signature: signature?.substring(0, 10) + '...' // Log partial signature for debugging
    });
    
    if (!verifyWebhookSignature(signature, req.body, process.env.TERMINAL_SECRET_KEY)) {
      console.log('Invalid webhook signature');
      return res.status(401).json({ message: 'Invalid signature' });
    }

    const { event, data } = req.body;
    console.log('Processing webhook event:', event);

    try {
      switch (event) {
        case 'shipment.created':
          await handleShipmentCreated(data);
          break;
        case 'shipment.status.updated':
          await handleShipmentUpdate(data);
          break;
        case 'shipment.exception':
          await handleDeliveryException(data);
          break;
        case 'shipment.delivered':
          await handleShipmentDelivered(data);
          break;
        case 'shipment.in-transit':
          await handleShipmentInTransit(data);
          break;
        default:
          console.log('Unhandled webhook event:', event);
      }

      console.log('Webhook processed successfully');
      res.json({ received: true });
    } catch (error) {
      console.error('Webhook handling error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  },
  handleShipmentCreated,
  handleShipmentInTransit,
  handleShipmentDelivered
}; 