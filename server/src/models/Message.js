const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, refPath: 'senderModel' },
  recipient: { type: mongoose.Schema.Types.ObjectId, refPath: 'recipientModel' },
  senderModel: { type: String, required: true, enum: ['Buyer', 'Seller'] },
  recipientModel: { type: String, required: true, enum: ['Buyer', 'Seller'] },
  content: { type: String },
  messageType: { type: String, required: true, enum: ['text', 'image', 'video', 'file'], default: 'text' },
  media: [{
    url: { type: String },
    public_id: { type: String },
    fileType: { type: String },
    fileName: { type: String },
    fileSize: { type: Number }
  }],
  conversationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Conversation',
    required: true 
  },
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
  deliveredAt: { type: Date },
  readAt: { type: Date }
});

module.exports = mongoose.model('Message', messageSchema);
