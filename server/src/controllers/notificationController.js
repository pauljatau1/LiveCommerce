const Notification = require('../models/Notification');
const sgMail = require('@sendgrid/mail');
const Order = require('../models/Order');
const mongoose = require('mongoose');
const { agenda } = require('../config/agenda');
const { Expo } = require('expo-server-sdk');
const expo = new Expo();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Helper function to get notification title
const getNotificationTitle = (type) => {
  switch (type) {
    case 'new_order':
      return 'New Order Received';
    case 'order_paid':
      return 'Payment Received';
    case 'pickup_arranged':
      return 'Pickup Arranged';
    case 'new_follower':
      return 'New Follower';
    case 'low_stock':
      return 'Low Stock Alert';
    case 'order_delivered':
      return 'Order Delivered';
    case 'order_cancelled':
      return 'Order Cancelled';
    case 'review_received':
      return 'New Review';
    case 'new_campaign':
      return 'New Campaign';
    case 'campaign_scheduled':
      return 'Upcoming Campaign Alert';
    case 'order_closed':
      return 'Order Closed and Payment Released';
    case 'order_status_update':
      return 'Order Status Update';
    case 'order_shipped':
      return 'Order Shipped';
    case 'order_picked_up':
      return 'Order Picked Up';
    case 'order_in_transit':
      return 'Order In Transit';
    case 'coupon_received':
      return 'New Coupon Available';
    case 'price_drop':
      return 'Price Drop Alert';
    case 'back_in_stock':
      return 'Back in Stock';
    case 'seller_message':
      return 'New Message from Seller';
    case 'buyer_message':
      return 'New Message from Buyer';
    case 'new_message':
      return 'New Message';
    case 'order_reminder':
      return 'Order Action Required';
    case 'review_reminder':
      return 'Review Your Recent Purchase';
    case 'return_created':
      return 'Return Request Created';
    case 'return_approved':
      return 'Return Request Approved';
    case 'return_rejected':
      return 'Return Request Rejected';
    case 'return_info_needed':
      return 'Additional Information Needed';
    case 'return_partial_refund':
      return 'Partial Refund Offered';
    case 'return_label_created':
      return 'Return Shipping Label Created';
    case 'return_pickup_arranged':
      return 'Return Pickup Arranged';
    case 'return_request':
      return 'New Return Request';
    case 'order_placed':
      return 'Order Placed Successfully';
    case 'post_reaction':
      return 'New Reaction on Your Post';
    case 'post_comment':
      return 'New Comment on Your Post';
    case 'post_comment_reply':
      return 'New Reply to Your Comment';
    case 'stream_start':
      return 'Live Stream Started';
    case 'blip_like':
      return 'New Like on Your Product Blip';
    case 'blip_comment':
      return 'New Comment on Your Product Blip';
    default:
      return 'Notification';
  }
};

// Helper function to format notification message
const getNotificationMessage = (type, data) => {
  switch (type) {
    case 'new_order':
      // Format the items properly
      let itemsText = '';
      if (Array.isArray(data.items)) {
        const itemCount = data.items.length;
        const itemNames = data.items.map(item => item.productName).join(', ');
        itemsText = `${itemCount} item${itemCount > 1 ? 's' : ''} (${itemNames})`;
      } else if (typeof data.items === 'number') {
        itemsText = `${data.items} item${data.items > 1 ? 's' : ''}`;
      }
      
      // Format delivery address
      let deliveryInfo = '';
      if (data.deliveryAddress) {
        const address = data.deliveryAddress;
        deliveryInfo = `Delivery to ${address.recipientName} in ${address.recipientState}.`;
      }
      
      // Include payment method
      const paymentInfo = data.paymentMethod ? `Payment via ${data.paymentMethod}.` : '';
      
      return `You have received a new order #${data.order_id} worth ${data.amount}. ${itemsText} to be fulfilled. ${deliveryInfo} ${paymentInfo}`;
    case 'order_paid':
      return `Payment of ${data.amount} received for order #${data.order_id} via ${data.paymentMethod}.`;
    case 'pickup_arranged':
      return `Pickup has been arranged for order #${data.order_id} with ${data.carrier} on ${data.pickupDate ? new Date(data.pickupDate).toLocaleDateString() : 'the scheduled date'}.`;
    case 'new_follower':
      // Check if this notification is for a buyer (they don't have stores)
      if (data.sellerId) {
        // This is a notification for a buyer being followed by a seller
        return `${data.sellerName || 'A seller'} has started following you.`;
      } else {
        // This is a notification for a seller being followed by a buyer
        return `${data.buyerName || 'Someone'} is now following your store.`;
      }
    case 'low_stock':
      return `Your product "${data.productName}" is running low on stock (${data.currentStock} units remaining).`;
    case 'order_delivered':
      return `Order #${data.order_id} has been successfully delivered to the customer.`;
    case 'order_cancelled':
      return `Order #${data.order_id} has been cancelled.`;
    case 'review_received':
      return `A new review has been posted for your product "${data.productName}".`;
    case 'new_campaign':
      return `${data.storeName || 'Your store'} has a new campaign: ${data.campaignTitle || 'New Campaign'}. Sent to ${data.recipientCount || 0} followers.`;
    case 'campaign_scheduled':
      return `${data.storeName || 'Your store'} has scheduled a campaign for ${data.scheduledFor ? new Date(data.scheduledFor).toLocaleDateString() : 'the future'}: ${data.campaignTitle || 'Scheduled Campaign'}`;
    case 'order_closed':
      const amount = typeof data.amount === 'number' ? data.amount.toLocaleString() : '0';
      const newBalance = typeof data.newWalletBalance === 'number' ? data.newWalletBalance.toLocaleString() : '0';
      return `Order #${data.order_id} has been closed and ₦${amount} has been released to your wallet. New balance: ₦${newBalance}.`;
    case 'order_status_update':
      return `Your order #${data.order_id} status has been updated to ${data.status}.`;
    case 'order_shipped':
      return `Your order #${data.order_id} has been shipped! Track your package with ${data.carrier}.`;
    case 'order_picked_up': 
      return `Your order #${data.order_id} has been picked up and is being processed for delivery.`;
    case 'order_in_transit':
      return `Order #${data.order_id} is now in transit and on its way to the delivery address.`;
    case 'coupon_received':
      return `${data.sellerName || 'A seller'} has sent you a ${data.discount}% discount coupon valid until ${data.validUntil ? new Date(data.validUntil).toLocaleDateString() : 'soon'}.`;
    case 'price_drop':
      return `Good news! "${data.productName}" is now ${data.discount}% off.`;
    case 'back_in_stock':
      return `"${data.productName}" is back in stock! Don't miss out.`;
    case 'seller_message':
      return `New message from ${data.sellerName || 'a seller'}.`;
    case 'order_reminder':
      return `Please confirm receipt of order #${data.order_id} delivered on ${data.deliveryDate ? new Date(data.deliveryDate).toLocaleDateString() : 'the delivery date'}.`;
    case 'review_reminder':
      return `How was your experience with "${data.productName}"? Share your thoughts!`;
    case 'return_created':
      return `Your return request for order #${data.order_id} has been submitted successfully.`;
    case 'return_approved':
      return `Your return request for order #${data.order_id} has been approved. ${data.message}`;
    case 'return_rejected':
      return `Your return request for order #${data.order_id} has been rejected. Reason: ${data.message}`;
    case 'return_info_needed':
      return `Additional information is needed for your return request #${data.order_id}: ${data.message}`;
    case 'return_partial_refund':
      return `A partial refund of ₦${data.partialRefundAmount.toLocaleString()} has been offered for your return request on order #${data.order_id}.`;
    case 'return_label_created':
      return `Return shipping label has been created for order #${data.order_id}. Tracking number: ${data.trackingNumber}`;
    case 'return_pickup_arranged':
      return `Return pickup has been arranged for order #${data.order_id} with ${data.carrier} on ${data.pickupDate ? new Date(data.pickupDate).toLocaleDateString() : 'the scheduled date'}.`;
    case 'return_request':
      return `New return request received from ${data.buyerName || 'a buyer'} for order #${data.order_id}.`;
    case 'order_placed':
      // Format the items properly
      let orderItemsText = '';
      if (Array.isArray(data.items)) {
        const itemCount = data.items.length;
        const itemNames = data.items.map(item => item.productName).join(', ');
        orderItemsText = `${itemCount} item${itemCount > 1 ? 's' : ''} (${itemNames})`;
      } else if (typeof data.items === 'number') {
        orderItemsText = `${data.items} item${data.items > 1 ? 's' : ''}`;
      }
      
      // Format delivery address
      let buyerDeliveryInfo = '';
      if (data.deliveryAddress) {
        const address = data.deliveryAddress;
        buyerDeliveryInfo = `Delivery to ${address.recipientAddress}, ${address.recipientState}.`;
      }
      
      // Include payment method and shipping fee
      const buyerPaymentInfo = data.paymentMethod ? `Payment via ${data.paymentMethod}.` : '';
      const shippingInfo = data.shippingFee ? `Shipping fee: ${data.shippingFee}.` : '';
      
      return `Your order #${data.order_id} has been placed successfully for ${data.amount}. ${orderItemsText} from ${data.sellerName || 'seller'}. ${buyerDeliveryInfo} ${buyerPaymentInfo} ${shippingInfo}`;
    case 'new_message':
      return `${data.senderName || 'Someone'} sent you a message: "${data.messagePreview || 'View message for details'}"`;
    case 'buyer_message':
      return `${data.buyerName || 'A buyer'} sent you a message: "${data.messagePreview || 'View message for details'}"`;
    case 'post_reaction':
      return `${data.userName || 'Someone'} reacted with ${data.reactionType || 'a reaction'} to your post "${data.postTitle || ''}".`;
    case 'post_comment':
      return `${data.userName || 'Someone'} commented on your post "${data.postTitle || ''}": "${data.commentPreview || ''}"`;
    case 'post_comment_reply':
      return `${data.userName || 'Someone'} replied to your comment: "${data.replyPreview || ''}"`;
    case 'stream_start': 
      const streamType = data.streamType === 'auction' ? 'auction' : 'show';
      return `${data.storeName || 'A seller'} has started a live ${streamType}: "${data.streamTitle || 'Live Stream'}". Join now!`;
    case 'blip_like':
      return `${data.buyerName || 'Someone'} liked your product blip for "${data.productName || 'your product'}".`;
    case 'blip_comment':
      return `${data.buyerName || 'Someone'} commented on your product blip for "${data.productName || 'your product'}": "${data.comment || ''}".`;
    default:
      return data.message || 'New notification received.';
  }
};

