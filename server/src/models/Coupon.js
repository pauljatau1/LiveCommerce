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
    uppercase: true,
    sparse: true,
    index: true,
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
  if (this.code === '') {
    this.code = null;
  }
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

// Create the model first
const CouponModel = mongoose.model('Coupon', couponSchema);

// Modify the cleanup function with better error handling and timeout management
const cleanupExpiredDiscounts = async () => {
  try {
    // Check if mongoose is connected first
    if (mongoose.connection.readyState !== 1) {
      console.log('Database not connected, skipping cleanup');
      return;
    }

    const now = new Date();
    
    // Add timeout option and batch processing
    const batchSize = 100;
    const expiredCoupons = await CouponModel.find({
      endDate: { $lte: now },
      status: 'active'
    })
    .limit(batchSize)
    .maxTimeMS(5000); // Set maximum execution time to 5 seconds

    let updatedCount = 0;
    for (const coupon of expiredCoupons) {
      try {
        const updated = await coupon.updateDiscountStatuses();
        if (updated) updatedCount++;
      } catch (err) {
        console.error(`Error updating coupon ${coupon._id}:`, err.message);
        continue; // Continue with next coupon even if one fails
      }
    }

    console.log(`Cleanup completed: ${updatedCount} coupons updated`);
  } catch (error) {
    console.error('Error during discount cleanup:', error.message);
  }
};

// Modify the interval setup with error handling
let cleanupInterval;
const startCleanupInterval = () => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }
  
  // Run every hour
  cleanupInterval = setInterval(() => {
    cleanupExpiredDiscounts().catch(err => {
      console.error('Cleanup interval error:', err.message);
    });
  }, 60 * 60 * 1000);
};

// Add connection handling
mongoose.connection.on('connected', () => {
  console.log('MongoDB connected, starting cleanup interval');
  startCleanupInterval();
  // Initial cleanup
  cleanupExpiredDiscounts().catch(err => {
    console.error('Initial cleanup error:', err.message);
  });
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected, stopping cleanup interval');
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }
});

module.exports = CouponModel; 