const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  sender: {
    id: { 
      type: mongoose.Schema.Types.ObjectId, 
      refPath: 'sender.model',
      required: true 
    },
    model: { 
      type: String, 
      required: true,
      enum: ['Buyer', 'Seller']
    }
  },
  recipient: {
    id: { 
      type: mongoose.Schema.Types.ObjectId, 
      refPath: 'recipient.model',
      required: true 
    },
    model: { 
      type: String, 
      required: true,
      enum: ['Buyer', 'Seller']
    }
  },
  content: String,
  messageType: {
    type: String,
    enum: ['text', 'image', 'video', 'audio', 'product'],
    required: true
  },
  media: [{
    url: String,
    public_id: String,
    fileType: String,
    fileName: String,
    fileSize: Number
  }],
  product: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    price: Number,
    image: String,
    description: String
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Message', messageSchema); 