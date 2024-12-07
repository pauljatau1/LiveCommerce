const mongoose = require('mongoose');

const discountSchema = new mongoose.Schema({
  code: { 
    type: String, 
    required: true, 
    unique: true,
    uppercase: true 
  },
  type: { 
    type: String, 
    required: true,
    enum: ['percentage', 'fixed_amount']
  },
  value: { 
    type: Number, 
    required: true 
  },
  minPurchaseAmount: { 
    type: Number,
    default: 0 
  },
  maxDiscountAmount: { 
    type: Number 
  },
  startDate: { 
    type: Date,
    default: Date.now 
  },
  endDate: { 
    type: Date 
  },
  usageLimit: { 
    type: Number 
  },
  usageCount: { 
    type: Number,
    default: 0 
  },
  isActive: { 
    type: Boolean,
    default: true 
  },
  applicableProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  applicableCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  excludedProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  createdAt: { 
    type: Date,
    default: Date.now 
  }
});

// Method to check if discount is valid
discountSchema.methods.isValid = function() {
  const now = new Date();
  return (
    this.isActive &&
    (!this.endDate || this.endDate > now) &&
    this.startDate <= now &&
    (!this.usageLimit || this.usageCount < this.usageLimit)
  );
};

// Method to calculate discount amount
discountSchema.methods.calculateDiscount = function(subtotal) {
  if (!this.isValid()) return 0;
  
  if (subtotal < this.minPurchaseAmount) return 0;
  
  let discountAmount;
  if (this.type === 'percentage') {
    discountAmount = subtotal * (this.value / 100);
  } else {
    discountAmount = this.value;
  }
  
  if (this.maxDiscountAmount) {
    discountAmount = Math.min(discountAmount, this.maxDiscountAmount);
  }
  
  return Math.min(discountAmount, subtotal);
};

module.exports = mongoose.model('Discount', discountSchema);
