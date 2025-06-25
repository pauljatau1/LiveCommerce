const mongoose = require('mongoose');
const bcrypt = require('bcrypt');


const subCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
});

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  subCategories: [subCategorySchema],
});

const reviewSchema = new mongoose.Schema({
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Buyer',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date
  },
  isVerifiedPurchase: {
    type: Boolean,
    default: false
  },
  reply: {
    content: { type: String },
    createdAt: { type: Date },
    updatedAt: { type: Date }
  }
});

const sellerSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  businessName: { type: String },
  businessType: { type: String },
  taxInformation: { type: String },
  businessEmail: { type: String },
  businessNumber: { type: String },
  accountPending: { type: Boolean, default: false },
  businessAddress: {
    country: { type: String },
    state: { type: String },
    city: { type: String },
    addressLine1: { type: String },
    addressLine2: { type: String },
    zipCode: { type: String },
  },
  accountType: { type: String, enum: ['individual', 'business'] },
  isVerified: { type: Boolean, default: false },
  isInternational: { type: Boolean, default: false },
  verificationDocuments: {
    type: { type: String, enum: ['company', 'individual'] },
    documents: [{
      documentType: {
        type: String,
        enum: ['certificateOfIncorporation', 'businessTaxId', 'individualTaxId', 'governmentId', 'proofOfAddress']
      },
      fileUrl: { type: String },
      public_id: { type: String },
      uploadedAt: { type: Date, default: Date.now }
    }]
  },
  smileIdVerification: {
    type: { type: String, enum: ['individual', 'business'] },
    provider: { type: String, default: 'SmileID' },
    result: { type: mongoose.Schema.Types.Mixed },
    verifiedAt: { type: Date },
    status: { type: String, enum: ['verified', 'failed', 'pending'], default: 'pending' }
  },
  bankDetails: {
    bankCountry: { type: String },
    bankName: { type: String },
    bankAccountType: { type: String },
    accountCurrency: { type: String },
    accountNumber: { type: String },
    accountName: { type: String },
    swiftCode: { type: String },
    bankIdentifierCode: { type: String },
  },
  cancelledStreamCount: { type: Number, default: 0 },
  lastStreamCancellation: {type: Date, default: null},
  categories: [categorySchema],
  shippingOptions: {
    shippingMethod: { type: String },
    returnsAndExchangePolicy: { type: String },
  },
  warehouseDetails: {
    name: { type: String },
    contactNumber: { type: String },
    address: {
      country: { type: String },
      state: { type: String },
      city: { type: String },
      addressLine1: { type: String },
      addressLine2: { type: String },
      zipCode: { type: String },
    }
  },
  storeName: { type: String },
  aboutStore: { type: String },
  storeAvatar: {
    url: { type: String },
    public_id: { type: String },
  },
  storeBanner: {
    url: { type: String },
    public_id: { type: String },
  },
  socialMedia: {
    instagram: { type: String },
    facebook: { type: String },
    tiktok: { type: String }
  },
  createdAt: { type: Date, default: Date.now },
  emailVerified: { type: Boolean, default: false },
  otp: { type: String },
  isFeatured: { type: Boolean, default: false },
  isDisabled: { type: Boolean, default: false },
  walletBalance: { type: Number, default: 0 },
  // Add fields for message notifications
  messageNotifications: {
    lastSentAt: { type: Date, default: null },
    pendingCount: { type: Number, default: 0 },
    conversationsWithNewMessages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' }]
  },

  activityFeed: [{
    type: { type: String, enum: ['post', 'product_added', 'product_updated', 'follow', 'promotion'] },
    content: { type: String },
    reference: { type: mongoose.Schema.Types.ObjectId, refPath: 'activityFeed.referenceModel' },
    referenceModel: { type: String, enum: ['Post', 'Product', 'Buyer', 'Seller', 'Promotion'] },
    createdAt: { type: Date, default: Date.now }
  }],

  messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
  conversations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' }],
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
  storeVisits: { type: Number, default: 0 },
  customers: [{
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Buyer' },
    firstName: { type: String },
    lastName: { type: String },
    firstPurchaseDate: { type: Date },
    totalOrders: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 }
  }],
  sellerAddress: {
    country: { type: String },
    state: { type: String },
    city: { type: String },
    addressLine1: { type: String },
    addressLine2: { type: String },
    zipCode: { type: String },
  },
  isNewSeller: { type: Boolean, default: true },
  hasFilledAddress: { type: Boolean, default: false },
  hasFilledWarehouseAddress: { type: Boolean, default: false },
  hasFilledBankDetails: { type: Boolean, default: false },
  hasFilledCategoryDetails: { type: Boolean, default: false },
  hasFilledVerificationDocuments: { type: Boolean, default: false },
  hasFilledBusinessAddress: { type: Boolean, default: false },
  onboardingProcess: {
    type: String,

    default: ''
  },
  followers: [{
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Buyer' },
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String },
    followDate: { type: Date, default: Date.now },
    totalOrders: { type: Number, default: 0 },
    lastInteraction: { type: Date }, 
    optedOut: { type: Boolean, default: false },
    mainAddress: {
      country: String,
      city: String,
      address1: String,
      address2: String,
      zipCode: String
    }
  }],
  passwordResetToken: String,
  passwordResetExpires: Date,
  notificationPreferences: {
    emailNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    notificationTypes: {
      orderUpdates: { type: Boolean, default: true },
      lowStock: { type: Boolean, default: true },
      newReviews: { type: Boolean, default: true },
      promotions: { type: Boolean, default: true },
      campaignMetrics: { type: Boolean, default: true }
    }
  },
  reviews: [reviewSchema],
  stats: {
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    ratingDistribution: {
      1: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      5: { type: Number, default: 0 }
    }
  },
  campaigns: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' }],
  campaignStats: {
    totalCampaigns: { type: Number, default: 0 },
    totalRecipients: { type: Number, default: 0 },
    totalOpens: { type: Number, default: 0 },
    totalClicks: { type: Number, default: 0 },
    dailyCampaignCount: { type: Number, default: 0 },
    lastCampaignDate: Date
  },
  agoraUid: {
    type: Number,
    unique: true,
    default: function() {
      // Generate random 32-bit unsigned integer (0-4294967295)
      const min = 100000; // Start from 100,000 to avoid low-number conflicts
      const max = 4294967295;
      return Math.floor(min + Math.random() * (max - min));
    }
  },
  resetPasswordCode: String,
  resetPasswordExpires: Date,
  monthlyStats: {
    storeVisits: {
      type: Map,
      of: Number,
      default: new Map()
    },
    orders: {
      type: Map,
      of: Number,
      default: new Map()
    },
    customers: {
      type: Map,
      of: Number,
      default: new Map()
    },
    walletTransactions: {
      type: Map,
      of: Number,
      default: new Map()
    }
  },
  operatingHours: {
    monday: {
      isOpen: { type: Boolean, default: true },
      openTime: { type: String, default: "09:00" },
      closeTime: { type: String, default: "17:00" }
    },
    tuesday: {
      isOpen: { type: Boolean, default: true },
      openTime: { type: String, default: "09:00" },
      closeTime: { type: String, default: "17:00" }
    },
    wednesday: {
      isOpen: { type: Boolean, default: true },
      openTime: { type: String, default: "09:00" },
      closeTime: { type: String, default: "17:00" }
    },
    thursday: {
      isOpen: { type: Boolean, default: true },
      openTime: { type: String, default: "09:00" },
      closeTime: { type: String, default: "17:00" }
    },
    friday: {
      isOpen: { type: Boolean, default: true },
      openTime: { type: String, default: "09:00" },
      closeTime: { type: String, default: "17:00" }
    },
    saturday: {
      isOpen: { type: Boolean, default: true },
      openTime: { type: String, default: "09:00" },
      closeTime: { type: String, default: "17:00" }
    },
    sunday: {
      isOpen: { type: Boolean, default: false },
      openTime: { type: String, default: "09:00" },
      closeTime: { type: String, default: "17:00" }
    }
  },
  specialDates: [{
    date: { type: Date, required: true },
    isOpen: { type: Boolean, required: true },
    openTime: String,
    closeTime: String,
    note: String
  }],
  timezone: { 
    type: String, 
    default: "Africa/Lagos" 
  },
  storePolicy: {
    deliveryTimes: { type: String },
    freeShippingPolicy: { type: String },
    lostOrDamagedPolicy: { type: String },
    refundPolicy: { type: String },
    processingTime: { type: String },
    refundMethod: { 
      type: String
      
    },
    nonRefundableItems: [{ type: String }],
    returnWindow: { 
      type: Number,
      default: 14
    },
    returnCondition: { type: String },
    returnShipping: {
      type: String
     
    },
    exchangePolicy: { type: String },
    allowsCod: {
      type: Boolean,
      default: true
    }
  },
  offersStorePickup: { type: Boolean, default: false },
});

