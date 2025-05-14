const mongoose = require('mongoose');

const platformNotificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['info', 'warning', 'announcement', 'update', 'promotional', 'maintenance'],
    default: 'info'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for better query performance
platformNotificationSchema.index({ createdAt: -1 });
platformNotificationSchema.index({ isActive: 1 });
platformNotificationSchema.index({ type: 1 });

// Update the updatedAt field on save
platformNotificationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('PlatformNotification', platformNotificationSchema); 