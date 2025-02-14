const Notification = require('../models/Notification');
const sgMail = require('@sendgrid/mail');
const Order = require('../models/Order');
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
      return 'New Campaign from Your Favorite Store';
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
    default:
      return 'Notification';
  }
};

// Helper function to format notification message
const getNotificationMessage = (type, data) => {
  switch (type) {
    case 'new_order':
      return `You have received a new order #${data.order_id} worth ${data.amount}. ${data.items} item(s) to be fulfilled.`;
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
  const msg = {
    to: seller.email,
    from: 'Auqli Seller <joseph@auqli.com>',
    subject: notification.title,
    text: notification.message,
    html: `<strong>${notification.message}</strong>`,
  };

  try {
    await sgMail.send(msg);
  } catch (error) {
    console.error('Email sending failed:', error);
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

// Add these webhook handler functions
const handleShipmentCreated = async (webhookData) => {
  try {
    const order = await Order.findOne({ 'shipping.shipment_id': webhookData.shipment_id })
      .populate('buyer', 'email firstName lastName')
      .populate('seller', 'email firstName lastName businessName');

    if (!order) {
      console.log('Order not found for shipment:', webhookData.shipment_id);
      return;
    }

    // Update order shipping information
    const shippingUpdate = {
      $set: {
        'shipping.tracking.number': webhookData.tracking_number,
        'shipping.tracking.url': webhookData.carrier_tracking_url,
        'shipping.tracking.status': 'pickup_arranged',
        'shipping.tracking.lastUpdate': new Date(),
        'shipping.documents.shippingLabel': webhookData.shipping_label_url,
        'shipping.documents.commercialInvoice': webhookData.commercial_invoice_url
      },
      $push: {
        'shipping.tracking.history': {
          status: 'pickup_arranged',
          timestamp: new Date(),
          location: webhookData.events[0]?.location || 'Unknown',
          description: webhookData.events[0]?.description || 'Shipment created'
        }
      }
    };

    await Order.findByIdAndUpdate(order._id, shippingUpdate);

    // Send email to buyer
    const buyerEmail = {
      to: order.buyer.email,
      from: 'Auqli Shipping <joseph@auqli.com>',
      subject: 'Your Order Has Been Shipped - Auqli',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Your Order is Being Prepared for Shipping!</h2>
          <p>Dear ${order.buyer.firstName},</p>
          <p>Great news! Your order #${order.order_id} is being prepared for shipping by ${order.seller.businessName || order.seller.firstName}.</p>
          <p><strong>Tracking Details:</strong></p>
          <ul>
            <li>Tracking Number: ${webhookData.tracking_number}</li>
            <li>Carrier: ${webhookData.carrier_name}</li>
          </ul>
          <p>You can track your shipment here: <a href="${webhookData.carrier_tracking_url}">Track Shipment</a></p>
          <p>We'll keep you updated on your shipment's progress.</p>
          <p>Best regards,<br>The Auqli Team</p>
        </div>
      `
    };

    // Send email to seller
    const sellerEmail = {
      to: order.seller.email,
      from: 'Auqli Shipping <joseph@auqli.com>',
      subject: 'Shipment Created Successfully - Auqli',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Shipment Created Successfully</h2>
          <p>Dear ${order.seller.firstName},</p>
          <p>A shipment has been created for order #${order.order_id}.</p>
          <p><strong>Shipping Details:</strong></p>
          <ul>
            <li>Tracking Number: ${webhookData.tracking_number}</li>
            <li>Carrier: ${webhookData.carrier_name}</li>
          </ul>
          <p><strong>Important Documents:</strong></p>
          <ul>
            <li><a href="${webhookData.shipping_label_url}">Download Shipping Label</a></li>
            <li><a href="${webhookData.commercial_invoice_url}">Download Commercial Invoice</a></li>
          </ul>
          <p>Please ensure the package is ready for pickup.</p>
          <p>Best regards,<br>The Auqli Team</p>
        </div>
      `
    };

    // Send emails
    await Promise.all([
      sgMail.send(buyerEmail),
      sgMail.send(sellerEmail)
    ]);

    // Create notification for seller
    await exports.createNotification(order.seller, 'shipment_created', {
      orderId: order._id,
      order_id: order.order_id,
      tracking_number: webhookData.tracking_number
    });

  } catch (error) {
    console.error('Error handling shipment.created webhook:', error);
    throw error;
  }
};

const handleShipmentInTransit = async (webhookData) => {
  try {
    const order = await Order.findOne({ 'shipping.shipment_id': webhookData.shipment_id })
      .populate('buyer', 'email firstName lastName')
      .populate('seller', 'email firstName lastName businessName');

    if (!order) {
      console.log('Order not found for shipment:', webhookData.shipment_id);
      return;
    }

    // Update order shipping information
    const shippingUpdate = {
      $set: {
        'shipping.tracking.status': 'in-transit',
        'shipping.tracking.lastUpdate': new Date()
      },
      $push: {
        'shipping.tracking.history': {
          status: 'in-transit',
          timestamp: new Date(),
          location: webhookData.events[0]?.location || 'Unknown',
          description: webhookData.events[0]?.description || 'Shipment in transit'
        }
      }
    };

    await Order.findByIdAndUpdate(order._id, shippingUpdate);

    // Send email to buyer
    const buyerEmail = {
      to: order.buyer.email,
      from: 'Auqli Shipping <joseph@auqli.com>',
      subject: 'Your Order is On the Way - Auqli',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Your Order is On the Move!</h2>
          <p>Dear ${order.buyer.firstName},</p>
          <p>Your order #${order.order_id} from ${order.seller.businessName || order.seller.firstName} is now in transit!</p>
          <p><strong>Latest Update:</strong></p>
          <ul>
            <li>Status: In Transit</li>
            <li>Location: ${webhookData.events[0]?.location || 'Unknown'}</li>
            <li>Tracking Number: ${webhookData.tracking_number}</li>
          </ul>
          <p>Track your shipment: <a href="${webhookData.carrier_tracking_url}">Click here</a></p>
          <p>We'll notify you when your package is delivered.</p>
          <p>Best regards,<br>The Auqli Team</p>
        </div>
      `
    };

    // Send email to seller
    const sellerEmail = {
      to: order.seller.email,
      from: 'Auqli Shipping <joseph@auqli.com>',
      subject: 'Order In Transit - Auqli',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Order Now In Transit</h2>
          <p>Dear ${order.seller.firstName},</p>
          <p>Order #${order.order_id} is now in transit to the customer.</p>
          <p><strong>Shipping Update:</strong></p>
          <ul>
            <li>Status: In Transit</li>
            <li>Location: ${webhookData.events[0]?.location || 'Unknown'}</li>
            <li>Tracking Number: ${webhookData.tracking_number}</li>
          </ul>
          <p>Track the shipment: <a href="${webhookData.carrier_tracking_url}">Click here</a></p>
          <p>Best regards,<br>The Auqli Team</p>
        </div>
      `
    };

    // Send emails
    await Promise.all([
      sgMail.send(buyerEmail),
      sgMail.send(sellerEmail)
    ]);

    // Create notification for seller
    await exports.createNotification(order.seller, 'shipment_in_transit', {
      orderId: order._id,
      order_id: order.order_id,
      tracking_number: webhookData.tracking_number
    });

  } catch (error) {
    console.error('Error handling shipment.in-transit webhook:', error);
    throw error;
  }
};

const handleShipmentDelivered = async (webhookData) => {
  try {
    const order = await Order.findOne({ 'shipping.shipment_id': webhookData.shipment_id })
      .populate('buyer', 'email firstName lastName')
      .populate('seller', 'email firstName lastName businessName');

    if (!order) {
      console.log('Order not found for shipment:', webhookData.shipment_id);
      return;
    }

    // Update order shipping information
    const shippingUpdate = {
      $set: {
        'shipping.tracking.status': 'delivered',
        'shipping.tracking.lastUpdate': new Date(),
        'shipping.delivery.actualDate': new Date()
      },
      $push: {
        'shipping.tracking.history': {
          status: 'delivered',
          timestamp: new Date(),
          location: webhookData.events[0]?.location || 'Unknown',
          description: webhookData.events[0]?.description || 'Shipment delivered'
        }
      }
    };

    await Order.findByIdAndUpdate(order._id, shippingUpdate);

    // Send email to buyer
    const buyerEmail = {
      to: order.buyer.email,
      from: 'Auqli Shipping <joseph@auqli.com>',
      subject: 'Your Order Has Been Delivered - Auqli',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Your Order Has Been Delivered!</h2>
          <p>Dear ${order.buyer.firstName},</p>
          <p>Great news! Your order #${order.order_id} from ${order.seller.businessName || order.seller.firstName} has been delivered.</p>
          <p><strong>Delivery Details:</strong></p>
          <ul>
            <li>Delivered on: ${new Date().toLocaleDateString()}</li>
            <li>Location: ${webhookData.events[0]?.location || 'Delivery Address'}</li>
          </ul>
          <p>We hope you enjoy your purchase! If you have any questions or concerns, please don't hesitate to contact us.</p>
          <p>Best regards,<br>The Auqli Team</p>
        </div>
      `
    };

    // Send email to seller
    const sellerEmail = {
      to: order.seller.email,
      from: 'Auqli Shipping <joseph@auqli.com>',
      subject: 'Order Delivered Successfully - Auqli',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Order Delivered Successfully</h2>
          <p>Dear ${order.seller.firstName},</p>
          <p>Order #${order.order_id} has been successfully delivered to the customer.</p>
          <p><strong>Delivery Details:</strong></p>
          <ul>
            <li>Delivered on: ${new Date().toLocaleDateString()}</li>
            <li>Location: ${webhookData.events[0]?.location || 'Delivery Address'}</li>
          </ul>
          <p>Thank you for using Auqli!</p>
          <p>Best regards,<br>The Auqli Team</p>
        </div>
      `
    };

    // Send emails
    await Promise.all([
      sgMail.send(buyerEmail),
      sgMail.send(sellerEmail)
    ]);

    // Create notification for seller
    await exports.createNotification(order.seller, 'order_delivered', {
      orderId: order._id,
      order_id: order.order_id,
      tracking_number: webhookData.tracking_number
    });

  } catch (error) {
    console.error('Error handling shipment.delivered webhook:', error);
    throw error;
  }
};

// Update the simulateShipmentWebhook function to use these handlers
exports.simulateShipmentWebhook = async (req, res) => {
  try {
    const { shipment_id, status, tracking_number } = req.body;

    console.log('Simulating shipment webhook:', {
      shipment_id,
      status,
      tracking_number
    });

    // Validate required fields
    if (!shipment_id || !status || !tracking_number) {
      return res.status(400).json({
        message: 'Missing required fields: shipment_id, status, and tracking_number are required'
      });
    }

    // Validate status
    const validStatuses = ['created', 'in-transit', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Create mock webhook data
    const mockWebhookData = {
      shipment_id,
      status,
      tracking_number,
      carrier_name: "DHL Express",
      carrier_tracking_url: `https://www.dhl.com/global-en/home/tracking.html?tracking-id=${tracking_number}`,
      shipping_label_url: `https://sandbox.terminal.africa/v1/shipments/label/${shipment_id}.pdf`,
      commercial_invoice_url: `https://sandbox.terminal.africa/v1/shipments/commercial-invoice/${shipment_id}.pdf`,
      events: [{
        location: "Lagos, NG",
        description: `Shipment ${status}`,
        created_at: new Date()
      }]
    };

    // Handle different webhook events
    switch (status) {
      case 'in-transit':
        await handleShipmentInTransit(mockWebhookData);
        break;
      case 'delivered':
        await handleShipmentDelivered(mockWebhookData);
        break;
      case 'cancelled':
        // Implement cancelled handler if needed
        console.log('Shipment cancelled:', mockWebhookData);
        break;
      default:
        await handleShipmentCreated(mockWebhookData);
    }

    res.json({
      message: `Webhook event '${status}' simulated successfully`,
      data: mockWebhookData
    });

  } catch (error) {
    console.error('Error in simulateShipmentWebhook:', error);
    res.status(500).json({ 
      message: 'Failed to simulate webhook event',
      error: error.message 
    });
  }
};

// Create a new function for buyer notifications
exports.createBuyerNotification = async (buyerId, type, data) => {
  try {
    const title = getNotificationTitle(type);
    const message = getNotificationMessage(type, data);

    const notification = new Notification({
      buyer: buyerId,
      recipient: 'buyer',
      type,
      title,
      message,
      data
    });

    await notification.save();
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