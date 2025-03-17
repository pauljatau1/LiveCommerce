const mongoose = require('mongoose');
const Order = mongoose.model('Order');
const Message = mongoose.model('Message');
const Conversation = mongoose.model('Conversation');
const notificationController = require('../controllers/notificationController');
const sgMail = require('@sendgrid/mail');

/**
 * Handle Fez webhook for order status updates
 * @param {Object} webhookData - The webhook data from Fez
 */
const handleOrderStatusUpdate = async (webhookData) => {
  try {
    console.log('Processing Fez order status webhook:', {
      orderNumber: webhookData.orderNumber,
      status: webhookData.status
    });

    // Find the order by Fez order number
    const order = await Order.findOne({ 'shipping.fez_order_number': webhookData.orderNumber })
      .populate('buyer', 'email firstName lastName')
      .populate('seller', 'email firstName lastName businessName');

    if (!order) {
      console.log('Order not found for Fez order number:', webhookData.orderNumber);
      return;
    }

    // Map Fez status to our internal status
    let internalStatus;
    let statusDescription;

    switch (webhookData.status) {
      case 'Pending Pick-Up':
        internalStatus = 'pending_pickup';
        statusDescription = 'Order is pending pickup';
        break;
      case 'Picked-Up':
        internalStatus = 'picked_up';
        statusDescription = 'Order has been picked up';
        break;
      case 'Dispatched':
        internalStatus = 'in_transit';
        statusDescription = 'Order is in transit';
        break;
      case 'Delivered':
        internalStatus = 'delivered';
        statusDescription = 'Order has been delivered';
        break;
      case 'Cancelled':
        internalStatus = 'cancelled';
        statusDescription = 'Order has been cancelled';
        break;
      default:
        internalStatus = webhookData.status.toLowerCase().replace(/ /g, '_');
        statusDescription = `Order status updated to ${webhookData.status}`;
    }

    // Update order shipping information and status history
    const shippingUpdate = {
      $set: {
        'shipping.tracking.status': internalStatus,
        'shipping.tracking.lastUpdate': new Date()
      },
      $push: {
        'shipping.tracking.history': {
          status: internalStatus,
          timestamp: new Date(),
          location: webhookData.location || 'Unknown',
          description: statusDescription
        },
        'items.$[].statusHistory': {
          status: internalStatus,
          timestamp: new Date(),
          note: statusDescription
        }
      }
    };

    // If delivered, update delivery date and mark items as delivered
    if (internalStatus === 'delivered' || internalStatus === 'Delivered') {
      shippingUpdate.$set['shipping.delivery.actualDate'] = new Date();
      shippingUpdate.$set['items.$[].status'] = 'delivered';
      
      // Schedule auto-close job for 1 day after delivery
      const { agenda } = require('../config/agenda');
      await agenda.schedule('in 24 hours', 'closeOrder', { orderId: order._id });
      console.log(`Scheduled auto-close job for order ${order.order_id} in 24 hours`);
    } else if (internalStatus === 'cancelled') {
      shippingUpdate.$set['items.$[].status'] = 'cancelled';
    } else {
      shippingUpdate.$set['items.$[].status'] = internalStatus;
    }

    // Update the order
    await Order.findByIdAndUpdate(order._id, shippingUpdate);

    // Send notifications based on status
    await sendStatusNotifications(order, internalStatus, webhookData);

    // Find and update existing order messages
    await updateOrderMessages(order, internalStatus, statusDescription);

    console.log(`Order ${order.order_id} updated with status: ${internalStatus}`);
    return true;
  } catch (error) {
    console.error('Error handling Fez order status webhook:', error);
    throw error;
  }
};

/**
 * Send notifications based on order status
 */
const sendStatusNotifications = async (order, status, webhookData) => {
  try {
    // Create notification type based on status
    const notificationType = `order_${status}`;
    
    // Create notification for buyer
    await notificationController.createBuyerNotification(
      order.buyer._id,
      notificationType,
      {
        orderId: order._id,
        order_id: order.order_id,
        status: status,
        fezOrderNumber: webhookData.orderNumber
      }
    );

    // Create notification for seller
    await notificationController.createNotification(
      order.seller,
      notificationType,
      {
        orderId: order._id,
        order_id: order.order_id,
        status: status,
        fezOrderNumber: webhookData.orderNumber
      }
    );

    // Send email notifications for important status changes
    if (['picked_up', 'in_transit', 'delivered'].includes(status)) {
      await sendStatusEmails(order, status, webhookData);
    }
  } catch (error) {
    console.error('Error sending status notifications:', error);
  }
};