// Helper function to create notifications
exports.createNotification = async (sellerId, type, data) => {
  console.log('Creating notification:', { sellerId, type, data });
  try {
    const actualSellerId = sellerId._id || sellerId;
    
    const title = getNotificationTitle(type);
    const message = getNotificationMessage(type, data);

    const notification = new Notification({
      seller: actualSellerId,
      recipient: 'seller',
      type,
      title,
      message,
      data
    });

    console.log('Saving notification...');
    await notification.save();
    console.log('Notification saved successfully');
    
    // Send push notification if seller has expo token
    try {
      const Seller = mongoose.model('Seller');
      const seller = await Seller.findById(actualSellerId).select('expoPushToken');
      if (seller && seller.expoPushToken) {
        await exports.sendPushNotification(seller.expoPushToken, title, message, data);
      }
    } catch (pushError) {
      console.error('Error sending push notification to seller:', pushError);
      // Continue execution even if push notification fails
    }
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Helper function to send email notification
exports.sendEmailNotification = async (seller, notification) => {
  try {
    // Ensure SendGrid API key is set
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      throw new Error('SendGrid API key not configured');
    }
    sgMail.setApiKey(apiKey);
    
    const orderData = notification.data || {};
    
    // Format the items list if available
    let itemsHtml = '';
    if (orderData.items && Array.isArray(orderData.items)) {
      itemsHtml = `
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
            ${orderData.items.map(item => `
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
              <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">₦${orderData.amount || '0'}</td>
            </tr>
            ${orderData.shippingFee ? `
            <tr style="background-color: #f9f9f9;">
              <td colspan="3" style="padding: 10px; text-align: right; border: 1px solid #ddd;"><strong>Shipping Fee:</strong></td>
              <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">₦${orderData.shippingFee}</td>
            </tr>
            <tr style="background-color: #f9f9f9;">
              <td colspan="3" style="padding: 10px; text-align: right; border: 1px solid #ddd;"><strong>Total:</strong></td>
              <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">₦${
                (() => {
                  try {
                    const amount = parseFloat(orderData.amount.replace(/[^\d.-]/g, '')) || 0;
                    const shipping = parseFloat(orderData.shippingFee.replace(/[^\d.-]/g, '')) || 0;
                    return (amount + shipping).toLocaleString();
                  } catch (e) {
                    return orderData.amount || '0';
                  }
                })()
              }</td>
            </tr>
            ` : ''}
          </tfoot>
        </table>
      `;
    } else if (typeof orderData.items === 'number') {
      // Handle case where items is just a number (count)
      itemsHtml = `<p><strong>Number of Items:</strong> ${orderData.items}</p>`;
    }
    
    // Delivery information
    let deliveryInfoHtml = '';
    if (orderData.deliveryAddress) {
      deliveryInfoHtml = `
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h3 style="margin-top: 0;">Delivery Information</h3>
          <p><strong>Recipient:</strong> ${orderData.deliveryAddress.recipientName || ''}</p>
          <p><strong>Address:</strong> ${orderData.deliveryAddress.recipientAddress || ''}</p>
          <p><strong>State:</strong> ${orderData.deliveryAddress.recipientState || ''}</p>
          <p><strong>Phone:</strong> ${maskPhoneNumber(orderData.deliveryAddress.recipientPhone || '')}</p>
          <p><strong>Email:</strong> ${maskEmail(orderData.deliveryAddress.recipientEmail || '')}</p>
        </div>
      `;
    }
    
    const msg = {
      to: seller.email,
      from: 'Auqli Seller <support@auqli.com>',
      subject: notification.title,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://res.cloudinary.com/dljgzevaj/image/upload/v1733928675/Group_178_iqez5h.png" alt="Auqli Logo" style="width: 150px;">
            <h2 style="color: #333; margin-top: 15px;">New Order Received</h2>
          </div>
          
          <p style="color: #555; font-size: 16px;">Hello ${seller.firstName || 'Seller'},</p>
          <p style="color: #555; font-size: 16px;">You have received a new order from ${orderData.buyerName || 'a customer'}. Please review the details below:</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #4CAF50;">
            <p style="margin: 5px 0;"><strong style="color: #333;">Order ID:</strong> <span style="color: #555;">${orderData.order_id || ''}</span></p>
            <p style="margin: 5px 0;"><strong style="color: #333;">Date:</strong> <span style="color: #555;">${new Date().toLocaleDateString()}</span></p>
            <p style="margin: 5px 0;"><strong style="color: #333;">Payment Method:</strong> <span style="color: #555;">${orderData.paymentMethod || 'Online Payment'}</span></p>
          </div>
          
          <h3 style="color: #4CAF50; border-bottom: 2px solid #f0f0f0; padding-bottom: 8px;">Order Details</h3>
          ${itemsHtml}
          
          ${deliveryInfoHtml}
          
          <p style="color: #555; font-size: 16px; margin-top: 20px;">Please log in to your Auqli seller dashboard to process this order.</p>
          
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #777; font-size: 14px; text-align: center;">
            <p>Thank you for selling with Auqli!</p>
            <p>If you have any questions, please contact our seller support team.</p>
            <p style="color: #999; font-size: 12px; margin-top: 15px;">© ${new Date().getFullYear()} Auqli. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    await sgMail.send(msg);
  } catch (error) {
    console.error('Email sending failed:', error);
  }
};

// Helper function to send email notification to buyer
exports.sendEmailToBuyer = async (buyer, notification) => {
  try {
    console.log(`Sending direct email to buyer: ${buyer.email} for notification: ${notification.type}`);
    
    // Get order data from notification
    const data = notification.data || {};
    const orderId = data.order_id;
    const paymentMethod = data.paymentMethod?.toLowerCase() || '';
    
    // Double-check if this is a Paystack order that might not be paid yet
    if (orderId && paymentMethod.includes('paystack')) {
      // Check the order's payment status in the database
      const Order = mongoose.model('Order');
      const order = await Order.findOne({ order_id: orderId });
      
      if (order && !order.paid) {
        console.log(`FINAL CHECK: Skipping email for unpaid Paystack order ${orderId}`);
        return false;
      }
    }
    
    // Ensure we have a valid API key
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      console.error('Cannot send email: SendGrid API key is not configured');
      throw new Error('SendGrid API key not configured');
    }
    
    // Set the API key for safety
    sgMail.setApiKey(apiKey);
    
    // Extract data from notification
    const orderInfo = parseNotificationData(data);
    
    // Generate appropriate subject based on notification type
    let subject = 'Order Update - Auqli';
    if (notification.type === 'order_placed') {
      subject = 'Your Order Has Been Placed - Auqli';
    } else if (notification.type === 'order_paid') {
      subject = 'Your Payment Has Been Confirmed - Auqli';
    } else if (notification.type.includes('shipped')) {
      subject = 'Your Order Has Been Shipped - Auqli';
    } else if (notification.type.includes('delivered')) {
      subject = 'Your Order Has Been Delivered - Auqli';
    }
    
    // Format the items table
    let itemsHtml = '';
    if (data.items && Array.isArray(data.items)) {
      data.items.forEach(item => {
        itemsHtml += `
          <tr>
            <td style="padding: 10px; text-align: left; border: 1px solid #ddd;">${item.productName || 'Product'}</td>
            <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">${item.quantity || 1}</td>
            <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">₦${(item.price || 0).toLocaleString()}</td>
            <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">₦${((item.price || 0) * (item.quantity || 1)).toLocaleString()}</td>
          </tr>
        `;
      });
    }
    
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
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr style="background-color: #f9f9f9;">
            <td colspan="3" style="padding: 10px; text-align: right; border: 1px solid #ddd;"><strong>Subtotal:</strong></td>
            <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${data.amount || '₦0'}</td>
          </tr>
          ${data.shippingFee ? `
          <tr style="background-color: #f9f9f9;">
            <td colspan="3" style="padding: 10px; text-align: right; border: 1px solid #ddd;"><strong>Shipping Fee:</strong></td>
            <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">₦${data.shippingFee}</td>
          </tr>
          ` : ''}
        </tfoot>
      </table>
    `;
    
    // Delivery information
    let deliveryInfoHtml = '';
    if (data.deliveryAddress) {
      deliveryInfoHtml = `
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h3 style="margin-top: 0;">Delivery Information</h3>
          <p><strong>Recipient:</strong> ${data.deliveryAddress.recipientName || ''}</p>
          <p><strong>Address:</strong> ${data.deliveryAddress.recipientAddress || ''}</p>
          <p><strong>State:</strong> ${data.deliveryAddress.recipientState || ''}</p>
          <p><strong>Phone:</strong> ${maskPhoneNumber(data.deliveryAddress.recipientPhone || '')}</p>
          <p><strong>Email:</strong> ${maskEmail(data.deliveryAddress.recipientEmail || '')}</p>
        </div>
      `;
    }
    
    // Create email HTML
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #333;">Order Confirmation</h2>
        </div>
        <p>Hello ${buyer.firstName || 'Customer'},</p>
        <p>Thank you for your order! We're pleased to confirm that your order has been received and is being processed.</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Order ID:</strong> ${data.order_id || 'N/A'}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Seller:</strong> ${data.sellerName || 'N/A'}</p>
          <p><strong>Payment Method:</strong> ${data.paymentMethod || 'Online Payment'}</p>
        </div>
        
        <h3>Order Details</h3>
        ${itemsTable}
        
        ${deliveryInfoHtml}
        
        <p>You can track the status of your order by logging into your Auqli account.</p>
       
        <p style="margin-top: 20px;">If you have any questions about your order, please contact our customer service team.</p>
        <p>Thank you for shopping with Auqli!</p>
        <p>Best regards,<br>The Auqli Team</p>
      </div>
    `;
    
    // Send email
    const msg = {
      to: buyer.email,
      from: 'Auqli <support@auqli.com>',
      subject,
      html
    };
    
    console.log(`Attempting to send email to buyer ${buyer.email} for order ${data.order_id || 'N/A'}`);
    await sgMail.send(msg);
    console.log(`Email sent successfully to buyer ${buyer.email} for order ${data.order_id || 'N/A'}`);
    
    return true;
  } catch (error) {
    console.error('Error sending email to buyer:', error);
    console.error('SendGrid error details:', error.response?.body?.errors);
    throw error;
  }
};

// Helper function to parse notification data
const parseNotificationData = (data) => {
  if (!data) return {};
  
  // Extract order ID, amount, etc.
  const orderInfo = {
    order_id: data.order_id || 'N/A',
    amount: data.amount || '₦0',
    sellerName: data.sellerName || 'N/A',
    paymentMethod: data.paymentMethod || 'N/A',
    items: data.items || [],
    // Add any other fields needed
  };
  
  return orderInfo;
};

// Function to handle order creation notifications
exports.handleOrderCreationNotifications = async (order, buyer, seller) => {
  try {
    console.log(`Creating notifications for order: ${order.order_id}`);
    
    // Format the items for notification
    const items = order.items.map(item => ({
      productName: item.productName || 'Product',
      quantity: item.quantity,
      price: item.price
    }));
    
    // Format the shipping fee
    const shippingFee = `₦${(order.shipping?.fee?.amount || 0).toLocaleString()}`;
    
    // Get the payment method
    const paymentMethod = order.paymentInfo?.isCashOnDelivery 
      ? 'Cash on Delivery'
      : order.paymentInfo?.method
        ? order.paymentInfo.method.charAt(0).toUpperCase() + order.paymentInfo.method.slice(1)
        : 'Online Payment';
    
    // Format delivery address for notification
    const deliveryAddress = {
      recipientName: `${order.delivery_address.first_name} ${order.delivery_address.last_name}`.trim(),
      recipientAddress: order.delivery_address.line1,
      recipientState: order.delivery_address.state,
      recipientPhone: order.delivery_address.phone,
      recipientEmail: order.delivery_address.email
    };
    
    // Create notification for seller
    const sellerNotification = await exports.createNotification(
      seller._id,
      'new_order',
      {
        orderId: order._id,
        order_id: order.order_id,
        amount: `₦${order.totalAmount.toLocaleString()}`,
        items: items,
        buyerName: `${buyer.firstName} ${buyer.lastName}`,
        shippingFee: shippingFee,
        paymentMethod: paymentMethod,
        deliveryAddress: deliveryAddress
      }
    );
    
    // Send email to seller
    await exports.sendEmailNotification(seller, sellerNotification);
    
    // Create notification for buyer
    const buyerNotification = await exports.createBuyerNotification(
      buyer._id,
      'order_placed',
      {
        orderId: order._id,
        order_id: order.order_id,
        amount: `₦${order.totalAmount.toLocaleString()}`,
        items: items,
        sellerName: seller.businessName || `${seller.firstName} ${seller.lastName}`,
        shippingFee: shippingFee,
        paymentMethod: paymentMethod,
        deliveryAddress: deliveryAddress
      }
    );
    
    // Check payment method and status before sending email to buyer
    // Send email immediately for:
    // 1. Cash on Delivery orders
    // 2. Wallet payments
    // 3. Any already paid orders
    // 4. Non-Paystack payment methods
    // Skip sending confirmation email only for Paystack orders that are not yet paid
    const paymentMethodLower = (order.paymentInfo?.method || '').toLowerCase();
    const isPaystack = paymentMethodLower === 'paystack';
    const isPaystackUnpaid = isPaystack && (!order.paid || order.paymentInfo?.status === 'pending');
    
    console.log(`Order ${order.order_id} payment details:`, { 
      paymentMethod: order.paymentInfo?.method,
      isCOD: order.paymentInfo?.isCashOnDelivery === true, 
      isPaid: order.paid,
      paymentStatus: order.paymentInfo?.status,
      isPaystack,
      isPaystackUnpaid,
      willSendEmail: !isPaystackUnpaid
    });
    
    if (isPaystackUnpaid) {
      console.log(`SKIPPING confirmation email for Paystack order ${order.order_id} - payment pending. Status: ${order.paymentInfo?.status}, Paid flag: ${order.paid}`);
    } else {
      // Send email to buyer for COD orders, wallet payments, or paid Paystack orders
      console.log(`SENDING confirmation email for order ${order.order_id} - Payment: ${paymentMethod}, Status: ${order.paymentInfo?.status || 'N/A'}, isPaid: ${order.paid}, isCOD: ${order.paymentInfo?.isCashOnDelivery === true}`);
      await exports.sendEmailToBuyer(buyer, buyerNotification);
    }
    
    console.log(`Order creation notifications sent for order: ${order.order_id}`);
    return { sellerNotification, buyerNotification };
  } catch (error) {
    console.error('Error sending notifications:', error);
    throw error;
  }
};

// Get all notifications for a seller
exports.getNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ seller: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments({ seller: req.user.id });

    res.json({
      notifications,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalNotifications: total
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve notifications', error: error.message });
  }
};

// Get unread notification count
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      seller: req.user.id,
      isRead: false
    });
    res.json({ unreadCount: count });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get unread count', error: error.message });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, seller: req.user.id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark notification as read', error: error.message });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { seller: req.user.id, isRead: false },
      { isRead: true }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark all notifications as read', error: error.message });
  }
};

// Add a new function for sending campaign emails
exports.sendCampaignEmails = async (campaign, seller, recipients) => {
  console.log('Starting sendCampaignEmails...');
  console.log('Campaign:', {
    id: campaign._id,
    title: campaign.title,
    recipientsCount: recipients?.length
  });
  console.log('Seller:', {
    id: seller._id,
    businessName: seller.businessName,
    firstName: seller.firstName
  });

  try {
    if (!recipients || recipients.length === 0) {
      console.log('No recipients found for campaign');
      return [];
    }

    console.log(`Preparing to send emails to ${recipients.length} recipients`);
    const emailPromises = recipients.map(async (recipient) => {
      if (!recipient.buyer?.email) {
        console.log('Invalid recipient data:', recipient);
        return { success: false, error: 'Invalid recipient data' };
      }

      console.log('Preparing email for:', recipient.buyer.email);
      
      const msg = {
        to: recipient.buyer.email,
        from: {
          email: 'support@auqli.com',
          name: 'Auqli Campaigns'
        },
        subject: `New Campaign from ${seller.businessName || seller.firstName}`,
        html: `
          <div style="background-color: #f9fafb; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h1 style="color: #1f2937; margin-bottom: 20px;">${campaign.title}</h1>
              
              <p style="color: #4b5563; line-height: 1.6;">${campaign.message}</p>
              
              ${campaign.selectedProducts?.length > 0 ? `
                <div style="margin-top: 20px;">
                  <h2 style="color: #1f2937; font-size: 18px;">Featured Products:</h2>
                  <ul style="list-style: none; padding: 0;">
                    ${campaign.selectedProducts.map(product => `
                      <li style="margin-bottom: 10px;">
                        <div style="display: flex; align-items: center;">
                          <img src="${product.images[0]?.url}" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; margin-right: 10px;">
                          <div>
                            <p style="margin: 0; color: #1f2937; font-weight: 500;">${product.name}</p>
                            <p style="margin: 0; color: #6b7280;">N${product.price.toLocaleString()}</p>
                          </div>
                        </div>
                      </li>
                    `).join('')}
                  </ul>
                </div>
              ` : ''}
              
             
              
              <p style="color: #6b7280; font-size: 12px; margin-top: 20px; text-align: center;">
                You're receiving this email because you follow ${seller.businessName || seller.firstName} on Auqli.
                <br>
              
              </p>
            </div>
          </div>
        `
      };

      try {
        console.log('Sending email to:', recipient.buyer.email);
        await sgMail.send(msg);
        console.log('Email sent successfully to:', recipient.buyer.email);
        return { success: true, email: recipient.buyer.email };
      } catch (error) {
        console.error(`Failed to send email to ${recipient.buyer.email}:`, error);
        console.error('SendGrid error response:', error.response?.body);
        return { 
          success: false, 
          email: recipient.buyer.email, 
          error: error.message,
          details: error.response?.body
        };
      }
    });

    console.log('Waiting for all emails to be sent...');
    const results = await Promise.all(emailPromises);
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    console.log('Email sending completed:', {
      total: results.length,
      successful: successCount,
      failed: failureCount
    });

    // Log any failures in detail
    const failures = results.filter(r => !r.success);
    if (failures.length > 0) {
      console.log('Failed emails:', failures);
    }

    return results;
  } catch (error) {
    console.error('Error in sendCampaignEmails:', error);
    throw error;
  }
};

// Add a new function to simulate Fez webhook events
exports.simulateFezWebhook = async (req, res) => {
  try {
    const { orderNumber, status } = req.body;

    console.log('🚚 Simulating Fez webhook:', {
      orderNumber,
      status
    });

    // Validate required fields
    if (!orderNumber || !status) {
      return res.status(400).json({
        message: 'Missing required fields: orderNumber and status are required'
      });
    }

    // Validate status
    const validStatuses = [
      'Pending Pick-Up', 
      'Picked-Up', 
      'Dispatched', 
      'Delivered', 
      'Cancelled'
    ];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Find the order by Fez order number
    const Order = mongoose.model('Order');
    const order = await Order.findOne({ 'shipping.fez_order_number': orderNumber });
    
    if (!order) {
      return res.status(404).json({
        message: `Order with Fez order number ${orderNumber} not found`
      });
    }

    // Always use current timestamp for webhook simulation to reflect real-world behavior
    const simulatedTimestamp = new Date();
    
    console.log(`Simulating ${status} with current timestamp: ${simulatedTimestamp.toISOString()}`);

    // Create mock webhook data
    const mockWebhookData = {
      orderNumber,
      status,
      location: "Lagos, NG",
      timestamp: simulatedTimestamp.toISOString(),
      statusDescription: getStatusDescription(status),
      orderStatus: status,
      recipientName: order.delivery_address?.first_name + " " + order.delivery_address?.last_name || "Customer",
      recipientAddress: order.delivery_address?.line1 || "Delivery Address",
      recipientState: order.delivery_address?.state || "Lagos",
      senderName: order.seller?.businessName || "Seller",
      createdAt: order.createdAt.toISOString(),
      statusCreationDate: simulatedTimestamp.toISOString()
    };

    // Helper function to get descriptive status message
    function getStatusDescription(status) {
      switch(status) {
        case 'Pending Pick-Up': 
          return 'Your package is awaiting pickup from the seller';
        case 'Picked-Up': 
          return 'Your package has been picked up from the seller';
        case 'Dispatched': 
          return 'Your package is on its way to the delivery address';
        case 'Delivered': 
          return 'Your package has been delivered successfully';
        case 'Cancelled': 
          return 'The delivery has been cancelled';
        default: 
          return 'Status updated';
      }
    }

    // Import the handler dynamically to avoid circular dependencies
    const { handleOrderStatusUpdate } = require('../webhooks/fezWebhook');
    
    // Process the webhook
    await handleOrderStatusUpdate(mockWebhookData);

    res.json({
      message: `Fez webhook event '${status}' simulated successfully`,
      data: mockWebhookData
    });

  } catch (error) {
    console.error('Error in simulateFezWebhook:', error);
    res.status(500).json({ 
      message: 'Failed to simulate Fez webhook event',
      error: error.message 
    });
  }
};

// Add a new function to simulate Terminal Africa webhook events
exports.simulateTerminalWebhook = async (req, res) => {
  try {
    const { event, shipment_id, tracking_number, carrier, delivery_date } = req.body;

    console.log('🚚 Simulating Terminal webhook:', {
      event,
      shipment_id,
      tracking_number,
      carrier
    });

    // Validate required fields
    if (!event || !shipment_id) {
      return res.status(400).json({
        message: 'Missing required fields: event and shipment_id are required'
      });
    }

    // Validate event type
    const validEvents = [
      'packaging.created',
      'packaging.updated', 
      'shipment.cancelled',
      'shipment.created',
      'shipment.in_transit',
      'shipment.updated',
      'shipment.delivered'
    ];
    
    if (!validEvents.includes(event)) {
      return res.status(400).json({
        message: `Invalid event type. Must be one of: ${validEvents.join(', ')}`
      });
    }

    // Find the order by Terminal shipment ID
    const Order = mongoose.model('Order');
    const order = await Order.findOne({ 'shipping.shipment_id': shipment_id });
    
    if (!order) {
      return res.status(404).json({
        message: `Order with Terminal shipment ID ${shipment_id} not found`
      });
    }

    // Always use current timestamp for webhook simulation
    const simulatedTimestamp = new Date();
    
    console.log(`Simulating ${event} with current timestamp: ${simulatedTimestamp.toISOString()}`);

    // Create mock webhook data following Terminal Africa's webhook format
    const mockWebhookData = {
      event,
      data: {
        shipment_id,
        tracking_number: tracking_number || order.shipping?.tracking?.number || 'TN-' + Math.random().toString(36).substr(2, 9),
        carrier: carrier || order.shipping?.carrier?.name || 'DHL',
        status: getTerminalStatus(event),
        delivery_date: delivery_date || (event === 'shipment.delivered' ? simulatedTimestamp.toISOString() : null),
        pickup_date: event === 'shipment.updated' ? simulatedTimestamp.toISOString() : null,
        recipient: {
          name: `${order.delivery_address?.first_name || ''} ${order.delivery_address?.last_name || ''}`.trim(),
          address: order.delivery_address?.line1 || 'Delivery Address',
          city: order.delivery_address?.city || 'Lagos',
          state: order.delivery_address?.state || 'Lagos',
          phone: order.delivery_address?.phone || ''
        },
        sender: {
          name: order.seller?.businessName || 'Seller',
          address: order.seller?.address || 'Seller Address'
        },
        description: getTerminalEventDescription(event),
        timestamp: simulatedTimestamp.toISOString()
      }
    };

    // Helper function to get Terminal status
    function getTerminalStatus(event) {
      switch(event) {
        case 'packaging.created':
          return 'packaging';
        case 'packaging.updated':
          return 'packaging';
        case 'shipment.created':
          return 'pending';
        case 'shipment.updated':
          return 'picked-up';
        case 'shipment.in_transit':
          return 'in-transit';
        case 'shipment.delivered':
          return 'delivered';
        case 'shipment.cancelled':
          return 'cancelled';
        default:
          return 'unknown';
      }
    }

    // Helper function to get descriptive event message
    function getTerminalEventDescription(event) {
      switch(event) {
        case 'packaging.created':
          return 'Package has been created and is being prepared for shipment';
        case 'packaging.updated':
          return 'Package information has been updated';
        case 'shipment.created':
          return 'Shipment has been created and is awaiting pickup';
        case 'shipment.updated':
          return 'Shipment has been picked up and is being processed';
        case 'shipment.in_transit':
          return 'Shipment is in transit to the destination';
        case 'shipment.delivered':
          return 'Shipment has been successfully delivered';
        case 'shipment.cancelled':
          return 'Shipment has been cancelled';
        default:
          return 'Shipment status updated';
      }
    }

    // Import the handler dynamically to avoid circular dependencies
    const { handleTerminalWebhook } = require('../webhooks/terminalWebhook');
    
    // Process the webhook
    await handleTerminalWebhook(mockWebhookData);

    res.json({
      message: `Terminal webhook event '${event}' simulated successfully`,
      data: mockWebhookData
    });

  } catch (error) {
    console.error('Error in simulateTerminalWebhook:', error);
    res.status(500).json({ 
      message: 'Failed to simulate Terminal webhook event',
      error: error.message 
    });
  }
};

// Add a new controller that uses the full handleTerminalWebhook logic from terminalWebhook.js
exports.simulateTerminalWebhook2 = async (req, res) => {
  try {
    // Verify webhook signature
    const signature = req.headers['x-terminal-signature'] || req.headers['X-Terminal-Signature'];
    const secretKey = process.env.TERMINAL_SECRET_KEY;
    
    // if (!signature || !secretKey) {
    //   return res.status(400).json({
    //     status: false,
    //     message: 'Missing webhook signature or secret key'
    //   });
    // }

    // Import the signature verification and handler from terminalWebhook.js
    const { verifyTerminalWebhookSignature, handleTerminalWebhook } = require('../webhooks/terminalWebhook');
    // const verification = verifyTerminalWebhookSignature(signature, secretKey, req.body);
    
    // if (!verification.status) {
    //   return res.status(400).json({
    //     status: false,
    //     message: verification.message
    //   });
    // }

    // Process the webhook using the full handler
    await handleTerminalWebhook(req, res, req.body);

    

   
  } catch (error) {
    console.error('Error in simulateTerminalWebhook2:', error);
    res.status(500).json({
      status: false,
      message: 'Failed to process Terminal webhook (simulateTerminalWebhook2)',
      error: error.message
    });
  }
};

// Helper function to send push notification
exports.sendPushNotification = async (expoPushToken, title, body, data = {}) => {
  try {
    if (!Expo.isExpoPushToken(expoPushToken)) {
      console.error('Invalid Expo push token:', expoPushToken);
      return;
    }

    const message = {
      to: expoPushToken,
      sound: 'default',
      title: title,
      body: body,
      data: data,
      priority: 'high',
    };

    const chunks = expo.chunkPushNotifications([message]);
    const tickets = [];

    for (let chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
        console.log('Push notification sent successfully:', ticketChunk);
      } catch (error) {
        console.error('Error sending push notification chunk:', error);
      }
    }

    return tickets;
  } catch (error) {
    console.error('Error in sendPushNotification:', error);
  }
};

// Helper function to create buyer notifications
exports.createBuyerNotification = async (buyerId, type, data) => {
  console.log('Creating buyer notification:', { buyerId, type, data });
  try {
    const actualBuyerId = buyerId._id || buyerId;
    
    const title = getNotificationTitle(type);
    const message = getNotificationMessage(type, data);

    const notification = new Notification({
      buyer: actualBuyerId,
      recipient: 'buyer',
      type,
      title,
      message,
      data
    });

    console.log('Saving buyer notification...');
    await notification.save();
    console.log('Buyer notification saved successfully');
    
    // Send push notification if buyer has expo token (skip for order_placed)
    try {
      // Don't send push notification for initial order creation
      if (type !== 'order_placed') {
        const buyer = await mongoose.model('Buyer').findById(actualBuyerId).select('expoPushToken');
        if (buyer && buyer.expoPushToken) {
          console.log(`Sending push notification for ${type}`);
          await exports.sendPushNotification(buyer.expoPushToken, title, message, data);
        }
      } else {
        console.log('Skipping push notification for initial order creation');
      }
    } catch (pushError) {
      console.error('Error sending push notification:', pushError);
      // Continue execution even if push notification fails
    }
    
    return notification;
  } catch (error) {
    console.error('Error creating buyer notification:', error);
    throw error;
  }
};

// Add new controller for buyer notifications
exports.getBuyerNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const filter = req.query.filter || 'all'; // Add filter parameter with default 'all'

    // Define excluded notification types
    const excludedTypes = ['seller_message', 'buyer_message', 'new_message', 'notification'];
    
    // Create the base query
    let query = { 
      buyer: req.user.id,
      recipient: 'buyer',
      // Exclude message notifications and default notifications from the list
      type: { $nin: excludedTypes },
      // Ensure the notification has a valid title that's not just 'Notification'
      title: { $ne: 'Notification' }
    };
    
    // Apply additional filtering based on the filter parameter
    if (filter === 'orders') {
      // Order-related notification types
      query.type = { 
        $in: [
          'order_placed', 'order_paid', 'order_status_update', 
          'order_shipped', 'order_delivered', 'order_cancelled',
          'order_reminder', 'return_created', 'return_approved',
          'return_rejected', 'return_info_needed', 'return_partial_refund',
          'return_label_created', 'return_pickup_arranged'
        ],
        $nin: excludedTypes
      };
    } else if (filter === 'posts') {
      // Post-related notification types
      query.type = { 
        $in: [
          'post_reaction', 'post_comment', 'post_comment_reply'
        ],
        $nin: excludedTypes
      };
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Notification.countDocuments(query);

    res.json({
      notifications,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalNotifications: total,
      filter
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get notifications', error: error.message });
  }
};

// Add buyer-specific mark as read function
exports.markBuyerNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { 
        _id: req.params.id, 
        buyer: req.user.id,
        recipient: 'buyer',
        // Add the same type exclusion here to be consistent
        type: { $nin: ['seller_message', 'buyer_message', 'new_message', 'notification'] }
      },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark notification as read', error: error.message });
  }
};

// Add buyer-specific mark all as read function
exports.markAllBuyerNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { 
        buyer: req.user.id,
        recipient: 'buyer',
        isRead: false,
        // Add the same type exclusion here to be consistent
        type: { $nin: ['seller_message', 'buyer_message', 'new_message', 'notification'] }
      },
      { isRead: true }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark all notifications as read', error: error.message });
  }
};

// Helper function to create message preview
const createMessagePreview = (content, messageType) => {
  if (messageType === 'text') {
    return content.length > 50 ? `${content.substring(0, 47)}...` : content;
  } else if (messageType === 'product') {
    return 'Shared a product';
  } else {
    return `Sent ${messageType}`;
  }
};

// Helper function to create message notifications
const createMessageNotifications = async (message, senderName, recipientName) => {
  try {
    const messagePreview = createMessagePreview(message.content, message.messageType);
    
    // Populate sender information if not already populated
    let sender;
    if (message.sender.model === 'Buyer') {
      const Buyer = require('../modules/buyer/models/buyer.model');
      sender = await Buyer.findById(message.sender.id).select('firstName lastName');
      if (!sender) {
        console.error('Buyer not found:', message.sender.id);
        senderName = 'a buyer';
      } else {
        // Only use the full name if both firstName and lastName are available
        senderName = (sender.firstName && sender.lastName) ? 
          `${sender.firstName} ${sender.lastName}` : 
          'a buyer';
      }
    } else {
      const Seller = require('../models/Seller');
      sender = await Seller.findById(message.sender.id).select('businessName storeName');
      if (!sender) {
        console.error('Seller not found:', message.sender.id);
        senderName = 'Unknown Seller';
      } else {
        senderName = sender.businessName || sender.storeName || 'Unknown Seller';
      }
    }
    
    // Create notification based on recipient type
    if (message.recipient.model === 'Seller') {
      await createNotification(message.recipient.id, 'buyer_message', {
        buyerName: senderName,
        messagePreview,
        conversationId: message.conversation
      });
    } else {
      await createBuyerNotification(message.recipient.id, 'seller_message', {
        sellerName: senderName,
        messagePreview,
        conversationId: message.conversation
      });
    }
  } catch (error) {
    console.error('Error creating message notification:', error);
    // Don't throw error to prevent message sending from failing
  }
};

// Helper function to verify SendGrid API key
const verifySendGridConfig = () => {
  const apiKey = process.env.SENDGRID_API_KEY;
  
  if (!apiKey) {
    console.error('SENDGRID_API_KEY is not set in environment variables!');
    return false;
  }
  
  if (apiKey.startsWith('SG.')) {
    // console.log('SendGrid API key appears to be properly formatted');
    return true;
  } else {
    console.error('SendGrid API key does not appear to be properly formatted. Should start with "SG."');
    return false;
  }
};

// Function to process batch order notifications for a buyer
exports.processBatchOrderNotifications = async (buyerId) => {
  try {
    console.log('Starting batch order notification processing for buyer:', buyerId);
    
    // Verify SendGrid configuration
    const isConfigValid = verifySendGridConfig();
    console.log('SendGrid configuration valid:', isConfigValid);
    
    const Order = mongoose.model('Order');
    const Buyer = mongoose.model('Buyer');
    const Seller = mongoose.model('Seller');
    
    // Get the buyer
    const buyer = await Buyer.findById(buyerId);
    if (!buyer) {
      console.error('Buyer not found for batch processing:', buyerId);
      return;
    }
    
    console.log('Found buyer for batch processing:', {
      buyerId: buyer._id.toString(),
      email: buyer.email,
      name: `${buyer.firstName} ${buyer.lastName}`
    });
    
    // Find all orders for this buyer that haven't had notifications sent
    const orders = await Order.find({
      buyer: buyerId,
      notificationsSent: false,
      createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) } // Orders created in the last 5 minutes
    }).populate('seller').populate('items.product');
    
    if (orders.length === 0) {
      console.log('No orders found for batch processing for buyer:', buyerId);
      return;
    }
    
    console.log(`Found ${orders.length} orders for batch processing for buyer:`, buyerId);
    
    // Deduplicate orders based on order_id to prevent repeats
    const uniqueOrderMap = new Map();
    orders.forEach(order => {
      uniqueOrderMap.set(order.order_id, order);
    });
    
    const uniqueOrders = Array.from(uniqueOrderMap.values());
    
    console.log(`After deduplication: ${uniqueOrders.length} unique orders for buyer:`, buyerId);
    console.log('Order details:', uniqueOrders.map(order => ({
      orderId: order._id.toString(),
      order_id: order.order_id,
      seller: order.seller ? order.seller._id.toString() : 'Missing seller',
      items: order.items.length,
      notificationsSent: order.notificationsSent
    })));
    
    // Group orders by seller
    const ordersBySeller = {};
    const allSellers = [];
    
    uniqueOrders.forEach(order => {
      if (!order.seller) {
        console.error('Order has no seller:', order._id.toString());
        return;
      }
      
      const sellerId = order.seller._id.toString();
      if (!ordersBySeller[sellerId]) {
        ordersBySeller[sellerId] = [];
        allSellers.push(order.seller);
      }
      ordersBySeller[sellerId].push(order);
    });
    
    console.log('Grouped orders by seller:', Object.keys(ordersBySeller).map(sellerId => ({
      sellerId,
      orderCount: ordersBySeller[sellerId].length
    })));
    
    // Send individual notifications to each seller
    for (const seller of allSellers) {
      const sellerOrders = ordersBySeller[seller._id.toString()];
      console.log(`Processing ${sellerOrders.length} orders for seller:`, seller._id.toString());
      
      for (const order of sellerOrders) {
        try {
          console.log(`Creating notification for seller ${seller._id.toString()} for order ${order.order_id}`);
          
          // Create notification for seller
          const sellerNotification = await exports.createNotification(
            seller._id,
            'new_order',
            {
              orderId: order._id,
              order_id: order.order_id,
              amount: `₦${order.totalAmount.toLocaleString()}`,
              items: order.items.map(item => ({
                productName: item.productName || 'Product',
                quantity: item.quantity,
                price: item.price
              })),
              buyerName: `${buyer.firstName} ${buyer.lastName}`,
              shippingFee: order.shipping?.fee?.amount?.toLocaleString() || '0',
              paymentMethod: order.paymentInfo?.method?.charAt(0).toUpperCase() + order.paymentInfo?.method?.slice(1) || 'Online Payment',
              deliveryAddress: {
                recipientName: `${order.delivery_address.first_name} ${order.delivery_address.last_name}`.trim(),
                recipientAddress: order.delivery_address.line1,
                recipientState: order.delivery_address.state,
                recipientPhone: order.delivery_address.phone,
                recipientEmail: order.delivery_address.email
              }
            }
          );
          
          console.log(`Notification created for seller ${seller._id.toString()}, sending email...`);
          
          // Send email to seller for this specific order
          await exports.sendEmailNotification(seller, sellerNotification);
          console.log(`Email sent to seller ${seller.email} for order ${order.order_id}`);
          
          // Mark order as notified
          order.notificationsSent = true;
          await order.save();
          console.log(`Order ${order.order_id} marked as notified`);
        } catch (error) {
          console.error(`Error processing notification for order ${order.order_id}:`, error);
        }
      }
    }
    
    // For single orders, create a dedicated email to buyer
    if (uniqueOrders.length === 1) {
      console.log('Processing single order notification for buyer:', buyer.email);
      const order = uniqueOrders[0];
      const sellerName = order.seller.businessName || `${order.seller.firstName} ${order.seller.lastName}`;
      
      try {
        // Create notification for buyer
        const buyerNotification = await exports.createBuyerNotification(
          buyer._id,
          'order_placed',
          {
            orderId: order._id,
            order_id: order.order_id,
            amount: `₦${order.totalAmount.toLocaleString()}`,
            items: order.items.map(item => ({
              productName: item.productName || 'Product',
              quantity: item.quantity,
              price: item.price
            })),
            sellerName: sellerName,
            shippingFee: order.shipping?.fee?.amount?.toLocaleString() || '0',
            paymentMethod: order.paymentInfo?.method?.charAt(0).toUpperCase() + order.paymentInfo?.method?.slice(1) || 'Online Payment',
            deliveryAddress: {
              recipientName: `${order.delivery_address.first_name} ${order.delivery_address.last_name}`.trim(),
              recipientAddress: order.delivery_address.line1,
              recipientState: order.delivery_address.state,
              recipientPhone: order.delivery_address.phone,
              recipientEmail: order.delivery_address.email
            }
          }
        );
        
        console.log('Successfully created in-app notification for buyer');
        
        // Send direct email to buyer for single order
        await exports.sendEmailToBuyer(buyer, buyerNotification);
        console.log(`Direct email sent to buyer ${buyer.email} for single order ${order.order_id}`);
      } catch (error) {
        console.error('Error sending single order notification to buyer:', error);
      }
    }
    // For multiple orders, create a consolidated email for the buyer
    else if (uniqueOrders.length > 1) {
      console.log('Creating consolidated email for buyer with multiple orders:', buyer.email);
      
      // Create in-app notifications for each order first
      console.log('Creating in-app notifications for buyer first');
      const buyerNotifications = [];
      for (const order of uniqueOrders) {
        try {
          const notification = await exports.createBuyerNotification(
            buyer._id,
            'order_placed',
            {
              orderId: order._id,
              order_id: order.order_id,
              amount: `₦${order.totalAmount.toLocaleString()}`,
              items: order.items.map(item => ({
                productName: item.productName || 'Product',
                quantity: item.quantity,
                price: item.price
              })),
              sellerName: order.seller.businessName || `${order.seller.firstName} ${order.seller.lastName}`,
              shippingFee: order.shipping?.fee?.amount?.toLocaleString() || '0',
              paymentMethod: order.paymentInfo?.method?.charAt(0).toUpperCase() + order.paymentInfo?.method?.slice(1) || 'Online Payment',
              deliveryAddress: {
                recipientName: `${order.delivery_address.first_name} ${order.delivery_address.last_name}`.trim(),
                recipientAddress: order.delivery_address.line1,
                recipientState: order.delivery_address.state,
                recipientPhone: order.delivery_address.phone,
                recipientEmail: order.delivery_address.email
              }
            }
          );
          buyerNotifications.push(notification);
          console.log(`In-app notification created for buyer for order ${order.order_id}`);
          
          // Mark order as notified
          order.notificationsSent = true;
          await order.save();
          console.log(`Order ${order.order_id} marked as notified`);
        } catch (notifError) {
          console.error(`Error creating in-app notification for order ${order.order_id}:`, notifError);
        }
      }
      
      let totalAmount = 0;
      let allItemsHtml = '';
      
      // Process each order's items for the email
      for (const order of uniqueOrders) {
        const sellerName = order.seller.businessName || `${order.seller.firstName} ${order.seller.lastName}`;
        totalAmount += order.totalAmount;
        
        allItemsHtml += `
          <tr style="background-color: #f9f9f9;">
            <td colspan="4" style="padding: 10px; text-align: left; border: 1px solid #ddd;">
              <strong>Order #${order.order_id} from ${sellerName}</strong>
            </td>
          </tr>
        `;
        
        // Format the items for this order
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach(item => {
            allItemsHtml += `
              <tr>
                <td style="padding: 10px; text-align: left; border: 1px solid #ddd;">${item.productName || 'Product'}</td>
                <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">${item.quantity || 1}</td>
                <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">₦${(item.price || 0).toLocaleString()}</td>
                <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">₦${((item.price || 0) * (item.quantity || 1)).toLocaleString()}</td>
              </tr>
            `;
          });
        }
        
        // Add shipping fee if applicable
        if (order.shipping?.fee?.amount) {
          allItemsHtml += `
            <tr style="background-color: #f9f9f9;">
              <td colspan="3" style="padding: 10px; text-align: right; border: 1px solid #ddd;"><strong>Shipping Fee (${sellerName}):</strong></td>
              <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">₦${order.shipping.fee.amount.toLocaleString()}</td>
            </tr>
          `;
          totalAmount += order.shipping.fee.amount;
        }
      }
      
      // Create the overall table
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
            ${allItemsHtml}
          </tbody>
          <tfoot>
            <tr style="background-color: #f9f9f9;">
              <td colspan="3" style="padding: 10px; text-align: right; border: 1px solid #ddd;"><strong>Grand Total:</strong></td>
              <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">₦${totalAmount.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      `;
      
      // Get delivery information from the first order
      const firstOrder = uniqueOrders[0];
      const deliveryInfoHtml = `
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h3 style="margin-top: 0;">Delivery Information</h3>
          <p><strong>Recipient:</strong> ${firstOrder.delivery_address.first_name} ${firstOrder.delivery_address.last_name}</p>
          <p><strong>Address:</strong> ${firstOrder.delivery_address.line1}</p>
          <p><strong>State:</strong> ${firstOrder.delivery_address.state}</p>
          <p><strong>Phone:</strong> ${maskPhoneNumber(firstOrder.delivery_address.phone)}</p>
          <p><strong>Email:</strong> ${maskEmail(firstOrder.delivery_address.email)}</p>
        </div>
      `;
      
      // Send consolidated email to buyer
      const msg = {
        to: buyer.email,
        from: 'Auqli <support@auqli.com>',
        subject: `Your Orders Have Been Placed - Auqli`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="https://res.cloudinary.com/dljgzevaj/image/upload/v1733928675/Group_178_iqez5h.png" alt="Auqli Logo" style="width: 150px;">
              <h2 style="color: #333; margin-top: 15px;">Your Orders Are Confirmed!</h2>
            </div>
            
            <p style="color: #555; font-size: 16px;">Hello ${buyer.firstName || 'Customer'},</p>
            <p style="color: #555; font-size: 16px;">Thank you for your orders! We're pleased to confirm that your orders have been received and are being processed by our sellers.</p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #4CAF50;">
              <p style="margin: 5px 0;"><strong style="color: #333;">Date:</strong> <span style="color: #555;">${new Date().toLocaleDateString()}</span></p>
              <p style="margin: 5px 0;"><strong style="color: #333;">Orders:</strong> <span style="color: #555;">${uniqueOrders.length} orders from ${allSellers.length} sellers</span></p>
              <p style="margin: 5px 0;"><strong style="color: #333;">Payment Method:</strong> <span style="color: #555;">${firstOrder.paymentInfo?.method?.charAt(0).toUpperCase() + firstOrder.paymentInfo?.method?.slice(1) || 'Online Payment'}</span></p>
            </div>
            
            <h3 style="color: #4CAF50; border-bottom: 2px solid #f0f0f0; padding-bottom: 8px;">Order Details</h3>
            ${itemsTable}
            
            ${deliveryInfoHtml}
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4CAF50;">
              <h4 style="color: #333; margin-top: 0;">What's Next?</h4>
              <ul style="color: #555; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Our sellers will prepare your orders</li>
                <li style="margin-bottom: 8px;">You'll receive updates as your orders are processed</li>
                <li style="margin-bottom: 8px;">Track your orders anytime through your Auqli account</li>
              </ul>
            </div>
            
           
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #777; font-size: 14px; text-align: center;">
              <p>Thank you for shopping with Auqli!</p>
              <p>If you have any questions about your orders, please contact our customer service team at <a href="mailto:support@auqli.com" style="color: #4CAF50; text-decoration: none;">support@auqli.com</a></p>
              <p style="color: #999; font-size: 12px; margin-top: 15px;">© ${new Date().getFullYear()} Auqli. All rights reserved.</p>
            </div>
          </div>
        `
      };
      
      try {
        console.log('Sending consolidated email to buyer:', {
          to: buyer.email,
          from: 'Auqli <support@auqli.com>',
          subject: `Your Orders Have Been Placed - Auqli`,
          orderCount: uniqueOrders.length,
          sellerCount: allSellers.length
        });
        
        // Ensure SendGrid API key is set
        const apiKey = process.env.SENDGRID_API_KEY;
        if (!apiKey) {
          throw new Error('SendGrid API key not configured');
        }
        sgMail.setApiKey(apiKey);
        
        await sgMail.send(msg);
        console.log(`Batch email sent to buyer: ${buyer.email} for ${uniqueOrders.length} orders`);
      } catch (emailError) {
        console.error('Error sending batch email to buyer:', emailError);
        console.error('SendGrid error details:', emailError.response?.body?.errors);
        
        // FALLBACK: If batch email fails, try to send individual emails for each order
        console.log('Attempting to send individual emails as fallback...');
        for (let i = 0; i < buyerNotifications.length; i++) {
          try {
            await exports.sendEmailToBuyer(buyer, buyerNotifications[i]);
            console.log(`Fallback: Individual email sent to buyer for order ${uniqueOrders[i].order_id}`);
          } catch (fallbackError) {
            console.error(`Fallback email failed for order ${uniqueOrders[i].order_id}:`, fallbackError);
          }
        }
      }
    }
    
    console.log(`Batch order notification processing completed for buyer: ${buyerId}`);
    return true;
  } catch (error) {
    console.error('Error in batch order notification processing:', error);
    throw error;
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

exports.processBatchOrderNotifications = async (buyerId) => {
  try {
    console.log('Starting batch order notification processing for buyer:', buyerId);
    
    // Verify SendGrid configuration
    const isConfigValid = verifySendGridConfig();
    console.log('SendGrid configuration valid:', isConfigValid);
    
    const Order = mongoose.model('Order');
    const Buyer = mongoose.model('Buyer');
    const Seller = mongoose.model('Seller');
    
    // Get the buyer
    const buyer = await Buyer.findById(buyerId);
    if (!buyer) {
      console.error('Buyer not found for batch processing:', buyerId);
      return;
    }
    
    console.log('Found buyer for batch processing:', {
      buyerId: buyer._id.toString(),
      email: buyer.email,
      name: `${buyer.firstName} ${buyer.lastName}`
    });
    
    // Find all orders for this buyer that haven't had notifications sent
    const orders = await Order.find({
      buyer: buyerId,
      notificationsSent: false,
      createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) } // Orders created in the last 5 minutes
    }).populate('seller').populate('items.product');
    
    if (orders.length === 0) {
      console.log('No orders found for batch processing for buyer:', buyerId);
      return;
    }
    
    console.log(`Found ${orders.length} orders for batch processing for buyer:`, buyerId);
    
    // Deduplicate orders based on order_id to prevent repeats
    const uniqueOrderMap = new Map();
    orders.forEach(order => {
      uniqueOrderMap.set(order.order_id, order);
    });
    
    const uniqueOrders = Array.from(uniqueOrderMap.values());
    
    console.log(`After deduplication: ${uniqueOrders.length} unique orders for buyer:`, buyerId);
    console.log('Order details:', uniqueOrders.map(order => ({
      orderId: order._id.toString(),
      order_id: order.order_id,
      seller: order.seller ? order.seller._id.toString() : 'Missing seller',
      items: order.items.length,
      notificationsSent: order.notificationsSent
    })));
    
    // Group orders by seller
    const ordersBySeller = {};
    const allSellers = [];
    
    uniqueOrders.forEach(order => {
      if (!order.seller) {
        console.error('Order has no seller:', order._id.toString());
        return;
      }
      
      const sellerId = order.seller._id.toString();
      if (!ordersBySeller[sellerId]) {
        ordersBySeller[sellerId] = [];
        allSellers.push(order.seller);
      }
      ordersBySeller[sellerId].push(order);
    });
    
    console.log('Grouped orders by seller:', Object.keys(ordersBySeller).map(sellerId => ({
      sellerId,
      orderCount: ordersBySeller[sellerId].length
    })));
    
    // Send individual notifications to each seller
    for (const seller of allSellers) {
      const sellerOrders = ordersBySeller[seller._id.toString()];
      console.log(`Processing ${sellerOrders.length} orders for seller:`, seller._id.toString());
      
      for (const order of sellerOrders) {
        try {
          console.log(`Creating notification for seller ${seller._id.toString()} for order ${order.order_id}`);
          
          // Create notification for seller
          const sellerNotification = await exports.createNotification(
            seller._id,
            'new_order',
            {
              orderId: order._id,
              order_id: order.order_id,
              amount: `₦${order.totalAmount.toLocaleString()}`,
              items: order.items.map(item => ({
                productName: item.productName || 'Product',
                quantity: item.quantity,
                price: item.price
              })),
              buyerName: `${buyer.firstName} ${buyer.lastName}`,
              shippingFee: order.shipping?.fee?.amount?.toLocaleString() || '0',
              paymentMethod: order.paymentInfo?.method?.charAt(0).toUpperCase() + order.paymentInfo?.method?.slice(1) || 'Online Payment',
              deliveryAddress: {
                recipientName: order.isStorePickup 
                  ? `${order.pickup_address?.first_name || ''} ${order.pickup_address?.last_name || ''}` 
                  : `${order.delivery_address.first_name} ${order.delivery_address.last_name}`.trim(),
                recipientAddress: order.isStorePickup 
                  ? order.pickup_address?.line1 
                  : order.delivery_address.line1,
                recipientState: order.isStorePickup 
                  ? order.pickup_address?.state 
                  : order.delivery_address.state,
                recipientPhone: order.isStorePickup 
                  ? order.pickup_address?.phone 
                  : order.delivery_address.phone,
                recipientEmail: order.isStorePickup 
                  ? order.pickup_address?.email 
                  : order.delivery_address.email
              }
            }
          );
          
          console.log(`Notification created for seller ${seller._id.toString()}, sending email...`);
          
          // Send email to seller for this specific order
          await exports.sendEmailNotification(seller, sellerNotification);
          console.log(`Email sent to seller ${seller.email} for order ${order.order_id}`);
          
          // Mark order as notified
          order.notificationsSent = true;
          await order.save();
          console.log(`Order ${order.order_id} marked as notified`);
        } catch (error) {
          console.error(`Error processing notification for order ${order.order_id}:`, error);
        }
      }
    }
    
    // For single orders, create a dedicated email to buyer
    if (uniqueOrders.length === 1) {
      console.log('Processing single order notification for buyer:', buyer.email);
      const order = uniqueOrders[0];
      const sellerName = order.seller.businessName || `${order.seller.firstName} ${order.seller.lastName}`;
      
      try {
        // Create notification for buyer
        const buyerNotification = await exports.createBuyerNotification(
          buyer._id,
          'order_placed',
          {
            orderId: order._id,
            order_id: order.order_id,
            amount: `₦${order.totalAmount.toLocaleString()}`,
            items: order.items.map(item => ({
              productName: item.productName || 'Product',
              quantity: item.quantity,
              price: item.price
            })),
            sellerName: sellerName,
            shippingFee: order.shipping?.fee?.amount?.toLocaleString() || '0',
            paymentMethod: order.paymentInfo?.method?.charAt(0).toUpperCase() + order.paymentInfo?.method?.slice(1) || 'Online Payment',
            deliveryAddress: {
              recipientName: order.isStorePickup 
                ? `${order.pickup_address?.first_name || ''} ${order.pickup_address?.last_name || ''}` 
                : `${order.delivery_address.first_name} ${order.delivery_address.last_name}`.trim(),
              recipientAddress: order.isStorePickup 
                ? order.pickup_address?.line1 
                : order.delivery_address.line1,
              recipientState: order.isStorePickup 
                ? order.pickup_address?.state 
                : order.delivery_address.state,
              recipientPhone: order.isStorePickup 
                ? order.pickup_address?.phone 
                : order.delivery_address.phone,
              recipientEmail: order.isStorePickup 
                ? order.pickup_address?.email 
                : order.delivery_address.email
            }
          }
        );
        
        console.log('Successfully created in-app notification for buyer');
        
        // Send direct email to buyer for single order
        await exports.sendEmailToBuyer(buyer, buyerNotification);
        console.log(`Direct email sent to buyer ${buyer.email} for single order ${order.order_id}`);
      } catch (error) {
        console.error('Error sending single order notification to buyer:', error);
      }
    }
    // For multiple orders, create a consolidated email for the buyer
    else if (uniqueOrders.length > 1) {
      console.log('Creating consolidated email for buyer with multiple orders:', buyer.email);
      
      // Create in-app notifications for each order first
      console.log('Creating in-app notifications for buyer first');
      const buyerNotifications = [];
      for (const order of uniqueOrders) {
        try {
          const notification = await exports.createBuyerNotification(
            buyer._id,
            'order_placed',
            {
              orderId: order._id,
              order_id: order.order_id,
              amount: `₦${order.totalAmount.toLocaleString()}`,
              items: order.items.map(item => ({
                productName: item.productName || 'Product',
                quantity: item.quantity,
                price: item.price
              })),
              sellerName: order.seller.businessName || `${order.seller.firstName} ${order.seller.lastName}`,
              shippingFee: order.shipping?.fee?.amount?.toLocaleString() || '0',
              paymentMethod: order.paymentInfo?.method?.charAt(0).toUpperCase() + order.paymentInfo?.method?.slice(1) || 'Online Payment',
              deliveryAddress: {
                recipientName: order.isStorePickup 
                  ? `${order.pickup_address?.first_name || ''} ${order.pickup_address?.last_name || ''}` 
                  : `${order.delivery_address.first_name} ${order.delivery_address.last_name}`.trim(),
                recipientAddress: order.isStorePickup 
                  ? order.pickup_address?.line1 
                  : order.delivery_address.line1,
                recipientState: order.isStorePickup 
                  ? order.pickup_address?.state 
                  : order.delivery_address.state,
                recipientPhone: order.isStorePickup 
                  ? order.pickup_address?.phone 
                  : order.delivery_address.phone,
                recipientEmail: order.isStorePickup 
                  ? order.pickup_address?.email 
                  : order.delivery_address.email
              }
            }
          );
          buyerNotifications.push(notification);
          console.log(`In-app notification created for buyer for order ${order.order_id}`);
          
          // Mark order as notified
          order.notificationsSent = true;
          await order.save();
          console.log(`Order ${order.order_id} marked as notified`);
        } catch (notifError) {
          console.error(`Error creating in-app notification for order ${order.order_id}:`, notifError);
        }
      }
      
      let totalAmount = 0;
      let allItemsHtml = '';
      
      // Process each order's items for the email
      for (const order of uniqueOrders) {
        const sellerName = order.seller.businessName || `${order.seller.firstName} ${order.seller.lastName}`;
        totalAmount += order.totalAmount;
        
        allItemsHtml += `
          <tr style="background-color: #f9f9f9;">
            <td colspan="4" style="padding: 10px; text-align: left; border: 1px solid #ddd;">
              <strong>Order #${order.order_id} from ${sellerName}</strong>
            </td>
          </tr>
        `;
        
        // Format the items for this order
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach(item => {
            allItemsHtml += `
              <tr>
                <td style="padding: 10px; text-align: left; border: 1px solid #ddd;">${item.productName || 'Product'}</td>
                <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">${item.quantity || 1}</td>
                <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">₦${(item.price || 0).toLocaleString()}</td>
                <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">₦${((item.price || 0) * (item.quantity || 1)).toLocaleString()}</td>
              </tr>
            `;
          });
        }
        
        // Add shipping fee if applicable
        if (order.shipping?.fee?.amount) {
          allItemsHtml += `
            <tr style="background-color: #f9f9f9;">
              <td colspan="3" style="padding: 10px; text-align: right; border: 1px solid #ddd;"><strong>Shipping Fee (${sellerName}):</strong></td>
              <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">₦${order.shipping.fee.amount.toLocaleString()}</td>
            </tr>
          `;
          totalAmount += order.shipping.fee.amount;
        }
      }
      
      // Create the overall table
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
            ${allItemsHtml}
          </tbody>
          <tfoot>
            <tr style="background-color: #f9f9f9;">
              <td colspan="3" style="padding: 10px; text-align: right; border: 1px solid #ddd;"><strong>Grand Total:</strong></td>
              <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">₦${totalAmount.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      `;
      
      // Get delivery information from the first order
      const firstOrder = uniqueOrders[0];
      const deliveryInfoHtml = `
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h3 style="margin-top: 0;">Delivery Information</h3>
          <p><strong>Recipient:</strong> ${firstOrder.isStorePickup 
            ? `${firstOrder.pickup_address?.first_name || ''} ${firstOrder.pickup_address?.last_name || ''}` 
            : `${firstOrder.delivery_address.first_name} ${firstOrder.delivery_address.last_name}`}</p>
          <p><strong>Address:</strong> ${firstOrder.isStorePickup 
            ? firstOrder.pickup_address?.line1 
            : firstOrder.delivery_address.line1}</p>
          <p><strong>State:</strong> ${firstOrder.isStorePickup 
            ? firstOrder.pickup_address?.state 
            : firstOrder.delivery_address.state}</p>
          <p><strong>Phone:</strong> ${maskPhoneNumber(firstOrder.isStorePickup 
            ? firstOrder.pickup_address?.phone 
            : firstOrder.delivery_address.phone)}</p>
          <p><strong>Email:</strong> ${maskEmail(firstOrder.isStorePickup 
            ? firstOrder.pickup_address?.email 
            : firstOrder.delivery_address.email)}</p>
        </div>
      `;
      
      // Send consolidated email to buyer
      const msg = {
        to: buyer.email,
        from: 'Auqli <support@auqli.com>',
        subject: `Your Orders Have Been Placed - Auqli`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="https://res.cloudinary.com/dljgzevaj/image/upload/v1733928675/Group_178_iqez5h.png" alt="Auqli Logo" style="width: 150px;">
              <h2 style="color: #333; margin-top: 15px;">Your Orders Are Confirmed!</h2>
            </div>
            
            <p style="color: #555; font-size: 16px;">Hello ${buyer.firstName || 'Customer'},</p>
            <p style="color: #555; font-size: 16px;">Thank you for your orders! We're pleased to confirm that your orders have been received and are being processed by our sellers.</p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #4CAF50;">
              <p style="margin: 5px 0;"><strong style="color: #333;">Date:</strong> <span style="color: #555;">${new Date().toLocaleDateString()}</span></p>
              <p style="margin: 5px 0;"><strong style="color: #333;">Orders:</strong> <span style="color: #555;">${uniqueOrders.length} orders from ${allSellers.length} sellers</span></p>
              <p style="margin: 5px 0;"><strong style="color: #333;">Payment Method:</strong> <span style="color: #555;">${firstOrder.paymentInfo?.method?.charAt(0).toUpperCase() + firstOrder.paymentInfo?.method?.slice(1) || 'Online Payment'}</span></p>
            </div>
            
            <h3 style="color: #4CAF50; border-bottom: 2px solid #f0f0f0; padding-bottom: 8px;">Order Details</h3>
            ${itemsTable}
            
            ${deliveryInfoHtml}
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4CAF50;">
              <h4 style="color: #333; margin-top: 0;">What's Next?</h4>
              <ul style="color: #555; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Our sellers will prepare your orders</li>
                <li style="margin-bottom: 8px;">You'll receive updates as your orders are processed</li>
                <li style="margin-bottom: 8px;">Track your orders anytime through your Auqli account</li>
              </ul>
            </div>
            
           
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #777; font-size: 14px; text-align: center;">
              <p>Thank you for shopping with Auqli!</p>
              <p>If you have any questions about your orders, please contact our customer service team at <a href="mailto:support@auqli.com" style="color: #4CAF50; text-decoration: none;">support@auqli.com</a></p>
              <p style="color: #999; font-size: 12px; margin-top: 15px;">© ${new Date().getFullYear()} Auqli. All rights reserved.</p>
            </div>
          </div>
        `
      };
      
      try {
        console.log('Sending consolidated email to buyer:', {
          to: buyer.email,
          from: 'Auqli <support@auqli.com>',
          subject: `Your Orders Have Been Placed - Auqli`,
          orderCount: uniqueOrders.length,
          sellerCount: allSellers.length
        });
        
        // Ensure SendGrid API key is set
        const apiKey = process.env.SENDGRID_API_KEY;
        if (!apiKey) {
          throw new Error('SendGrid API key not configured');
        }
        sgMail.setApiKey(apiKey);
        
        await sgMail.send(msg);
        console.log(`Batch email sent to buyer: ${buyer.email} for ${uniqueOrders.length} orders`);
      } catch (emailError) {
        console.error('Error sending batch email to buyer:', emailError);
        console.error('SendGrid error details:', emailError.response?.body?.errors);
        
        // FALLBACK: If batch email fails, try to send individual emails for each order
        console.log('Attempting to send individual emails as fallback...');
        for (let i = 0; i < buyerNotifications.length; i++) {
          try {
            await exports.sendEmailToBuyer(buyer, buyerNotifications[i]);
            console.log(`Fallback: Individual email sent to buyer for order ${uniqueOrders[i].order_id}`);
          } catch (fallbackError) {
            console.error(`Fallback email failed for order ${uniqueOrders[i].order_id}:`, fallbackError);
          }
        }
      }
    }
    
    console.log(`Batch order notification processing completed for buyer: ${buyerId}`);
    return true;
  } catch (error) {
    console.error('Error in batch order notification processing:', error);
    throw error;
  }
};

// Send email to seller when a buyer follows their store
exports.sendNewFollowerEmail = async (seller, buyerName) => {
  try {
    console.log(`Sending new follower email to seller: ${seller.email} for buyer: ${buyerName}`);
    
    // Ensure SendGrid API key is set
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      console.error('Cannot send email: SendGrid API key is not configured');
      throw new Error('SendGrid API key not configured');
    }
    
    // Set the API key for safety
    sgMail.setApiKey(apiKey);
    
    // Store name or business name
    const storeName = seller.storeName || seller.businessName || 'Your store';
    
    const msg = {
      to: seller.email,
      from: 'Auqli <support@auqli.com>',
      subject: '🎉 You have a new follower!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://res.cloudinary.com/dljgzevaj/image/upload/v1733928675/Group_178_iqez5h.png" alt="Auqli Logo" style="width: 150px;">
            <h2 style="color: #333; margin-top: 15px;">New Store Follower</h2>
          </div>
          
          <p style="color: #555; font-size: 16px;">Hi ${storeName},</p>
          <p style="color: #555; font-size: 16px;">Great news — ${buyerName} just followed your store on Auqli!</p>
          <p style="color: #555; font-size: 16px;">Keep posting fresh Blips to turn those followers into loyal buyers.</p>
          
          <div style="margin: 25px 0; text-align: center;">
            <a href="https://seller.auqli.live/" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-right: 10px; display: inline-block;">View your profile</a>
            <a href="https://seller.auqli.live/" style="background-color: #333333; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Post a new Blip</a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #777; font-size: 14px; text-align: center;">
            <p>Thank you for selling with Auqli!</p>
            <p style="color: #999; font-size: 12px; margin-top: 15px;">© ${new Date().getFullYear()} Auqli. All rights reserved.</p>
          </div>
        </div>
      `
    };
    
    await sgMail.send(msg);
    console.log(`New follower email sent successfully to seller: ${seller.email}`);
    return true;
  } catch (error) {
    console.error('Error sending new follower email to seller:', error);
    console.error('SendGrid error details:', error.response?.body?.errors);
    return false;
  }
};

// Send email to seller when a buyer comments on their blip
exports.sendBlipCommentEmail = async (seller, buyerName, productName, comment) => {
  try {
    console.log(`Sending blip comment email to seller: ${seller.email} for buyer: ${buyerName}`);
    
    // Ensure SendGrid API key is set
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      console.error('Cannot send email: SendGrid API key is not configured');
      throw new Error('SendGrid API key not configured');
    }
    
    // Set the API key for safety
    sgMail.setApiKey(apiKey);
    
    // Store name or business name
    const sellerName = seller.storeName || seller.businessName || seller.firstName || 'Seller';
    
    const msg = {
      to: seller.email,
      from: 'Auqli <support@auqli.com>',
      subject: '💬 New comment on your Blip',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://res.cloudinary.com/dljgzevaj/image/upload/v1733928675/Group_178_iqez5h.png" alt="Auqli Logo" style="width: 150px;">
            <h2 style="color: #333; margin-top: 15px;">New Comment on Your Blip</h2>
          </div>
          
          <p style="color: #555; font-size: 16px;">Hi ${sellerName},</p>
          <p style="color: #555; font-size: 16px;">${buyerName} just left a comment on your Blip "${productName}":</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #4CAF50;">
            <p style="color: #333; font-style: italic;">"${comment}"</p>
          </div>
          
          <div style="margin: 25px 0; text-align: center;">
            <a href="https://seller.auqli.live/" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-right: 10px; display: inline-block;">Reply to the comment</a>
            <a href="https://seller.auqli.live/" style="background-color: #333333; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Keep posting great content</a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #777; font-size: 14px; text-align: center;">
            <p>Thank you for selling with Auqli!</p>
            <p style="color: #999; font-size: 12px; margin-top: 15px;">© ${new Date().getFullYear()} Auqli. All rights reserved.</p>
          </div>
        </div>
      `
    };
    
    await sgMail.send(msg);
    console.log(`Blip comment email sent successfully to seller: ${seller.email}`);
    return true;
  } catch (error) {
    console.error('Error sending blip comment email to seller:', error);
    console.error('SendGrid error details:', error.response?.body?.errors);
    return false;
  }
};

// Function to handle order creation notifications
