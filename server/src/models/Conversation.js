const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{
    id: { 
      type: mongoose.Schema.Types.ObjectId, 
      refPath: 'participants.model',
      required: true 
    },
    model: { 
      type: String, 
      required: true,
      enum: ['Buyer', 'Seller']
    },
    lastActive: {
      type: Date,
      default: null
    },
    isOnline: {
      type: Boolean,
      default: false
    },
    settings: {
      isBlocked: {
        type: Boolean,
        default: false
      },
      isMuted: {
        type: Boolean,
        default: false
      },
      blockedBy: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
      },
      mutedBy: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
      }
    }
  }],
  lastMessage: {
    content: String,
    sender: {
      id: { type: mongoose.Schema.Types.ObjectId },
      model: { type: String, enum: ['Buyer', 'Seller'] }
    },
    messageType: { 
      type: String, 
      enum: ['text', 'image', 'video', 'audio', 'product', 'order', 'campaign']
    },
    createdAt: { type: Date }
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: new Map()
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Conversation', conversationSchema); 