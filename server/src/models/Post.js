const mongoose = require('mongoose');

const reactionSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['like', 'dislike', 'love', 'laugh', 'sad', 'angry'],
    required: true 
  },
  user: {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    userModel: { type: String, enum: ['Buyer', 'Seller'], required: true }
  },
  createdAt: { type: Date, default: Date.now }
});

const commentSchema = new mongoose.Schema({
  content: { type: String, required: true },
  author: {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    userModel: { type: String, enum: ['Buyer', 'Seller'], required: true }
  },
  likes: [{ 
    user: { type: mongoose.Schema.Types.ObjectId },
    userModel: { type: String, enum: ['Buyer', 'Seller'] }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date }
});

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  category: { type: String, required: true },
  tags: [{ type: String }],
  visibility: { 
    type: String, 
    enum: ['public', 'private', 'followers'],
    default: 'public'
  },
  images: [{
    url: { type: String },
    public_id: { type: String }
  }],
  author: {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    userModel: { type: String, enum: ['Buyer', 'Seller'], required: true }
  },
  reactions: [reactionSchema],
  comments: [commentSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date }
});

module.exports = mongoose.model('Post', postSchema); 