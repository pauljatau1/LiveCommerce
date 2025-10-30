const mongoose = require('mongoose');

// SavedBlip schema to track buyer-saved (favourite) blips.
// We store references to the buyer, the parent product, and the embedded blipId.
// A unique index on (buyerId, blipId) guarantees a buyer can only save a blip once.
const savedBlipSchema = new mongoose.Schema({
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Buyer',
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  blipId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure a buyer cannot save the same blip multiple times
savedBlipSchema.index({ buyerId: 1, blipId: 1 }, { unique: true });

module.exports = mongoose.model('SavedBlip', savedBlipSchema);


