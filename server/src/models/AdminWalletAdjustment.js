const mongoose = require('mongoose');

// Every manual wallet change made from the admin dashboard: who, when, why,
// and the balance before and after. Written in the same transaction as the change.
const adminWalletAdjustmentSchema = new mongoose.Schema({
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  adminEmail: { type: String },
  party: { type: String, enum: ['seller', 'buyer'], required: true },
  partyId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  direction: { type: String, enum: ['add', 'deduct'], required: true },
  amount: { type: Number, required: true, min: 1 },
  reason: { type: String, required: true, trim: true, minlength: 5, maxlength: 300 },
  balanceBefore: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.models.AdminWalletAdjustment || mongoose.model('AdminWalletAdjustment', adminWalletAdjustmentSchema);
