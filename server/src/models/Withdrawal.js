const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema({
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
  paymentMethod: {
    type: { type: String, required: true, enum: ['bank_transfer', 'paypal', 'stripe'] },
    details: mongoose.Schema.Types.Mixed
  },
  commissionDeducted: {
    amount: Number,
    rate: Number
  },
  transactionId: String,
  processedAt: Date,
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  notes: [{
    content: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'notes.userType'
    },
    userType: {
      type: String,
      enum: ['Admin', 'Seller']
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Withdrawal', withdrawalSchema);