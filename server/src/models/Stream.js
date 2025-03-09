const mongoose = require('mongoose');

// Define a separate schema for chat interactions
const chatInteractionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, required: true },
  user: { type: String, required: true },
  avatar: { type: String },
  content: { type: String, required: true },
  data: { 
    type: mongoose.Schema.Types.Mixed,
    required: true 
  },
  timestamp: { 
    type: Date,
    default: Date.now 
  }
});

const streamSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  coverImage: {
    url: String,
    public_id: String
  },
  category: {
    type: String,
    required: true
  },
  tags: [String],
  products: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    minBid: {
      type: Number,
      required: function() {
        return this.parent().type === 'auction';
      }
    },
    maxBid: {
      type: Number,
      required: function() {
        return this.parent().type === 'auction';
      }
    },
    currentBid: {
      type: Number,
      default: 0
    },
    currentBidder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Buyer'
    }
  }],
  status: {
    type: String,
    enum: ['scheduled', 'live', 'ended', 'expired'],
    default: 'scheduled'
  },
  channelName: String,
  agoraToken: String,
  scheduledStartTime: Date,
  actualStartTime: Date,
  endTime: Date,
  viewers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Buyer'
  }],
  bids: [{
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Buyer'
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    amount: Number,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  type: {
    type: String,
    enum: ['auction', 'open_show'],
    default: 'auction'
  },
  cancelledStream: {
    type: Boolean,
    default: false
  },
  agoraUid: {
    type: Number,
    default: 0
  },
  chatInteractions: [chatInteractionSchema]
}, { timestamps: true });

module.exports = mongoose.model('Stream', streamSchema); 