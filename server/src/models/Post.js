const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  creatorId: { type: mongoose.Schema.Types.ObjectId, required: true },
  creatorType: { type: String, enum: ['Buyer', 'Seller'], required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const postSchema = new mongoose.Schema({
  creatorId: { type: mongoose.Schema.Types.ObjectId, required: true },
  creatorType: { type: String, enum: ['Buyer', 'Seller'], required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  media: [{
    url: { type: String, required: true },
    public_id: { type: String, required: true }
  }],
  likes: [{ type: mongoose.Schema.Types.ObjectId }],
  comments: [commentSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', postSchema);
