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
    sales: { type: Number, default: 0 }
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
    deliveredAt: Date,
    openedAt: Date,
    clickedAt: Date
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

module.exports = mongoose.model('Campaign', campaignSchema); 