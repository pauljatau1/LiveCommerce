const mongoose = require('mongoose');

const listingCorrectionSchema = new mongoose.Schema({
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, unique: true },
  changes: [{
    _id: false,
    field: { type: String, enum: ['title', 'category', 'subCategory', 'fabric', 'localStyle'], required: true },
    draftValue: { type: String, maxlength: 100 },
    finalValue: { type: String, maxlength: 100 },
  }],
}, { timestamps: true });
listingCorrectionSchema.index({ createdAt: -1, _id: -1 });
module.exports = mongoose.model('ListingCorrection', listingCorrectionSchema);
