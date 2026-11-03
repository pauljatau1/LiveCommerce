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
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'percentage'
  },
  discountPercentage: {
    type: Number,
    min: 0,
    max: 100
  },
  fixedAmount: {
    type: Number,
    default: 0,
    min: 0
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

// Validate discount fields based on discountType
couponSchema.pre('validate', function(next) {
  if (this.discountType === 'percentage') {
    if (typeof this.discountPercentage !== 'number' || this.discountPercentage <= 0) {
      return next(new Error('discountPercentage must be provided and greater than 0 for percentage coupons'));
    }
    this.fixedAmount = 0;
  } else if (this.discountType === 'fixed') {
    if (typeof this.fixedAmount !== 'number' || this.fixedAmount <= 0) {
      return next(new Error('fixedAmount must be provided and greater than 0 for fixed coupons'));
    }
    this.discountPercentage = undefined;
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

// NOTE:
// Avoid using a global pre('find') filter here. It can produce surprising
// side-effects (e.g., hiding coupons in admin screens or interfering with
// internal cleanup queries that intentionally need expired coupons).
// Instead, each controller/query should explicitly specify the desired filter
// (active/expired/all) at call sites.

// Add method to get current valid discounted price
couponSchema.methods.getCurrentDiscountedPrice = function(productId) {
  const productDiscount = this.applicableProducts.find(
    p => p.product.toString() === productId.toString() && p.status === 'active'
  );
  return productDiscount ? productDiscount.discountedPrice : null;
};

// Create the model first
const CouponModel = mongoose.model('Coupon', couponSchema);

/**
 * Cleans up expired coupons and deactivates their associated product discounts
 * This function runs periodically to ensure expired coupons don't show active discounts
 * on products, maintaining data consistency across the system.
 */
const cleanupExpiredDiscounts = async () => {
  try {
    // Check if mongoose is connected first
    if (mongoose.connection.readyState !== 1) {
      console.log('Database not connected, skipping cleanup');
      return;
    }

    const now = new Date();
    
    // Add timeout option and batch processing to prevent long-running queries
    const batchSize = 100;
    const expiredCoupons = await CouponModel.find({
      endDate: { $lte: now },
      status: 'active'
    })
    .limit(batchSize)
    .maxTimeMS(5000); // Set maximum execution time to 5 seconds

    let updatedCount = 0;
    const Product = mongoose.model('Product');
    
    for (const coupon of expiredCoupons) {
      try {
        // Update coupon status and applicableProducts status
        const updated = await coupon.updateDiscountStatuses();
        
        // Get all product IDs from the coupon's applicable products
        const productIds = coupon.applicableProducts.map(ap => ap.product);
        
        // Update all products to deactivate the discount
        // This ensures that expired coupons don't show active discounts on products
        if (productIds.length > 0) {
          await Product.updateMany(
            {
              _id: { $in: productIds },
              'discount.couponName': coupon.name
            },
            {
              $set: {
                'discount.isActive': false,
                'pricing.discountInfo.isActive': false,
                'variants.$[].discount.isActive': false
              }
            }
          );
          
          console.log(`Deactivated discounts for ${productIds.length} products from expired coupon: ${coupon.name}`);
        }
        
        if (updated) updatedCount++;
      } catch (err) {
        console.error(`Error updating coupon ${coupon._id}:`, err.message);
        continue; // Continue with next coupon even if one fails
      }
    }

    if (updatedCount > 0) {
      console.log(`Cleanup completed: ${updatedCount} coupons expired and product discounts deactivated`);
    }
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