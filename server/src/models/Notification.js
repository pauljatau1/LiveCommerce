const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller'
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Buyer'
  },
  recipient: {
    type: String,
    enum: ['buyer', 'seller'],
    required: true
  },
  type: {
    type: String,
    // enum: [
    //   'new_order',
    //   'order_paid',
    //   'pickup_arranged',
    //   'new_follower',
    //   'low_stock',
    //   'order_delivered',
    //   'order_cancelled',
    //   'review_received'
    // ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add index for better query performance
notificationSchema.index({ seller: 1, createdAt: -1 });
notificationSchema.index({ buyer: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
