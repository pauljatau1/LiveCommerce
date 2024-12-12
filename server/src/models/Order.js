const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
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
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true
  },
  shippingAddress: {
    country: { type: String, required: true },
    city: { type: String, required: true },
    address1: { type: String, required: true },
    address2: String,
    zipCode: { type: String, required: true }
  },
  paymentInfo: {
    method: { 
      type: String, 
      required: true,
      enum: ['credit_card', 'paypal', 'stripe']
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    transactionId: String,
    paidAt: Date
  },
  discount: {
    code: String,
    amount: Number
  },
  shipping: {
    method: { 
      type: String, 
      enum: ['standard', 'express', 'economy'],
      required: true 
    },
    fee: { 
      type: Number, 
      required: true 
    },
    estimatedDeliveryDate: Date,
    tracking: {
      number: String,
      carrier: String,
      status: {
        type: String,
        enum: ['pending', 'picked_up', 'in_transit', 'delivered', 'failed'],
        default: 'pending'
      },
      lastUpdate: Date,
      history: [{
        status: String,
        location: String,
        timestamp: Date
      }]
    }
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

// Method to calculate total amount
orderSchema.methods.calculateTotal = function() {
  let total = 0;
  this.items.forEach(item => {
    total += item.price * item.quantity;
  });
  
  // Add shipping cost if exists
  if (this.shipping && this.shipping.cost) {
    total += this.shipping.cost;
  }
  
  // Subtract discount if exists
  if (this.discount && this.discount.amount) {
    total -= this.discount.amount;
  }
  
  return total;
};

module.exports = mongoose.model('Order', orderSchema);
