const mongoose = require('mongoose');

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
  chatInteractions: [{
    id: String,
    type: String, 
    user: String,
    avatar: String,
    content: String,
    data: mongoose.Schema.Types.Mixed,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Stream', streamSchema); 