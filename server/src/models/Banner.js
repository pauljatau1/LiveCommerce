const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: { type: String },
  description: { type: String },
  mainImage: {
    url: { type: String, required: true },
    public_id: { type: String, required: true }
  },
  category: { type: String },
  callToActionLink: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Banner', bannerSchema);
