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
    // enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned', 'shipment_in_transit'],
    default: 'pending'
  },
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    note: String
  }],
  specifications: {
    color: String,
    size: String,
    material: String,
    // Add any other specification fields you need
  },
});

const orderSchema = new mongoose.Schema({
  order_id: {
    type: String,
    unique: true,
    required: true,
    default: function() {
      // Generate a random 5-character alphanumeric string
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = 'OR';
      for (let i = 0; i < 5; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    }
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
  channel: {
    type: String,
    // enum: ['marketplace', 'liveshow', 'other'],
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
    estimatedDeliveryDate: {
      type: String,
    },
    estimatedPickupDate: {
      type: String,
      
    },
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
        location: String,
        description: String
      }]
    },
    shipment_id: String,
    shipment_purpose: String,
    documents: {
      shippingLabel: String,
      commercialInvoice: String
    },
    delivery: {
      estimatedDate: Date,
      actualDate: Date
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
      // enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'paid', 'shipment_in_transit'],
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
      // enum: ['none', 'opened', 'under_review', 'resolved', 'closed'],
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
      // enum: ['none', 'requested', 'approved', 'processed', 'rejected'],
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
  },
  isOpen: {
    type: Boolean,
    default: true
  },
  closedAt: Date,
  closedBy: {
    type: String,
    enum: ['admin', 'buyer', 'auto'],
  },
  closedReason: String,
});

// Add a pre-save middleware to ensure uniqueness of orderId
orderSchema.pre('save', async function(next) {
  if (this.isNew) {
    const Order = this.constructor;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      // Generate a new orderId
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let newOrderId = 'OR';
      for (let i = 0; i < 5; i++) {
        newOrderId += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // Check if this orderId already exists
      const existingOrder = await Order.findOne({ order_id: newOrderId });
      if (!existingOrder) {
        this.order_id = newOrderId;
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      next(new Error('Could not generate unique orderId after maximum attempts'));
      return;
    }
  }

  // Continue with the existing pre-save middleware for status history
  const order = this;
  order.items.forEach(item => {
    if (item.isModified('status')) {
      item.statusHistory.push({
        status: item.status,
        timestamp: new Date(),
      });
    }
  });

  // Check if order should be auto-closed
  if (this.isOpen && 
      this.items.every(item => item.status === 'delivered') && 
      this.items[0].statusHistory.find(h => h.status === 'delivered')) {
    
    const deliveredDate = this.items[0].statusHistory.find(h => h.status === 'delivered').timestamp;
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

    if (deliveredDate <= twoDaysAgo) {
      this.isOpen = false;
      this.closedAt = new Date();
      this.closedBy = 'auto';
      this.closedReason = 'Auto-closed after 2 days of delivery with no action';
    }
  }

  next();
});

module.exports = mongoose.model('Order', orderSchema);
