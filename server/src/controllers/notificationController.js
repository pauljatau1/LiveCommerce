const Notification = require('../models/Notification');
const sgMail = require('@sendgrid/mail');
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
    default:
      return 'You have a new notification.';
  }
};

// Helper function to create notifications
exports.createNotification = async (sellerId, type, data) => {
  console.log('Creating notification:', { sellerId, type, data });
  try {
    const title = getNotificationTitle(type);
    const message = getNotificationMessage(type, data);

    const notification = new Notification({
      seller: sellerId,
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