/**
 * Send email notifications based on order status
 */
const sendStatusEmails = async (order, status, webhookData) => {
  try {
    // Format items table
    const itemsTable = `
      <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Product</th>
            <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Quantity</th>
            <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Price</th>
            <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${order.items.map(item => `
            <tr>
              <td style="padding: 10px; text-align: left; border: 1px solid #ddd;">${item.productName || 'Product'}</td>
              <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">${item.quantity || 1}</td>
              <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">₦${(item.price || 0).toLocaleString()}</td>
              <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">₦${((item.price || 0) * (item.quantity || 1)).toLocaleString()}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr style="background-color: #f9f9f9;">
            <td colspan="3" style="padding: 10px; text-align: right; border: 1px solid #ddd;"><strong>Subtotal:</strong></td>
            <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">₦${order.totalAmount.toLocaleString()}</td>
          </tr>
          ${order.shipping?.fee?.amount ? `
          <tr style="background-color: #f9f9f9;">
            <td colspan="3" style="padding: 10px; text-align: right; border: 1px solid #ddd;"><strong>Shipping Fee:</strong></td>
            <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">₦${order.shipping.fee.amount.toLocaleString()}</td>
          </tr>
          <tr style="background-color: #f9f9f9;">
            <td colspan="3" style="padding: 10px; text-align: right; border: 1px solid #ddd;"><strong>Total:</strong></td>
            <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">₦${(order.totalAmount + order.shipping.fee.amount).toLocaleString()}</td>
          </tr>
          ` : ''}
        </tfoot>
      </table>
    `;

    // Format delivery information
    const deliveryInfo = `
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <h3 style="margin-top: 0;">Delivery Information</h3>
        <p><strong>Recipient:</strong> ${order.delivery_address.first_name} ${order.delivery_address.last_name}</p>
        <p><strong>Address:</strong> ${order.delivery_address.line1}</p>
        <p><strong>State:</strong> ${order.delivery_address.state}</p>
        <p><strong>Phone:</strong> ${order.delivery_address.phone}</p>
        <p><strong>Email:</strong> ${order.delivery_address.email}</p>
      </div>
    `;

    // Format order status history
    const statusHistory = order.shipping.tracking.history.map(entry => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${new Date(entry.timestamp).toLocaleString()}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${entry.status}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${entry.location || 'N/A'}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${entry.description}</td>
      </tr>
    `).join('');

    const statusHistoryTable = `
      <div style="margin-top: 20px;">
        <h3>Order Status History</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th style="padding: 8px; border: 1px solid #ddd;">Date</th>
              <th style="padding: 8px; border: 1px solid #ddd;">Status</th>
              <th style="padding: 8px; border: 1px solid #ddd;">Location</th>
              <th style="padding: 8px; border: 1px solid #ddd;">Description</th>
            </tr>
          </thead>
          <tbody>
            ${statusHistory}
          </tbody>
        </table>
      </div>
    `;

    // Prepare email templates based on status
    let buyerSubject, buyerHtml, sellerSubject, sellerHtml;

    const commonOrderInfo = `
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <p><strong>Order ID:</strong> ${order.order_id}</p>
        <p><strong>Fez Order Number:</strong> ${webhookData.orderNumber}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        <p><strong>Current Status:</strong> ${webhookData.status}</p>
      </div>
      
      <h3>Order Details</h3>
      ${itemsTable}
      
      ${deliveryInfo}
      
      ${statusHistoryTable}
    `;

    switch (status) {
      case 'picked_up':
        buyerSubject = 'Your Order Has Been Picked Up - Auqli';
        buyerHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Your Order Has Been Picked Up!</h2>
            <p>Dear ${order.buyer.firstName},</p>
            <p>Great news! Your order has been picked up from ${order.seller.businessName || order.seller.firstName}.</p>
            ${commonOrderInfo}
            <p>It's now on its way to our logistics center for processing.</p>
            <p>Best regards,<br>The Auqli Team</p>
          </div>
        `;
        
        sellerSubject = 'Order Picked Up - Auqli';
        sellerHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Order Picked Up Successfully</h2>
            <p>Dear ${order.seller.firstName},</p>
            <p>Your order has been picked up successfully.</p>
            ${commonOrderInfo}
            <p>Best regards,<br>The Auqli Team</p>
          </div>
        `;
        break;
        
      case 'in_transit':
        buyerSubject = 'Your Order is On the Way - Auqli';
        buyerHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Your Order is On the Move!</h2>
            <p>Dear ${order.buyer.firstName},</p>
            <p>Your order from ${order.seller.businessName || order.seller.firstName} is now in transit!</p>
            ${commonOrderInfo}
            <p>We'll notify you when your package is delivered.</p>
            <p>Best regards,<br>The Auqli Team</p>
          </div>
        `;
        
        sellerSubject = 'Order In Transit - Auqli';
        sellerHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Order Now In Transit</h2>
            <p>Dear ${order.seller.firstName},</p>
            <p>Your order is now in transit to the customer.</p>
            ${commonOrderInfo}
            <p>Best regards,<br>The Auqli Team</p>
          </div>
        `;
        break;
        
      case 'delivered':
        buyerSubject = 'Your Order Has Been Delivered - Auqli';
        buyerHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Your Order Has Been Delivered!</h2>
            <p>Dear ${order.buyer.firstName},</p>
            <p>Great news! Your order from ${order.seller.businessName || order.seller.firstName} has been delivered.</p>
            ${commonOrderInfo}
            <p>We hope you enjoy your purchase! The order will be automatically closed in 2 days if no issues are reported.</p>
            <p>Don't forget to leave a review for the seller and the products.</p>
            <p>Best regards,<br>The Auqli Team</p>
          </div>
        `;
        
        sellerSubject = 'Order Delivered Successfully - Auqli';
        sellerHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Order Delivered Successfully</h2>
            <p>Dear ${order.seller.firstName},</p>
            <p>Your order has been delivered successfully to the customer.</p>
            ${commonOrderInfo}
            <p>The order will be automatically closed and payment will be released in 2 days if no issues are reported.</p>
            <p>Best regards,<br>The Auqli Team</p>
          </div>
        `;
        break;
        
      default:
        return; // Don't send emails for other statuses
    }

    // Send emails
    const buyerEmail = {
      to: order.buyer.email,
      from: 'Auqli Shipping <joseph@auqli.com>',
      subject: buyerSubject,
      html: buyerHtml
    };

    const sellerEmail = {
      to: order.seller.email,
      from: 'Auqli Shipping <joseph@auqli.com>',
      subject: sellerSubject,
      html: sellerHtml
    };

    await Promise.all([
      sgMail.send(buyerEmail),
      sgMail.send(sellerEmail)
    ]);

    console.log(`Status emails sent for order ${order.order_id} with status ${status}`);
  } catch (error) {
    console.error('Error sending status emails:', error);
  }
};