// Middleware to update isNew property after 3 days
sellerSchema.pre('save', async function (next) {
  console.log('Starting Seller pre-save middleware...');
  const now = new Date();

  try {
    console.log('Checking isNew status...');
    if (this.isNewSeller && this.createdAt) {
      const createdAt = new Date(this.createdAt);
      const daysDifference = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
      console.log('Days difference:', daysDifference);

      if (daysDifference >= 3) {
        this.isNewSeller = false;
      }
    }

    console.log('Checking password modification...');
    if (this.isModified('password')) {
      console.log('Hashing new password...');
      this.password = await bcrypt.hash(this.password, 10);
    }

    // Reset daily campaign count at midnight
    console.log('Checking campaign stats...');
    if (!this.campaignStats) {
      console.log('Initializing campaign stats...');
      this.campaignStats = {
        totalCampaigns: 0,
        totalRecipients: 0,
        dailyCampaignCount: 0,
        lastCampaignDate: null
      };
    }

    const lastCampaignDate = this.campaignStats.lastCampaignDate;
    console.log('Last campaign date:', lastCampaignDate);
  
    if (lastCampaignDate) {
      console.log('Checking if same day...');
      const isSameDay = now.toDateString() === lastCampaignDate.toDateString();
      console.log('Is same day:', isSameDay);
      if (!isSameDay) {
        console.log('Resetting daily campaign count...');
        this.campaignStats.dailyCampaignCount = 0;
      }
    }

    console.log('Pre-save middleware completed successfully');
    next();
  } catch (error) {
    console.error('Error in Seller pre-save middleware:', error);
    next(error);
  }
});

