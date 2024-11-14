const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    userModel: { type: String, required: true, enum: ['Buyer', 'Seller'] },
  }],
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  unreadMessageCount: { type: Number, default: 0 },
});

module.exports = mongoose.model('Conversation', conversationSchema);
