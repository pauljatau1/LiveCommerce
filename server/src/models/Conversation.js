const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    userModel: { type: String, required: true, enum: ['Buyer', 'Seller'] },
    lastSeen: { type: Date, default: Date.now }
  }],
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  unreadCounts: [{
    userId: { type: mongoose.Schema.Types.ObjectId },
    count: { type: Number, default: 0 }
  }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Conversation', conversationSchema);
