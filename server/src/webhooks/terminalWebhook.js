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

module.exports = {
  handleWebhook: async (req, res) => {
    const signature = req.headers['x-terminal-signature'];
    
    if (!verifyWebhookSignature(signature, req.body, process.env.TERMINAL_SECRET_KEY)) {
      return res.status(401).json({ message: 'Invalid signature' });
    }

    const { event, data } = req.body;

    try {
      switch (event) {
        case 'shipment.status.updated':
          await handleShipmentUpdate(data);
          break;
        case 'shipment.exception':
          await handleDeliveryException(data);
          break;
        // Add more event handlers as needed
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Webhook handling error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }
}; 