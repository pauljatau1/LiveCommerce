const mongoose = require('mongoose');

const webhookSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  url: { 
    type: String, 
    required: true 
  },
  active: { 
    type: Boolean, 
    default: true 
  },
  events: [{ 
    type: String,
    enum: [
      'shipment.created',
      'shipment.updated',
      'shipment.cancelled',
      'order.created',
      'order.updated',
      'order.cancelled',
      'order.delivered',
      'order.status_updated',
      'order.out_for_delivery',
      'order.delivered',
      'order.tracking_updated',
      'order.dispute_updated',
      'order.refund_status_updated'
    ]
  }],
  owner: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    type: {
      type: String,
      enum: ['Seller', 'Buyer'],
      required: true
    }
  },
  secret: {
    type: String,
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

module.exports = mongoose.model('Webhook', webhookSchema);
