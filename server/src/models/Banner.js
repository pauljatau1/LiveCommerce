const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  mainImage: {
    url: { type: String, required: true },
    public_id: { type: String, required: true },
  },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  callToActionLink: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Banner', bannerSchema);