/**
 * Update existing order messages with new tracking status
 */
const updateOrderMessages = async (order, status, statusDescription) => {
  try {
    console.log('Updating order messages with new tracking status:', {
      orderId: order._id,
      status: status
    });

    // Find all messages that reference this order
    const messages = await Message.find({
      'order.id': order._id,
      messageType: 'order'
    });

    if (!messages.length) {
      console.log('No existing messages found for order:', order._id);
      return;
    }

    console.log(`Found ${messages.length} messages to update`);

    // Update each message with the new tracking status
    const updatePromises = messages.map(async (message) => {
      // Update tracking information
      message.order.tracking = {
        number: order.shipping.tracking.number,
        url: order.shipping.tracking.url,
        carrier: order.shipping.tracking.carrier,
        status: status
      };

      // Add a note about the status update
      message.content = message.content || '';
      if (!message.content.includes(statusDescription)) {
        message.content = `${message.content}\n[${new Date().toLocaleString()}] ${statusDescription}`;
      }

      await message.save();

      // Update the conversation's last message if this was the last message
      const conversation = await Conversation.findById(message.conversation);
      if (conversation && conversation.lastMessage?.messageType === 'order') {
        conversation.lastMessage.content = message.content;
        await conversation.save();
      }
    });

    await Promise.all(updatePromises);
    console.log('Successfully updated all order messages');
  } catch (error) {
    console.error('Error updating order messages:', error);
  }
};

module.exports = {
  handleOrderStatusUpdate
}; 