const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
    required: true
  },
  type: {
    type: String,
    enum: ['order_payment', 'withdrawal', 'platform_fee'],
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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Transaction', transactionSchema); 