const mongoose = require('mongoose');

const evidenceSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['image', 'video'],
    required: true
  },
  url: { type: String, required: true },
  public_id: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now }
});

const returnSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Buyer',
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    reason: {
      type: String,
      required: true
    }
  }],
  status: {
    type: String,
    enum: [
      'PENDING_SELLER_REVIEW',
      'NEED_MORE_INFO',
      'APPROVED',
      'REJECTED',
      'IN_TRANSIT',
      'RECEIVED',
      'REFUNDED',
      'CLOSED',
      'DISPUTED',
      'RESOLVED'
    ],
    default: 'PENDING_SELLER_REVIEW'
  },
  description: {
    type: String,
    required: true
  },
  evidence: [evidenceSchema],
  preferredResolution: {
    type: String,
    enum: ['refund', 'replacement', 'partial_refund'],
    required: true
  },
  requestDate: {
    type: Date,
    default: Date.now
  },
  sellerResponse: {
    status: String,
    message: String,
    date: Date,
    partialRefundAmount: Number
  },
  adminNotes: [{
    note: String,
    date: { type: Date, default: Date.now },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    }
  }],
  returnShippingLabel: {
    url: String,
    carrier: String,
    trackingNumber: String,
    generatedAt: Date
  },
  timeline: [{
    status: String,
    date: { type: Date, default: Date.now },
    note: String,
    updatedBy: {
      type: String,
      enum: ['buyer', 'seller', 'admin', 'system']
    }
  }],
  refundDetails: {
    amount: Number,
    processedAt: Date,
    method: {
      type: String,
      enum: ['bank_transfer', 'wallet_credit', 'payment_reversal']
    },
    transactionId: String,
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    notes: String
  },
  isEligible: {
    type: Boolean,
    default: true
  },
  eligibilityCheckedAt: Date,
  closedAt: Date,
  closedBy: {
    type: String,
    enum: ['buyer', 'seller', 'admin', 'system']
  },
  dispute: {
    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'dispute.initiatorType'
    },
    initiatorType: {
      type: String,
      enum: ['Buyer', 'Seller']
    },
    reason: String,
    description: String,
    evidence: [String],
    status: {
      type: String,
      enum: ['PENDING', 'IN_REVIEW', 'RESOLVED'],
      default: 'PENDING'
    },
    createdAt: Date,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    resolvedAt: Date,
    resolution: {
      type: {
        type: String,
        enum: ['approve_return', 'reject_return', 'partial_refund']
      },
      note: String,
      refundAmount: Number
    }
  }
});

// Add index for better query performance
returnSchema.index({ order: 1, status: 1 });
returnSchema.index({ buyer: 1, status: 1 });
returnSchema.index({ seller: 1, status: 1 });

// Middleware to update timeline on status change
returnSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.timeline.push({
      status: this.status,
      date: new Date(),
      updatedBy: 'system'
    });
  }
  next();
});

// Add an index for better query performance on refund status
returnSchema.index({ status: 1, 'refundDetails.processedAt': 1 });

// Add a virtual for refund status
returnSchema.virtual('refundStatus').get(function() {
  if (!this.refundDetails) return 'PENDING';
  return this.refundDetails.processedAt ? 'COMPLETED' : 'PROCESSING';
});

module.exports = mongoose.model('Return', returnSchema); 