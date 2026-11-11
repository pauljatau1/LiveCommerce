const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'Buyer', required: true },
  authorization: { type: String, required: true, select: false }, // encrypted, never serialized
  signature: { type: String, required: true, select: false },
  email: { type: String, required: true, select: false },
  bank: String, brand: String, last4: String, expMonth: Number, expYear: Number,
}, { timestamps: true });
schema.index({ buyer: 1, signature: 1 }, { unique: true });
module.exports = mongoose.model('PaystackCard', schema);
