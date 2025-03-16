const mongoose = require('mongoose');

const bankChangeRequestSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
    required: true
  },
  currentBankDetails: {
    bankCountry: String,
    bankName: String,
    bankAccountType: String,
    accountCurrency: String,
    accountNumber: String,
    accountName: String,
    swiftCode: String,
    bankIdentifierCode: String
  },
  newBankDetails: {
    bankCountry: { type: String, required: true },
    bankName: { type: String, required: true },
    bankAccountType: { type: String, required: true },
    accountCurrency: { type: String, required: true },
    accountNumber: { type: String, required: true },
    accountName: { type: String, required: true },
    swiftCode: String,
    bankIdentifierCode: String
  },
  proofDocument: {
    url: { type: String, required: true },
    public_id: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  requestDate: {
    type: Date,
    default: Date.now
  },
  processedDate: Date,
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  rejectionReason: String,
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
  }]
});

module.exports = mongoose.model('BankChangeRequest', bankChangeRequestSchema); 