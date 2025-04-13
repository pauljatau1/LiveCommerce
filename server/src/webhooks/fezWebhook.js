const mongoose = require('mongoose');
const Order = mongoose.model('Order');
const Message = mongoose.model('Message');
const Conversation = mongoose.model('Conversation');
const notificationController = require('../controllers/notificationController');
const sgMail = require('@sendgrid/mail');
const { agenda } = require('../config/agenda');

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
      case 'delivered':
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

    // Calculate appropriate timestamp based on status sequence and existing history
    let newTimestamp;
    
    // Define the expected sequence of statuses
    const statusSequence = ['pending_pickup', 'picked_up', 'in_transit', 'delivered'];
    const currentStatusIndex = statusSequence.indexOf(internalStatus);
    
    if (webhookData.timestamp) {
      // If the webhook includes a timestamp, use it
      newTimestamp = new Date(webhookData.timestamp);
    } else {
      // Always use the current date/time for new status updates
      // This ensures the timestamps reflect when the status actually changed
      newTimestamp = new Date();
      
      // Log the timestamp being used
      console.log(`Using current timestamp for status update: ${newTimestamp.toISOString()}`);
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
          timestamp: newTimestamp,
          location: webhookData.location || 'Unknown',
          description: statusDescription
        },
        'items.$[].statusHistory': {
          status: internalStatus,
          timestamp: newTimestamp,
          note: statusDescription
        }
      }
    };

    // If delivered, update delivery date and mark items as delivered
    if (internalStatus === 'delivered' || internalStatus === 'Delivered') {
      shippingUpdate.$set['shipping.delivery.actualDate'] = new Date();
      shippingUpdate.$set['items.$[].status'] = 'delivered';
      
      // Add logging to clarify that payment isn't processed yet
      console.log(`Order ${order.order_id} marked as delivered. Payment will be processed when order is closed after 1 day.`, {
        paymentMethod: order.paymentInfo?.method,
        isCashOnDelivery: order.paymentInfo?.isCashOnDelivery,
        isPaid: order.paid
      });
      
      // Schedule auto-close job for 1 minute after delivery (for testing purposes)
      try {
        // First ensure the job doesn't already exist
        const existingJobs = await agenda.jobs({
          name: 'closeOrder',
          'data.orderId': order._id.toString()
        });

        console.log(`Checking for existing close jobs for order ${order.order_id}:`, {
          found: existingJobs.length > 0,
          count: existingJobs.length,
          orderId: order._id.toString()
        });

        if (existingJobs.length > 0) {
          console.log(`Auto-close job already scheduled for order ${order.order_id}, skipping`);
        } else {
          // Schedule job to run 1 minute from now
          const job = await agenda.schedule('in 1 day', 'closeOrder', { orderId: order._id.toString() });
          console.log(`Scheduled auto-close job for order ${order.order_id} in 1 day`, {
            jobId: job.attrs._id.toString()
          });
        }
        
        // If for some reason the job fails to close the order,
        // make sure we have a direct update fallback
        // Schedule a direct update after 2 minutes if still open
        setTimeout(async () => {
          try {
            const checkOrder = await Order.findById(order._id);
            if (checkOrder && checkOrder.isOpen) {
              console.log(`Fallback: Directly closing order ${order.order_id} as scheduled job may have failed`);
              // Update order to closed status directly
              const updatedOrder = await Order.findByIdAndUpdate(
                order._id,
                {
                  isOpen: false,
                  closedAt: new Date(),
                  closedBy: 'auto',
                  closedReason: 'Auto-closed after delivery (fallback method)'
                },
                { new: true }
              );
              
              if (updatedOrder && !updatedOrder.isOpen) {
                console.log(`Fallback successfully closed order ${order.order_id}`);
                // Explicitly trigger the pre-save middleware by calling save
                try {
                  // This will trigger the pre-save hooks to process the payment
                  await updatedOrder.save();
                  console.log(`Successfully triggered payment processing via save hook for order ${order.order_id}`);
                } catch (saveError) {
                  console.error(`Error triggering save hook for order ${order.order_id}:`, saveError);
                }
              } else {
                console.error(`Fallback failed to close order ${order.order_id}`);
              }
            }
          } catch (fallbackError) {
            console.error('Error in fallback order closing:', fallbackError);
          }
        }, 93600000); // 26 hours (1 day + 2 hours buffer)
        
      } catch (scheduleError) {
        console.error('Error scheduling auto-close job:', scheduleError);
        // Try direct update if scheduling fails
        try {
          const directUpdate = {
            ...shippingUpdate.$set,
            isOpen: false,
            closedAt: new Date(),
            closedBy: 'auto',
            closedReason: 'Auto-closed after delivery (direct method)'
          };
          
          console.log(`Attempting direct order close for ${order.order_id} as scheduling failed`, directUpdate);
          
          // First attempt to update directly
          const updatedOrder = await Order.findByIdAndUpdate(
            order._id,
            directUpdate,
            { new: true }
          );
          
          if (updatedOrder && !updatedOrder.isOpen) {
            console.log(`Successfully closed order ${order.order_id} directly`);
            // Trigger the save event to ensure proper payment processing
            try {
              await updatedOrder.save();
              console.log(`Successfully triggered payment processing via save hook for order ${order.order_id}`);
            } catch (saveError) {
              console.error(`Error during save hook for order ${order.order_id}:`, saveError);
              
              // Try one more option - get the order and manually close it
              try {
                const freshOrder = await Order.findById(order._id);
                if (freshOrder && freshOrder.isOpen) {
                  freshOrder.isOpen = false;
                  freshOrder.closedAt = new Date();
                  freshOrder.closedBy = 'auto';
                  freshOrder.closedReason = 'Auto-closed after delivery (emergency method)';
                  await freshOrder.save();
                  console.log(`Emergency close successful for order ${order.order_id}`);
                }
              } catch (emergencyError) {
                console.error(`Emergency close failed for order ${order.order_id}:`, emergencyError);
              }
            }
          } else {
            console.error(`Failed to close order ${order.order_id} directly`);
          }
        } catch (directUpdateError) {
          console.error('Error in direct order closing:', directUpdateError);
        }
      }
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
    let notificationType;
    
    // Use specific notification types for different statuses
    if (status === 'picked_up') {
      notificationType = 'order_picked_up';
    } else if (status === 'in_transit') {
      notificationType = 'order_in_transit';
    } else if (status === 'delivered') {
      notificationType = 'order_delivered';
    } else {
      notificationType = `order_${status}`;
    }
    
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
        <p><strong>Phone:</strong> ${maskPhoneNumber(order.delivery_address.phone)}</p>
        <p><strong>Email:</strong> ${maskEmail(order.delivery_address.email)}</p>
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
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #4CAF50;">
        <p style="margin: 5px 0;"><strong style="color: #333;">Order ID:</strong> <span style="color: #555;">${order.order_id}</span></p>
        <p style="margin: 5px 0;"><strong style="color: #333;">Fez Order Number:</strong> <span style="color: #555;">${webhookData.orderNumber}</span></p>
        <p style="margin: 5px 0;"><strong style="color: #333;">Date:</strong> <span style="color: #555;">${new Date().toLocaleDateString()}</span></p>
        <p style="margin: 5px 0;"><strong style="color: #333;">Current Status:</strong> <span style="color: #555;">${webhookData.status}</span></p>
      </div>
      
      <h3 style="color: #4CAF50; border-bottom: 2px solid #f0f0f0; padding-bottom: 8px;">Order Details</h3>
      ${itemsTable}
      
      ${deliveryInfo}
      
      ${statusHistoryTable}
    `;

    const emailContainer = (content) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://res.cloudinary.com/dljgzevaj/image/upload/v1733928675/Group_178_iqez5h.png" alt="Auqli Logo" style="width: 150px;">
          ${content}
        </div>
      </div>
    `;

    const emailFooter = `
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #777; font-size: 14px; text-align: center;">
        <p>Thank you for using Auqli!</p>
        <p>If you have any questions, please contact our customer service team at <a href="mailto:support@auqli.com" style="color: #4CAF50; text-decoration: none;">support@auqli.com</a></p>
        <p style="color: #999; font-size: 12px; margin-top: 15px;">© ${new Date().getFullYear()} Auqli. All rights reserved.</p>
      </div>
    `;

    switch (status) {
      case 'picked_up':
        buyerSubject = 'Your Order Has Been Picked Up - Auqli';
        buyerHtml = emailContainer(`
          <h2 style="color: #333; margin-top: 15px;">Your Order Has Been Picked Up!</h2>
          <p style="color: #555; font-size: 16px;">Hello ${order.buyer.firstName},</p>
          <p style="color: #555; font-size: 16px;">Great news! Your order has been picked up from ${order.seller.businessName || order.seller.firstName} and is now on its way to our logistics center for processing.</p>
          ${commonOrderInfo}
          <div style="text-align: center; margin: 25px 0;">
            <a href="https://auqli.com/orders/${order.order_id}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Track Your Order</a>
          </div>
          ${emailFooter}
        `);
        
        sellerSubject = 'Order Picked Up - Auqli';
        sellerHtml = emailContainer(`
          <h2 style="color: #333; margin-top: 15px;">Order Picked Up Successfully</h2>
          <p style="color: #555; font-size: 16px;">Hello ${order.seller.firstName},</p>
          <p style="color: #555; font-size: 16px;">Your order has been picked up successfully and is now in transit.</p>
          ${commonOrderInfo}
          <div style="text-align: center; margin: 25px 0;">
            <a href="https://seller.auqli.com/orders/${order.order_id}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">View Order Details</a>
          </div>
          ${emailFooter}
        `);
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
            <p>We hope you enjoy your purchase! The order will be automatically closed in 1 day if no issues are reported.</p>
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
            <p>The order will be automatically closed and payment will be released in 1 day if no issues are reported.</p>
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
      from: 'Auqli Shipping <support@auqli.com>',
      subject: buyerSubject,
      html: buyerHtml
    };

    const sellerEmail = {
      to: order.seller.email,
      from: 'Auqli Shipping <support@auqli.com>',
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

// Helper functions to mask sensitive information
const maskEmail = (email) => {
  if (!email) return '';
  const [username, domain] = email.split('@');
  if (!username || !domain) return '***@***.com';
  return `${username.substring(0, 2)}${'*'.repeat(username.length - 2)}@${domain}`;
};

const maskPhoneNumber = (phone) => {
  if (!phone) return '';
  return `${'*'.repeat(Math.max(0, phone.length - 4))}${phone.substring(Math.max(0, phone.length - 4))}`;
};

module.exports = {
  handleOrderStatusUpdate
}; 