// Compare passwords
sellerSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

// Middleware to update completion status
sellerSchema.pre('save', function (next) {
  console.log('Starting completion status middleware...');
  try {
    // Update completion status based on filled details
    this.isProfileComplete = this.hasFilledAddress &&
    this.hasFilledWarehouseAddress &&
    this.hasFilledBankDetails &&
    this.hasFilledCategoryDetails &&
    this.hasFilledVerificationDocuments &&
    this.hasFilledBusinessAddress;

    console.log('Completion status updated');
    next();
  } catch (error) {
    console.error('Error in completion status middleware:', error);
    next(error);
  }
});

sellerSchema.pre('save', async function(next) {
  // Only keep the validation check
  if (this.agoraUid < 0 || this.agoraUid > 4294967295) {
    return next(new Error('Agora UID must be between 0 and 4294967295'));
  }
  next();
});

// Add method to calculate month-over-month change
sellerSchema.methods.calculateMonthlyChange = function(currentValue, lastMonthValue) {
  if (!lastMonthValue || lastMonthValue === 0) return 0;
  return ((currentValue - lastMonthValue) / lastMonthValue) * 100;
};

// Add method to update seller stats based on product reviews
sellerSchema.methods.updateProductRatingStats = async function() {
  try {
    const Product = mongoose.model('Product');
    
    // Aggregate to get all product reviews from this seller
    const productStats = await Product.aggregate([
      { $match: { seller: this._id } },
      { $unwind: { path: "$reviews", preserveNullAndEmptyArrays: false } },
      { 
        $group: {
          _id: "$reviews.rating",
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Reset rating distribution
    const ratingDistribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0
    };
    
    // Fill in the distribution and calculate total
    let totalReviews = 0;
    let ratingSum = 0;
    
    productStats.forEach(stat => {
      const rating = stat._id;
      const count = stat.count;
      
      if (rating >= 1 && rating <= 5) {
        ratingDistribution[rating] = count;
        totalReviews += count;
        ratingSum += rating * count;
      }
    });
    
    // Update the seller stats
    this.stats.totalReviews = totalReviews;
    this.stats.averageRating = totalReviews > 0 ? 
      parseFloat((ratingSum / totalReviews).toFixed(1)) : 0;
    this.stats.ratingDistribution = ratingDistribution;
    
    return true;
  } catch (error) {
    console.error('Error updating product rating stats:', error);
    return false;
  }
};

// Middleware to update seller stats from product reviews periodically
// This won't run on every save to avoid performance issues
sellerSchema.pre('save', async function(next) {
  // Only update product rating stats if explicitly requested
  // or if this is a new seller (first save)
  if (this.isNewSeller || this._updateProductRatingStats) {
    this._updateProductRatingStats = false; // Reset flag
    await this.updateProductRatingStats();
  }
  next();
});

module.exports = mongoose.model('Seller', sellerSchema);

