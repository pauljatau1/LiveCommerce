const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  cart: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
  }],
  shippingAddress: {
    country: { type: String, required: true },
    city: { type: String, required: true },
    address1: { type: String, required: true },
    address2: { type: String },
    zipCode: { type: String, required: true },
    addressType: { type: String, required: true },
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Buyer',
    required: true,
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
    required: true,
  },
  parentOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    default: 'Pending',
  },
  paymentInfo: {
    id: {
      type: String,
    },
    status: {
      type: String,
    },
    type: {
      type: String,
    },
  },
  paidAt: {
    type: Date,
  },
  deliveredAt: {
    type: Date,
  },
  tracking: {
    status: {
      type: String,
      enum: [
        'pending',
        'payment_processing',
        'paid',
        'preparing',
        'shipped',
        'out_for_delivery',
        'delivered',
        'cancelled',
        'refunded'
      ],
      default: 'pending'
    },
    statusHistory: [{
      status: { type: String },
      timestamp: { type: Date, default: Date.now },
      note: { type: String },
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }],
    estimatedDelivery: { type: Date },
    trackingNumber: { type: String },
    carrier: { type: String },
  },
  billing: {
    subtotal: { type: Number, required: true },
    shipping: { type: Number, required: true },
    tax: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
  },
  notes: {
    customerNote: { type: String },
    privateNote: { type: String },
    giftNote: { type: String },
  },
  refund: {
    status: { type: String, enum: ['none', 'requested', 'approved', 'processed'] },
    amount: { type: Number },
    reason: { type: String },
    requestDate: { type: Date },
    processedDate: { type: Date },
  }
});

orderSchema.pre('save', function(next) {
  if (this.isModified('tracking.status')) {
    this.tracking.statusHistory.push({
      status: this.tracking.status,
      timestamp: Date.now(),
    });
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
