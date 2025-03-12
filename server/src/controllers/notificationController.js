const Notification = require('../models/Notification');
const sgMail = require('@sendgrid/mail');
const Order = require('../models/Order');
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
      return `Pickup has been arranged for order #${data.order_id} with ${data.carrier} on ${new Date(data.pickupDate).toLocaleDateString()}.`;
    case 'new_follower':
      return `${data.buyerName} is now following your store.`;
    case 'low_stock':
      return `Your product "${data.productName}" is running low on stock (${data.currentStock} units remaining).`;
    case 'order_delivered':
      return `Order #${data.order_id} has been successfully delivered to the customer.`;
    case 'order_cancelled':
      return `Order #${data.order_id} has been cancelled.`;
    case 'review_received':
      return `A new review has been posted for your product "${data.productName}".`;
    case 'new_campaign':
      return `${data.storeName} has a new campaign: ${data.campaignTitle}. ${data.message}`;
    case 'campaign_scheduled':
      return `${data.storeName} has scheduled a campaign for ${new Date(data.scheduledFor).toLocaleDateString()}: ${data.campaignTitle}`;
    case 'order_closed':
      const amount = typeof data.amount === 'number' ? data.amount.toLocaleString() : '0';
      const newBalance = typeof data.newWalletBalance === 'number' ? data.newWalletBalance.toLocaleString() : '0';
      return `Order #${data.order_id} has been closed and ₦${amount} has been released to your wallet. New balance: ₦${newBalance}.`;
    case 'order_status_update':
      return `Your order #${data.order_id} status has been updated to ${data.status}.`;
    case 'order_shipped':
      return `Your order #${data.order_id} has been shipped! Track your package with ${data.carrier}.`;
    case 'coupon_received':
      return `${data.sellerName} has sent you a ${data.discount}% discount coupon valid until ${new Date(data.validUntil).toLocaleDateString()}.`;
    case 'price_drop':
      return `Good news! "${data.productName}" is now ${data.discount}% off.`;
    case 'back_in_stock':
      return `"${data.productName}" is back in stock! Don't miss out.`;
    case 'seller_message':
      return `New message from ${data.sellerName} regarding order #${data.order_id}.`;
    case 'order_reminder':
      return `Please confirm receipt of order #${data.order_id} delivered on ${new Date(data.deliveryDate).toLocaleDateString()}.`;
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
      return `Return pickup has been arranged for order #${data.order_id} with ${data.carrier} on ${new Date(data.pickupDate).toLocaleDateString()}.`;
    case 'return_request':
      return `New return request received from ${data.buyerName} for order #${data.order_id}.`;
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
      
      return `Your order #${data.order_id} has been placed successfully for ${data.amount}. ${orderItemsText} from ${data.sellerName}. ${buyerDeliveryInfo} ${buyerPaymentInfo} ${shippingInfo}`;
    case 'new_message':
      return `${data.senderName} sent you a message: "${data.messagePreview}"`;
    case 'buyer_message':
      return `${data.buyerName} sent you a message: "${data.messagePreview}"`;
    default:
      return 'You have a new notification.';
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
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Helper function to send email notification
exports.sendEmailNotification = async (seller, notification) => {
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
        <p><strong>Phone:</strong> ${orderData.deliveryAddress.recipientPhone || ''}</p>
        <p><strong>Email:</strong> ${orderData.deliveryAddress.recipientEmail || ''}</p>
      </div>
    `;
  }
  
  const msg = {
    to: seller.email,
    from: 'Auqli Seller <joseph@auqli.com>',
    subject: notification.title,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #333;">New Order Received</h2>
        </div>
        <p>Hello ${seller.firstName || 'Seller'},</p>
        <p>You have received a new order from ${orderData.buyerName || 'a customer'}.</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Order ID:</strong> ${orderData.order_id || ''}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Payment Method:</strong> ${orderData.paymentMethod || 'Online Payment'}</p>
        </div>
        
        <h3>Order Details</h3>
        ${itemsHtml}
        
        ${deliveryInfoHtml}
        
        <p>Please log in to your Auqli seller dashboard to process this order.</p>
        <div style="text-align: center; margin-top: 20px;">
          <a href="https://seller.auqli.com/orders" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Order Details</a>
        </div>
        <p style="margin-top: 20px;">Thank you for selling with Auqli!</p>
        <p>Best regards,<br>The Auqli Team</p>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
  } catch (error) {
    console.error('Email sending failed:', error);
  }
};

// Helper function to send email notification to buyer
exports.sendEmailToBuyer = async (buyer, notification) => {
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
        <p><strong>Phone:</strong> ${orderData.deliveryAddress.recipientPhone || ''}</p>
      </div>
    `;
  }
  
  const msg = {
    to: buyer.email,
    from: 'Auqli <support@auqli.com>',
    subject: notification.title,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #333;">Order Confirmation</h2>
        </div>
        <p>Hello ${buyer.firstName || 'Customer'},</p>
        <p>Thank you for your order! We're pleased to confirm that your order has been received and is being processed.</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Order ID:</strong> ${orderData.order_id || ''}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Seller:</strong> ${orderData.sellerName || 'Seller'}</p>
          <p><strong>Payment Method:</strong> ${orderData.paymentMethod || 'Online Payment'}</p>
        </div>
        
        <h3>Order Details</h3>
        ${itemsHtml}
        
        ${deliveryInfoHtml}
        
        <p>You can track the status of your order by logging into your Auqli account.</p>
        <div style="text-align: center; margin-top: 20px;">
          <a href="https://auqli.com/orders" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Track Your Order</a>
        </div>
        <p style="margin-top: 20px;">If you have any questions about your order, please contact our customer service team.</p>
        <p>Thank you for shopping with Auqli!</p>
        <p>Best regards,<br>The Auqli Team</p>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log(`Email sent to buyer: ${buyer.email}`);
  } catch (error) {
    console.error('Email sending to buyer failed:', error);
  }
};

