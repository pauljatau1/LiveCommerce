const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Buyer', required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const postSchema = new mongoose.Schema({
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Buyer', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  media: [{
    url: { type: String, required: true },
    public_id: { type: String, required: true }
  }],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Buyer' }],
  comments: [commentSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', postSchema);
