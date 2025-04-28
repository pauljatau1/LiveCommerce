const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['livestream', 'livestream_weekly', 'livestream_monthly', 'order', 'product', 'user', 'revenue', 'auction']
  },
  date: {
    type: Date,
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  trackedInMixpanel: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Create compound index on type and date for faster queries
analyticsSchema.index({ type: 1, date: 1 });

module.exports = mongoose.model('Analytics', analyticsSchema); 