const mongoose = require('mongoose');

const flashSaleProductSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  originalPrice: {
    type: Number,
    required: true
  },
  discountedPrice: {
    type: Number,
    required: true
  },
  allocatedStock: {
    type: Number,
    required: true
  },
  soldStock: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'soldout', 'expired', 'upcoming'],
    default: 'upcoming'
  }
});

const flashSaleSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  discountType: {
    type: String,
    enum: ['percentage', 'amount'],
    required: true
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  startDate: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endDate: {
    type: Date
  },
  endTime: {
    type: String
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'active', 'completed', 'cancelled'],
    default: 'draft'
  },
  products: [flashSaleProductSchema],
  totalAllocatedStock: {
    type: Number,
    default: 0
  },
  totalSoldStock: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware to update timestamps and calculate totals
flashSaleSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Calculate totals
  this.totalAllocatedStock = this.products.reduce((sum, product) => sum + product.allocatedStock, 0);
  this.totalSoldStock = this.products.reduce((sum, product) => sum + product.soldStock, 0);
  
  next();
});

// Method to check if flash sale is currently active
flashSaleSchema.methods.isActive = function() {
  const now = new Date();
  const startDateTime = new Date(`${this.startDate.toDateString()} ${this.startTime}`);
  const endDateTime = this.endDate ? new Date(`${this.endDate.toDateString()} ${this.endTime}`) : null;

  return (
    this.status === 'active' &&
    now >= startDateTime &&
    (!endDateTime || now <= endDateTime)
  );
};

// Method to calculate discounted price
flashSaleSchema.methods.calculateDiscountedPrice = function(originalPrice) {
  if (this.discountType === 'percentage') {
    return originalPrice - (originalPrice * (this.discountValue / 100));
  } else {
    return originalPrice - this.discountValue;
  }
};

// Method to update product statuses
flashSaleSchema.methods.updateProductStatuses = async function() {
  const now = new Date();
  const startDateTime = new Date(`${this.startDate.toDateString()} ${this.startTime}`);
  const endDateTime = this.endDate ? new Date(`${this.endDate.toDateString()} ${this.endTime}`) : null;

  if (now < startDateTime) {
    this.status = 'scheduled';
  } else if (now >= startDateTime && (!endDateTime || now <= endDateTime)) {
    this.status = 'active';
  } else if (endDateTime && now > endDateTime) {
    this.status = 'completed';
  }

  // Update individual product statuses
  this.products.forEach(product => {
    if (product.soldStock >= product.allocatedStock) {
      product.status = 'soldout';
    } else if (this.status === 'active') {
      product.status = 'active';
    } else if (this.status === 'completed') {
      product.status = 'expired';
    }
  });

  await this.save();
};

module.exports = mongoose.model('FlashSale', flashSaleSchema); 