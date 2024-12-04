const Notification = require('../models/Notification');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey('SG.REDACTED');

// Helper function to send email notification
const sendEmailNotification = async (seller, notification) => {
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

// Create notification and send email
exports.createNotification = async (seller, type, title, message, data = {}) => {
  try {
    const notification = new Notification({
      seller: seller._id,
      type,
      title,
      message,
      data
    });

    await notification.save();
    await sendEmailNotification(seller, notification);
    return notification;
  } catch (error) {
    console.error('Notification creation failed:', error);
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