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
});

module.exports = mongoose.model('Order', orderSchema);
