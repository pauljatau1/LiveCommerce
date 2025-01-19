const mongoose = require('mongoose');

// Define the address schema to match Terminal Africa's format
const addressSchema = new mongoose.Schema({
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  line1: { type: String, required: true },
  line2: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true }, 
  zip: { type: String, required: true }
});

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
    default: 'pending'
  },
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    note: String
  }]
});

const orderSchema = new mongoose.Schema({
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
  channel: {
    type: String,
    enum: ['marketplace', 'liveshow', 'other'],
    default: 'marketplace'
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true
  },
  // Update field names to match Terminal Africa's API
  delivery_address: addressSchema,
  pickup_address: addressSchema,
  shipping: {
    method: String,
    carrier: {
      name: String,
      reference: String
    },
    fee: {
      amount: Number,
      currency: String
    },
    rate_id: String,
    estimatedDeliveryDate: Date,
    tracking: {
      number: String,
      url: String,
      carrier: String,
      status: {
        type: String,
        default: 'pending'
      },
      lastUpdate: Date,
      history: [{
        status: String,
        timestamp: Date,
        note: String
      }]
    },
    shipment_id: String,
    shipment_purpose: String,
    documents: {
      shippingLabel: String,
      commercialInvoice: String
    }
  },
  paid: {
    type: Boolean,
    default: false
  },
  paymentInfo: {
    method: {
      type: String,
   
      default: 'paystack'
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'paid'],
      default: 'pending'
    },
    transactionId: String,
    paidAt: Date
  },
  discount: {
    code: String,
    amount: Number
  },
  dispute: {
    status: {
      type: String,
      enum: ['none', 'opened', 'under_review', 'resolved', 'closed'],
      default: 'none'
    },
    reason: String,
    description: String,
    openedAt: Date,
    resolvedAt: Date,
    resolution: String
  },
  refund: {
    status: {
      type: String,
      enum: ['none', 'requested', 'approved', 'processed', 'rejected'],
      default: 'none'
    },
    amount: Number,
    reason: String,
    requestedAt: Date,
    processedAt: Date
  },
  notes: [{
    type: {
      type: String,
      enum: ['buyer', 'seller', 'admin']
    },
    content: String,
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware to update status history
orderSchema.pre('save', function(next) {
  const order = this;

  // Update items status history if changed
  order.items.forEach(item => {
    if (item.isModified('status')) {
      item.statusHistory.push({
        status: item.status,
        timestamp: new Date(),
      });
    }
  });

  next();
});



module.exports = mongoose.model('Order', orderSchema);
