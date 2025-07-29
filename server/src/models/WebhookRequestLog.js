const mongoose = require('mongoose');

const webhookRequestLogSchema = new mongoose.Schema({
  endpoint: {
    type: String,
    required: true,
    index: true
  },
  method: {
    type: String,
    required: true,
    enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
  },
  headers: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  body: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  query: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  ip: {
    type: String,
    required: false
  },
  userAgent: {
    type: String,
    required: false
  },
  response: {
    statusCode: {
      type: Number,
      required: true
    },
    headers: {
      type: mongoose.Schema.Types.Mixed,
      required: false
    },
    body: {
      type: mongoose.Schema.Types.Mixed,
      required: false
    },
    responseTime: {
      type: Number, // in milliseconds
      required: false
    }
  },
  error: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  success: {
    type: Boolean,
    required: true,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Add compound index for better query performance
webhookRequestLogSchema.index({ endpoint: 1, createdAt: -1 });
webhookRequestLogSchema.index({ success: 1, createdAt: -1 });

module.exports = mongoose.model('WebhookRequestLog', webhookRequestLogSchema); 