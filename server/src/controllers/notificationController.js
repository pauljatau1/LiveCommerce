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
    default:
      return 'Notification';
  }
};

// Helper function to format notification message
const getNotificationMessage = (type, data) => {
  switch (type) {
    case 'new_order':
      return `You have received a new order #${data.orderId} worth ${data.amount}. ${data.items} item(s) to be fulfilled.`;
    case 'order_paid':
      return `Payment of ${data.amount} received for order #${data.orderId} via ${data.paymentMethod}.`;
    case 'pickup_arranged':
      return `Pickup has been arranged for order #${data.orderId} with ${data.carrier} on ${new Date(data.pickupDate).toLocaleDateString()}.`;
    case 'new_follower':
      return `${data.buyerName} is now following your store.`;
    case 'low_stock':
      return `Your product "${data.productName}" is running low on stock (${data.currentStock} units remaining).`;
    case 'order_delivered':
      return `Order #${data.orderId} has been successfully delivered to the customer.`;
    case 'order_cancelled':
      return `Order #${data.orderId} has been cancelled.`;
    case 'review_received':
      return `A new review has been posted for your product "${data.productName}".`;
    default:
      return 'You have a new notification.';
  }
};

// Helper function to create notifications
exports.createNotification = async (sellerId, type, data) => {
  try {
    // Get the title and message based on notification type
    const title = getNotificationTitle(type);
    const message = getNotificationMessage(type, data);

    const notification = new Notification({
      seller: sellerId,
      type,
      title,
      message,
      data,
      isRead: false
    });

    await notification.save();
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