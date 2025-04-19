const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxLength: 100
  },
  message: {
    type: String,
    required: true
  },
  media: [{
    url: String,
    public_id: String,
    type: String // image/video
  }],
  selectedProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  audienceType: {
    type: String,
    enum: ['all', 'active', 'inactive', 'recent'],
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sent', 'failed'],
    default: 'draft'
  },
  scheduledFor: {
    type: Date
  },
  stats: {
    totalRecipients: { type: Number, default: 0 },
    opened: { type: Number, default: 0 },
    clicked: { type: Number, default: 0 },
    sales: { type: Number, default: 0 },
    uniqueOpens: { type: Number, default: 0 },
    uniqueClicks: { type: Number, default: 0 },
    lastOpenAt: Date,
    lastClickAt: Date,
    deviceStats: {
      desktop: { type: Number, default: 0 },
      mobile: { type: Number, default: 0 },
      tablet: { type: Number, default: 0 }
    },
    locationStats: {
      type: Map,
      of: Number,
      default: new Map()
    }
  },
  recipients: [{
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Buyer'
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'opened', 'clicked'],
      default: 'pending'
    },
    trackingId: {
      type: String,
      sparse: true
    },
    deliveredAt: Date,
    openedAt: Date,
    clickedAt: Date,
    openCount: { type: Number, default: 0 },
    clickCount: { type: Number, default: 0 },
    lastDeviceType: String,
    lastLocation: String,
    lastUserAgent: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  emailStatus: {
    sent: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    lastSent: Date
  }
});

// Index for tracking ID lookups
campaignSchema.index({ 'recipients.trackingId': 1 });

module.exports = mongoose.model('Campaign', campaignSchema); 