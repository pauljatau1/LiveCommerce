const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  brand: { type: String },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true },
  images: [{
    url: { type: String },
    public_id: { type: String },
  }],
  stock: { type: Number, required: true },
  sku: { type: String, required: true },
  tags: [{ type: String }],
  reviews: [{
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'Buyer', required: true },
    rating: { type: Number, required: true },
    comment: { type: String },
    createdAt: { type: Date, default: Date.now },
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Product', productSchema);
