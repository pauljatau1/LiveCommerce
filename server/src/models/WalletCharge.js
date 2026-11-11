const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'Buyer', required: true },
  card: { type: mongoose.Schema.Types.ObjectId, ref: 'PaystackCard', required: true },
  idempotencyKey: { type: String, required: true, maxlength: 100 },
  reference: { type: String, required: true, unique: true },
  amountKobo: { type: Number, required: true },
  status: { type: String, enum: ['processing', 'needs_bank_check', 'success', 'failed'], default: 'processing' },
  accessCode: { type: String, select: false },
}, { timestamps: true });
schema.index({ buyer: 1, idempotencyKey: 1 }, { unique: true });
module.exports = mongoose.model('WalletCharge', schema);
