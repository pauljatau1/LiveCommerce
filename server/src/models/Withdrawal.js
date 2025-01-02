const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'rejected'],
    default: 'pending'
  },
  bankDetails: {
    bankName: String,
    accountNumber: String,
    accountName: String
  },
  requestDate: {
    type: Date,
    default: Date.now
  },
  processedDate: Date,
  notes: [{
    content: String,
    addedBy: {
      type: String,
      enum: ['seller', 'admin']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  reference: {
    type: String,
    unique: true
  }
});

// Generate unique reference before saving
withdrawalSchema.pre('save', async function(next) {
  if (!this.reference) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.reference = `WTH-${timestamp}-${random}`;
  }
  next();
});

module.exports = mongoose.model('Withdrawal', withdrawalSchema); 