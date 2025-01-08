const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{
    id: { type: mongoose.Schema.Types.ObjectId, required: true },
    model: { type: String, enum: ['Buyer', 'Seller'], required: true }
  }],
  lastMessage: {
    content: String,
    sender: {
      id: { type: mongoose.Schema.Types.ObjectId },
      model: { type: String, enum: ['Buyer', 'Seller'] }
    },
    messageType: {
      type: String,
      enum: ['text', 'image', 'video', 'file', 'product']
    },
    createdAt: { type: Date }
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: new Map()
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

conversationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Conversation', conversationSchema); 