const mongoose = require('mongoose');

// Create schema for sub-subcategories
const subSubCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
});

// Modify subCategory schema to include sub-subcategories
const subCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  subSubCategories: [subSubCategorySchema],
});

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  image: {
    url: { type: String },
    public_id: { type: String },
  },
  platformFee: { type: Number, default: 0 },
  subCategories: [subCategorySchema],
  statistics: {
    orders: {
      pending: { type: Number, default: 0 },
      completed: { type: Number, default: 0 }
    },
    items: {
      pending: { type: Number, default: 0 },
      sold: { type: Number, default: 0 }
    },
    totalProducts: { type: Number, default: 0 },
    streams: {
      active: { type: Number, default: 0 },
      scheduled: { type: Number, default: 0 },
      ended: { type: Number, default: 0 }
    }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

categorySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Category', categorySchema);
