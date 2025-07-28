
const mongoose = require('mongoose');

const errorLogSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
  },
  step: {
    type: String,
    required: true,
    enum: ['create_order', 'create_shipment', 'get_rates', 'arrange_shipment', 'payment'],
  },
  error: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('ErrorLog', errorLogSchema);
