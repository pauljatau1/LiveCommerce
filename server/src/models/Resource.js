const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  resourceType: { type: String, enum: ['youtube', 'file'], required: true },
  category: { type: String, enum: ['auqli_university', 'other'], required: true },
  media: {
    type: { type: String, enum: ['file', 'image', 'video'] },
    url: String,
    public_id: String
  },
  banner: {
    url: { type: String },
    public_id: { type: String }
  },
  link: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

resourceSchema.pre('save', function(next) {
  // For YouTube resources, link is required. For file resources, media is required.
  if (this.resourceType === 'youtube' && !this.link) {
    return next(new Error('Link is required for YouTube resources'));
  }
  
  if (this.resourceType === 'file' && !this.media?.url) {
    return next(new Error('Media file is required for file resources'));
  }
  
  // For file resources, banner is required
  if (this.resourceType === 'file' && (!this.banner?.url || !this.banner?.public_id)) {
    return next(new Error('Banner image is required for file resources'));
  }
  
  next();
});

module.exports = mongoose.model('Resource', resourceSchema); 