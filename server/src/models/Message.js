const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, refPath: 'senderModel' },
  recipient: { type: mongoose.Schema.Types.ObjectId, refPath: 'recipientModel' },
  senderModel: { type: String, required: true, enum: ['Buyer', 'Seller'] },
  recipientModel: { type: String, required: true, enum: ['Buyer', 'Seller'] },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
});

module.exports = mongoose.model('Message', messageSchema);
