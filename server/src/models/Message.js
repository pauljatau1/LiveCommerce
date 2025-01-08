const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  sender: {
    id: { type: mongoose.Schema.Types.ObjectId, required: true },
    model: { type: String, enum: ['Buyer', 'Seller'], required: true }
  },
  recipient: {
    id: { type: mongoose.Schema.Types.ObjectId, required: true },
    model: { type: String, enum: ['Buyer', 'Seller'], required: true }
  },
  content: { type: String },
  messageType: {
    type: String,
    enum: ['text', 'image', 'video', 'file', 'product'],
    default: 'text'
  },
  media: [{
    url: String,
    public_id: String,
    fileType: String,
    fileName: String,
    fileSize: Number
  }],
  attachedProduct: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  isRead: { type: Boolean, default: false },
  isDelivered: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema); 