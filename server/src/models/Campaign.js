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
    conversions: { type: Number, default: 0 }, // Number of recipients who made a purchase
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
      enum: ['pending', 'sent', 'delivered', 'opened', 'clicked', 'converted'],
      default: 'pending'
    },
    trackingId: {
      type: String,
      sparse: true
    },
    deliveredAt: Date,
    openedAt: Date,
    clickedAt: Date,
    convertedAt: Date, // When they made a purchase attributed to this campaign
    orderAmount: { type: Number }, // Amount of the purchase
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
  },
  performance: {
    engagementScore: { type: Number, default: 0 }, // 0-100 score based on opens, clicks, and conversions
    revenue: { type: Number, default: 0 }, // Total revenue from this campaign
    roi: { type: Number, default: 0 }, // Return on investment percentage
    averageOrderValue: { type: Number, default: 0 } // Average order value from conversions
  }
});

// Index for tracking ID lookups
campaignSchema.index({ 'recipients.trackingId': 1 });
// Index for buyer lookups to speed up conversion tracking
campaignSchema.index({ 'recipients.buyer': 1 });
// Index for tracking recent campaigns
campaignSchema.index({ 'createdAt': -1 });

// Calculate performance metrics before saving
campaignSchema.pre('save', function(next) {
  try {
    // Only run calculations if we have recipients and stats
    if (this.recipients && this.recipients.length > 0 && this.stats) {
      // Count converted recipients
      const converted = this.recipients.filter(r => r.status === 'converted').length;
      
      // Calculate total revenue
      const totalRevenue = this.recipients
        .filter(r => r.orderAmount)
        .reduce((sum, r) => sum + (r.orderAmount || 0), 0);
      
      // Update conversions count
      this.stats.conversions = converted;
      
      // Update performance metrics
      this.performance = this.performance || {};
      this.performance.revenue = totalRevenue;
      
      // Calculate engagement score
      const engagementScore = Math.min(100, Math.round(
        ((this.stats.opened * 1) + 
         (this.stats.clicked * 3) + 
         (converted * 10)) / 
        Math.max(1, this.stats.totalRecipients) * 20
      ));
      this.performance.engagementScore = engagementScore;
      
      // Calculate average order value
      this.performance.averageOrderValue = converted > 0 ? 
        Math.round(totalRevenue / converted * 100) / 100 : 0;
    }
    next();
  } catch (error) {
    console.error('Error calculating campaign performance metrics:', error);
    next();
  }
});

module.exports = mongoose.model('Campaign', campaignSchema); 