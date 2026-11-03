const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  name: {
    type: String,
    required: true,
    trim: true
  },

  quantity: {
    type: String,
    required: true
  },

  color: {
    type: String,
    required: true,
    trim: true
  },

  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },

  created_at: {
    type: Date,
    default: Date.now
  },

  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Automatically update `updated_at` before save
listingSchema.pre('save', function (next) {
  this.updated_at = new Date();
  next();
});

const Listing = mongoose.model('Listing', listingSchema);

module.exports = Listing;