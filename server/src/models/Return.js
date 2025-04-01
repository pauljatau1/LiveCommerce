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
      'PENDING_ADMIN_REVIEW',
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
    enum: ['refund', 'replacement'],
    required: true
  },
  replacementProduct: {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    variant: Object,
    specifications: Object
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
  rejectionDetails: {
    reason: String,
    description: String,
    evidence: [{
      type: {
        type: String,
        enum: ['image', 'video'],
        required: true
      },
      url: { type: String, required: true },
      public_id: { type: String, required: true },
      uploadedAt: { type: Date, default: Date.now }
    }],
    rejectedAt: Date,
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seller'
    }
  },
  dispute: {
    status: {
      type: String,
      enum: ['PENDING', 'UNDER_REVIEW', 'RESOLVED'],
      default: 'PENDING'
    },
    resolution: {
      type: String,
      enum: ['BUYER_FAVORED', 'SELLER_FAVORED', 'COMPROMISE'],
    },
    resolutionDetails: {
      decidedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
      },
      decidedAt: Date,
      action: {
        type: String,
        enum: ['FULL_REFUND', 'PARTIAL_REFUND', 'NO_REFUND', 'REPLACEMENT_APPROVED', 'RETURN_APPROVED', 'PENDING_ADMIN_REVIEW']
      },
      refundAmount: Number,
      note: String,
      evidence: [{
        type: { type: String, enum: ['image', 'document', 'video'] },
        url: String,
        public_id: String,
        uploadedAt: Date
      }]
    },
    adminNotes: [{
      note: String,
      addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
      },
      addedAt: { type: Date, default: Date.now }
    }]
  },
  returnShipment: {
    shipment_id: String,
    rate_id: String,
    status: {
      type: String,
      enum: ['PENDING', 'RATE_SELECTED', 'PICKUP_ARRANGED', 'IN_TRANSIT', 'DELIVERED'],
      default: 'PENDING'
    },
    tracking: {
      number: String,
      url: String,
      package_number: String,
      package_url: String,
      status: String,
      lastUpdate: Date,
      history: [{
        status: String,
        timestamp: Date,
        location: String,
        description: String
      }]
    },
    documents: {
      shippingLabel: String,
      commercialInvoice: String
    },
    carrier: {
      name: String,
      reference: String
    },
    fee: {
      amount: Number,
      currency: String
    },
    pickup_address: {
      first_name: String,
      last_name: String,
      email: String,
      phone: String,
      line1: String,
      line2: String,
      city: String,
      state: String,
      country: String,
      zip: String
    },
    delivery_address: {
      first_name: String,
      last_name: String,
      email: String,
      phone: String,
      line1: String,
      line2: String,
      city: String,
      state: String,
      country: String,
      zip: String
    },
    created_at: Date,
    metadata: {
      return_id: String,
      order_id: String
    },
    shipment_reference: String,
    planned_shipping_date: Date,
    pickup_details: {
      instructions: [String],
      contact: {
        email: String,
        phone: String,
        company: String,
        name: String
      }
    },
    delivery_details: {
      contact: {
        company: String,
        name: String
      },
      address: {
        postal_code: String,
        city: String,
        country_code: String,
        line1: String,
        line2: String
      }
    }
  },
  replacementShipment: {
    shipment_id: String,
    rate_id: String,
    status: {
      type: String,
      enum: ['PENDING', 'RATE_SELECTED', 'PICKUP_ARRANGED', 'IN_TRANSIT', 'DELIVERED'],
      default: 'PENDING'
    },
    tracking: {
      number: String,
      url: String,
      package_number: String,
      package_url: String,
      status: String,
      lastUpdate: Date,
      history: [{
        status: String,
        date: Date,
        location: String,
        description: String
      }]
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