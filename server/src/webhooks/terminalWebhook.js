const crypto = require('crypto');
const Order = require('../models/Order');
const notificationController = require('../controllers/notificationController');
const sgMail = require('@sendgrid/mail');
const {
  getShipmentCreatedEmailTemplate,
  getShipmentInTransitEmailTemplate,
  getShipmentDeliveredEmailTemplate,
  getShipmentCancelledEmailTemplate
} = require('../templates/shipmentEmailTemplates');

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
    console.log('Processing shipment.created webhook:', {
      shipmentId: data.shipment_id,
      trackingNumber: data.tracking_number,
      status: data.status
    });

    const order = await Order.findOne({ 'shipping.shipment_id': data.shipment_id })
      .populate('buyer', 'email firstName lastName')
      .populate('seller', 'email firstName lastName');

    if (!order) {
      console.log('No order found for shipment:', data.shipment_id);
      return;
    }

    console.log('Found order:', order._id);
    console.log('Buyer email:', order.buyer.email);
    console.log('Seller email:', order.seller.email);

    // Preserve existing shipping data and update only necessary fields
    const updatedShipping = {
      ...order.shipping.toObject(), // Convert to plain object
      status: data.status,
      tracking: {
        ...order.shipping.tracking, // Preserve existing tracking data
        number: data.tracking_number,
        url: data.carrier_tracking_url,
        status: data.status,
        lastUpdate: new Date(),
        history: [
          ...(order.shipping.tracking.history || []),
          {
            status: data.status,
            location: data.events[0]?.location || 'Unknown',
            timestamp: new Date(),
            description: data.events[0]?.description || 'Shipment created'
          }
        ]
      },
      documents: {
        ...order.shipping.documents, // Preserve existing documents
        shippingLabel: data.shipping_label_url,
        commercialInvoice: data.commercial_invoice_url
      }
    };

    console.log('Updated shipping object:', updatedShipping);

    // Update order using findOneAndUpdate to ensure atomic operation
    const updatedOrder = await Order.findOneAndUpdate(
      { _id: order._id },
      { $set: { shipping: updatedShipping } },
      { new: true, runValidators: true }
    );

    if (!updatedOrder) {
      throw new Error('Failed to update order');
    }

    console.log('Order updated successfully');

    // Send emails with error handling
    try {
      const emailTemplate = getShipmentCreatedEmailTemplate(order, data.tracking_number);
      const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'joseph@auqli.com';
      
      if (!order.buyer.email || !order.seller.email) {
        throw new Error('Missing recipient email addresses');
      }

      console.log('Preparing to send emails:', {
        from: fromEmail,
        buyer: order.buyer.email,
        seller: order.seller.email
      });

      // Send buyer email
      await sgMail.send({
        to: order.buyer.email,
        from: fromEmail,
        subject: emailTemplate.buyer.subject,
        html: emailTemplate.buyer.html
      });

      // Send seller email
      await sgMail.send({
        to: order.seller.email,
        from: fromEmail,
        subject: emailTemplate.seller.subject,
        html: emailTemplate.seller.html
      });

      console.log('Shipment created emails sent successfully');
    } catch (emailError) {
      console.error('Error sending shipment created emails:', {
        error: emailError.message,
        stack: emailError.stack,
        buyerEmail: order.buyer.email,
        sellerEmail: order.seller.email
      });
    }

    // Continue with notifications
    await Promise.all([
      notificationController.createNotification(
        order.buyer,
        'shipment_created',
        'Shipment Created',
        `Your shipment for order #${order._id} has been created. Tracking number: ${data.tracking_number}`,
        { orderId: order._id }
      ),
      notificationController.createNotification(
        order.seller,
        'shipment_created',
        'Shipment Created',
        `Shipment created for order #${order._id}. Tracking number: ${data.tracking_number}`,
        { orderId: order._id }
      )
    ]);

  } catch (error) {
    console.error('Error in handleShipmentCreated:', error);
    throw error;
  }
};

const handleShipmentInTransit = async (data) => {
  try {
    console.log('Processing shipment.in-transit webhook:', {
      shipmentId: data.shipment_id,
      trackingNumber: data.tracking_number,
      status: data.status
    });

    const order = await Order.findOne({ 'shipping.shipment_id': data.shipment_id })
      .populate('buyer', 'email firstName lastName');

    if (!order) {
      console.log('No order found for shipment:', data.shipment_id);
      return;
    }

    console.log('Found order:', order._id);

    // Update tracking history
    const updatedShipping = {
      ...order.shipping.toObject(),
      status: data.status,
      tracking: {
        ...order.shipping.tracking,
        status: data.status,
        lastUpdate: new Date(),
        history: [
          ...(order.shipping.tracking.history || []),
          {
            status: data.status,
            location: data.events[0]?.location || 'Unknown',
            timestamp: new Date(),
            description: data.events[0]?.description || 'Shipment in transit'
          }
        ]
      }
    };

    // Update order using findOneAndUpdate
    const updatedOrder = await Order.findOneAndUpdate(
      { _id: order._id },
      { $set: { shipping: updatedShipping } },
      { new: true, runValidators: true }
    );

    if (!updatedOrder) {
      throw new Error('Failed to update order');
    }

    // Send email with error handling
    try {
      if (!order.buyer.email) {
        throw new Error('Missing buyer email address');
      }

      const emailTemplate = getShipmentInTransitEmailTemplate(
        order, 
        data.events[0]?.location
      );
      
      await sgMail.send({
        to: order.buyer.email,
        from: {
          email: process.env.SENDGRID_FROM_EMAIL,
          name: 'Auqli Shipping'
        },
        ...emailTemplate.buyer
      });

      console.log('Shipment in transit email sent successfully');
    } catch (emailError) {
      console.error('Error sending in-transit email:', {
        error: emailError.message,
        buyerEmail: order.buyer.email
      });
    }

  } catch (error) {
    console.error('Error in handleShipmentInTransit:', error);
    throw error;
  }
};

