const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema({
  payoutFlow:{type:String,enum:['review','legacy'],default:'legacy'},
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
    enum: ['pending', 'processing', 'completed', 'rejected', 'failed', 'reversed'],
    default: 'pending'
  },
  bankDetails: {
    bankName: String,
    accountNumber: String,
    accountName: String,
    bankIdentifierCode: String
  },
  paymentInfo: {
    transferReference: String,
    transferRecipientCode: String,
    initiatedAt: Date,
    completedAt: Date,
    failureReason: String,
    amount: Number,
    amountInKobo: Number,
    paystackStatus: String,
    lastChecked: Date,
    reference: String
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
      enum: ['seller', 'admin', 'system']
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
withdrawalSchema.pre('save', async function (next) {
  if (!this.reference) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.reference = `WTH-${timestamp}-${random}`;
  }
  next();
});

module.exports = mongoose.model('Withdrawal', withdrawalSchema); 