// Cached delivery estimates between areas (see services/deliveryEstimate.js).
// One row per seller-area → buyer-area pair; also caches area address codes.
const mongoose = require('mongoose');

const deliveryEstimateSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true }, // "from>to" (lower case "area|state"), or "area:<area|state>" for an address code
  kind: { type: String, enum: ['quote', 'area'], default: 'quote' },
  amount: Number,
  courierName: String,
  deliveryEta: String,
  addressCode: Number,
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

module.exports = mongoose.models.DeliveryEstimate || mongoose.model('DeliveryEstimate', deliveryEstimateSchema);