// Function to handle order creation notifications
exports.handleOrderCreationNotifications = async (order, buyer, seller) => {
  try {
    // Validate input parameters
    if (!order || !buyer || !seller) {
      console.error('Missing required parameters for order notifications:', {
        orderProvided: !!order,
        buyerProvided: !!buyer,
        sellerProvided: !!seller
      });
      throw new Error('Missing required parameters for order notifications');
    }
    
    // Log the input parameters for debugging
    console.log('handleOrderCreationNotifications called with:', {
      orderId: order._id,
      orderNumber: order.order_id,
      buyerId: buyer._id,
      buyerName: `${buyer.firstName} ${buyer.lastName}`,
      sellerId: seller._id,
      sellerName: seller.businessName || `${seller.firstName} ${seller.lastName}`
    });
    
    // Get detailed product information
    const items = order.items.map(item => ({
      productName: item.productName || 'Product',
      quantity: item.quantity,
      price: item.price
    }));
    
    // Get shipping fee
    const shippingFee = order.shipping && order.shipping.fee ? 
      order.shipping.fee.amount.toLocaleString() : '0';
    
    // Get payment method
    const paymentMethod = order.paymentInfo && order.paymentInfo.method ? 
      order.paymentInfo.method.charAt(0).toUpperCase() + order.paymentInfo.method.slice(1) : 
      'Online Payment';
    
    // Get delivery address
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
        order_id: order.order_id,
        amount: `₦${order.totalAmount.toLocaleString()}`,
        items: items,
        sellerName: seller.businessName || `${seller.firstName} ${seller.lastName}`,
        shippingFee: shippingFee,
        paymentMethod: paymentMethod,
        deliveryAddress: deliveryAddress
      }
    );
    
    // Send email to buyer
    await exports.sendEmailToBuyer(buyer, buyerNotification);
    
    console.log(`Order creation notifications sent for order: ${order.order_id}`);
    return { sellerNotification, buyerNotification };
  } catch (error) {
    console.error('Error handling order creation notifications:', error);
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
          email: 'joseph@auqli.com',
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
              
              <div style="margin-top: 30px; text-align: center;">
                <a href="${process.env.FRONTEND_URL}/store/${seller._id}" 
                   style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Visit Store
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 12px; margin-top: 20px; text-align: center;">
                You're receiving this email because you follow ${seller.businessName || seller.firstName} on Auqli.
                <br>
                <a href="${process.env.FRONTEND_URL}/unsubscribe/${recipient.buyer._id}" style="color: #4f46e5;">Unsubscribe</a>
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
    const mongoose = require('mongoose');
    const Order = mongoose.model('Order');
    const order = await Order.findOne({ 'shipping.fez_order_number': orderNumber });
    
    if (!order) {
      return res.status(404).json({
        message: `Order with Fez order number ${orderNumber} not found`
      });
    }

    // Create mock webhook data
    const mockWebhookData = {
      orderNumber,
      status,
      location: "Lagos, NG",
      timestamp: new Date().toISOString()
    };

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

// Helper function to send push notification
const sendPushNotification = async (expoPushToken, title, body, data = {}) => {
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

// Modify createBuyerNotification to include push notification
exports.createBuyerNotification = async (buyerId, type, data) => {
  try {
    const title = getNotificationTitle(type);
    const message = getNotificationMessage(type, data);

    // Create notification in database
    const notification = new Notification({
      buyer: buyerId,
      recipient: 'buyer',
      type,
      title,
      message,
      data
    });

    await notification.save();

    // Find buyer's expo push token
    const Buyer = require('../models/Buyer');
    const buyer = await Buyer.findById(buyerId);

    if (buyer && buyer.expoPushToken) {
      // Send push notification
      await sendPushNotification(
        buyer.expoPushToken,
        title,
        message,
        {
          type,
          notificationId: notification._id,
          ...data
        }
      );
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

    const notifications = await Notification.find({ 
      buyer: req.user.id,
      recipient: 'buyer'
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Notification.countDocuments({ 
      buyer: req.user.id,
      recipient: 'buyer'
    });

    res.json({
      notifications,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalNotifications: total
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
        recipient: 'buyer'
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
        isRead: false 
      },
      { isRead: true }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark all notifications as read', error: error.message });
  }
};