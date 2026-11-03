const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
    required: true
  },
  type: {
    type: String,
    enum: ['order_payment', 'withdrawal', 'platform_fee', 'processing_fee', 'referral_reward'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed'
  },
  bankDetails: {
    bankName: String,
    accountNumber: String,
    accountName: String
  },
  description: String,
  metadata: {
    categoryFee: Number,        // Store the category fee percentage
    categoryName: String,       // Store the category name
    itemTotal: Number,         // Store the item total amount
    processingFeePercent: Number // Store the processing fee percentage
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add an index for better query performance
transactionSchema.index({ seller: 1, createdAt: -1 });
transactionSchema.index({ orderId: 1 });

module.exports = mongoose.model('Transaction', transactionSchema); 