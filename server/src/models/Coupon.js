const mongoose = require('mongoose');

const productDiscountSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  discountedPrice: {
    type: Number,
    required: true
  },
  originalPrice: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled'],
    default: 'active'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

const couponSchema = new mongoose.Schema({
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
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  discountPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  hasMinimumRequirement: {
    type: Boolean,
    default: false
  },
  minimumAmount: {
    type: Number,
    default: 0
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  customerEligibility: {
    type: String,
    enum: ['all', 'followers', 'new'],
    default: 'all'
  },
  applicableProducts: [{
    type: productDiscountSchema,
    required: true
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'expired'],
    default: 'active'
  },
  usageLimit: {
    type: Number,
    default: null
  },
  usageCount: {
    type: Number,
    default: 0
  },
  productUsage: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    usageCount: {
      type: Number,
      default: 0
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamps on save
couponSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Add method to check if coupon is valid
couponSchema.methods.isValid = function() {
  const now = new Date();
  return (
    this.status === 'active' &&
    now >= this.startDate &&
    (!this.endDate || now <= this.endDate) &&
    (!this.usageLimit || this.usageCount < this.usageLimit)
  );
};

// Add method to calculate discounted price for a product
couponSchema.methods.getDiscountedPrice = function(productId) {
  const productDiscount = this.applicableProducts.find(
    p => p.product.toString() === productId.toString()
  );
  return productDiscount ? productDiscount.discountedPrice : null;
};

// Add method to check and update discount statuses
couponSchema.methods.updateDiscountStatuses = async function() {
  const now = new Date();
  let hasChanges = false;

  // Check if coupon has expired
  if (this.endDate && now > this.endDate) {
    this.status = 'expired';
    
    // Update all product discounts to expired
    this.applicableProducts.forEach(product => {
      if (product.status === 'active') {
        product.status = 'expired';
        product.lastUpdated = now;
        hasChanges = true;
      }
    });

    if (hasChanges) {
      await this.save();
    }
  }
  
  return hasChanges;
};

// Add pre-find middleware to check expiration before queries
couponSchema.pre('find', async function() {
  // Add condition to only return active discounts when querying
  this.where({
    $or: [
      { endDate: { $gt: new Date() } },
      { endDate: null }
    ],
    status: 'active'
  });
});

// Add method to get current valid discounted price
couponSchema.methods.getCurrentDiscountedPrice = function(productId) {
  const productDiscount = this.applicableProducts.find(
    p => p.product.toString() === productId.toString() && p.status === 'active'
  );
  return productDiscount ? productDiscount.discountedPrice : null;
};

// Schedule periodic cleanup of expired discounts
const cleanupExpiredDiscounts = async () => {
  try {
    const now = new Date();
    const expiredCoupons = await mongoose.model('Coupon').find({
      endDate: { $lte: now },
      status: 'active'
    });

    for (const coupon of expiredCoupons) {
      await coupon.updateDiscountStatuses();
    }
  } catch (error) {
    console.error('Error cleaning up expired discounts:', error);
  }
};

// Run cleanup every hour
setInterval(cleanupExpiredDiscounts, 60 * 60 * 1000);

// Run cleanup on model initialization
cleanupExpiredDiscounts();

module.exports = mongoose.model('Coupon', couponSchema); 