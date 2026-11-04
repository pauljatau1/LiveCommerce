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

// Define a separate schema for stream likes
const streamLikeSchema = new mongoose.Schema({
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
  video: {
    url: String,
    key: String
  },
  category: {
    type: String,
    required: true
  },
  subCategory: {
    type: String
  },
  tags: [String],
  products: [{
    product: {
      type: mongoose.Schema.Types.Mixed
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
      type: mongoose.Schema.Types.Mixed,
      ref: 'Buyer'
    },
    bidStatus: {
      type: String,
      enum: ['pending', 'active', 'ongoing', 'ended'],
      default: 'pending'
    },
    bidWinner: {
      buyer: {
        type: mongoose.Schema.Types.Mixed,
        ref: 'Buyer'
      },
      bidAmount: Number,
      winningTime: {
        type: Date
      }
    },
    orderCreated: {
      type: Boolean,
      default: false
    },
    orderId: {
      type: String
    },
    isVisible: {
      type: Boolean,
      default: false
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
  departedViewers: [{
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Buyer'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    notificationData: {
      type: mongoose.Schema.Types.Mixed
    }
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
  autoUpload: {
    type: Boolean,
    default: false
  },
  cancelledStream: {
    type: Boolean,
    default: false
  },
  agoraUid: {
    type: Number,
    default: 0
  },
  // Agora cloud recording of the show, used to cut clips (see services/recordingService.js)
  recording: {
    status: { type: String, enum: ['recording', 'stopped', 'failed'] },
    resourceId: String,
    sid: String,
    uid: String,
    startedAt: Date,
    stoppedAt: Date,
    error: String,
    files: [{
      _id: false,
      fileName: String,
      trackType: String,
      sliceStartTime: Number
    }]
  },
  subscribers: [{
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Buyer'
    },
    subscribedAt: {
      type: Date,
      default: Date.now
    },
    notified: {
      type: Boolean,
      default: false
    }
  }],
  chatInteractions: [chatInteractionSchema],
  likes: [streamLikeSchema],
  liveAnnouncements: [{
    id: { type: String, required: true },
    content: { type: String, required: true },
    current: { type: Boolean, default: false },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true },
    sellerName: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  orders: [{
    orderId: {
      type: String,
      required: true
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Buyer',
      required: true
    },
    orderDetails: {
      type: mongoose.Schema.Types.Mixed
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    amount: {
      type: Number,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  streamLink:{
    type:String
  },
  processingEndJob: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Stream', streamSchema); 