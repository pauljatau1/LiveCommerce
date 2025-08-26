const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name: String,
  price: Number,
  stock: Number,
  status: String,
  category: String,
  subCategory: String,
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller'
  },
  discount: {
    isActive: Boolean,
    type: String,
    value: Number,
    discountedPrice: Number
  },
  auction: Object,
  images: [{
    url: String
  }],
  blips: [{
    _id: mongoose.Schema.Types.ObjectId,
    url: String,
    thumbnail: String,
    processed: Boolean,
    likesCount: Number,
    commentsCount: Number,
    viewCount: Number,
    likes: [mongoose.Schema.Types.ObjectId],
    createdAt: Date
  }],
  reviews: [{
    rating: Number
  }],
  createdAt: Date
});

module.exports = mongoose.model('Product', productSchema);