const handleShipmentDelivered = async (data) => {
  try {
    console.log('Processing shipment.delivered webhook:', {
      shipmentId: data.shipment_id,
      trackingNumber: data.tracking_number,
      status: data.status
    });

    const order = await Order.findOne({ 'shipping.shipment_id': data.shipment_id })
      .populate('buyer', 'email firstName lastName')
      .populate('seller', 'email firstName lastName');

    if (!order) {
      console.log('No order found for shipment:', data.shipment_id);
      return;
    }

    // Update tracking and delivery information
    const updatedShipping = {
      ...order.shipping.toObject(),
      status: data.status,
      tracking: {
        ...order.shipping.tracking,
        status: data.status,
        lastUpdate: new Date(),
        history: [
          ...(order.shipping.tracking.history || []),
          {
            status: data.status,
            location: data.events[0]?.location || 'Unknown',
            timestamp: new Date(),
            description: data.events[0]?.description || 'Shipment delivered'
          }
        ]
      },
      delivery: {
        ...order.shipping.delivery,
        actualDate: new Date(),
        signedBy: data.events[0]?.description?.match(/signed by (.*)/i)?.[1] || 'Unknown'
      }
    };

    // Update order
    const updatedOrder = await Order.findOneAndUpdate(
      { _id: order._id },
      { $set: { shipping: updatedShipping } },
      { new: true, runValidators: true }
    );

    if (!updatedOrder) {
      throw new Error('Failed to update order');
    }

    // Send emails with error handling
    try {
      if (!order.buyer.email || !order.seller.email) {
        throw new Error('Missing recipient email addresses');
      }

      const emailTemplate = getShipmentDeliveredEmailTemplate(order);
      
      await Promise.all([
        sgMail.send({
          to: order.buyer.email,
          from: {
            email: process.env.SENDGRID_FROM_EMAIL,
            name: 'Auqli Shipping'
          },
          ...emailTemplate.buyer
        }),
        sgMail.send({
          to: order.seller.email,
          from: {
            email: process.env.SENDGRID_FROM_EMAIL,
            name: 'Auqli Shipping'
          },
          ...emailTemplate.seller
        })
      ]);

      console.log('Shipment delivered emails sent successfully');
    } catch (emailError) {
      console.error('Error sending delivered emails:', {
        error: emailError.message,
        buyerEmail: order.buyer.email,
        sellerEmail: order.seller.email
      });
    }

  } catch (error) {
    console.error('Error in handleShipmentDelivered:', error);
    throw error;
  }
};

const handleShipmentCancelled = async (data) => {
  try {
    console.log('Processing shipment.cancelled webhook:', {
      shipmentId: data.shipment_id,
      trackingNumber: data.tracking_number,
      status: data.status
    });

    const order = await Order.findOne({ 'shipping.shipment_id': data.shipment_id });
    if (!order) {
      console.log('No order found for shipment:', data.shipment_id);
      return;
    }

    // Update shipping information
    const updatedShipping = {
      ...order.shipping.toObject(),
      status: 'cancelled',
      tracking: {
        ...order.shipping.tracking,
        status: 'cancelled',
        lastUpdate: new Date(),
        history: [
          ...(order.shipping.tracking.history || []),
          {
            status: 'cancelled',
            location: data.events[0]?.location || 'Unknown',
            timestamp: new Date(),
            description: data.events[0]?.description || 'Shipment cancelled'
          }
        ]
      }
    };

    // Update order
    const updatedOrder = await Order.findOneAndUpdate(
      { _id: order._id },
      { $set: { shipping: updatedShipping } },
      { new: true, runValidators: true }
    );

    if (!updatedOrder) {
      throw new Error('Failed to update order');
    }

    // Send emails
    const emailTemplate = getShipmentCancelledEmailTemplate(
      order, 
      data.events[0]?.description
    );
    
    await Promise.all([
      sgMail.send({
        to: order.buyer.email,
        from: process.env.SENDGRID_FROM_EMAIL,
        ...emailTemplate.buyer
      }),
      sgMail.send({
        to: order.seller.email,
        from: process.env.SENDGRID_FROM_EMAIL,
        ...emailTemplate.seller
      })
    ]);

    console.log('Shipment cancelled emails sent successfully');

  } catch (error) {
    console.error('Error in handleShipmentCancelled:', error);
    throw error;
  }
};

module.exports = {
  handleWebhook: async (req, res) => {
    const signature = req.headers['x-terminal-signature'];
    console.log('Received Terminal webhook:', {
      event: req.body.event,
      signature: signature?.substring(0, 10) + '...' 
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
        case 'shipment.cancelled':
          await handleShipmentCancelled(data);
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
  handleShipmentDelivered,
  handleShipmentCancelled,
  verifyWebhookSignature
}; 