const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  media: {
    type: { type: String, enum: ['file', 'image', 'video'] },
    url: String,
    public_id: String
  },
  banner: {
    url: { type: String, required: true },
    public_id: { type: String, required: true }
  },
  link: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

resourceSchema.pre('save', function(next) {
  if (!this.media?.url && !this.link) {
    next(new Error('Either media or link must be provided'));
  }
  next();
});

module.exports = mongoose.model('Resource', resourceSchema); 