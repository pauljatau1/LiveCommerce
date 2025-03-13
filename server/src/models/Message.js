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
    enum: ['text', 'image', 'video', 'audio', 'product', 'order'],
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
  order: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    items: [{
      name: String,
      quantity: Number,
      price: Number,
      image: String
    }],
    shippingFee: Number,
    totalAmount: Number,
    tracking: {
      number: String,
      url: String,
      carrier: String,
      status: String
    },
    delivery_address: {
      first_name: String,
      last_name: String,
      email: String,
      phone: String,
      line1: String,
      line2: String,
      city: String,
      state: String,
      country: String,
      zip: String
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending'
    }
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