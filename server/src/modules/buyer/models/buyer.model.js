const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const addressSchema = new mongoose.Schema({
  addressType: { 
    type: String, 
    required: true,
    enum: ['home', 'work', 'other']
  },
  country: { type: String, required: true },
  state: { type: String, required: true },
  city: { type: String, required: true },
  addressLine1: { type: String, required: true },
  addressLine2: { type: String },
  zipCode: { type: String, required: true }
}, { _id: true });

const subCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
});

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  subCategories: [subCategorySchema],
});

const transactionSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['credit', 'debit'],
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  paymentReference: { 
    type: String,
    sparse: true, 
    index: true   
  },
  description: { 
    type: String, 
    required: true 
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed'
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

const buyerSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  username: { type: String, unique: true },
  email: { type: String, required: true, unique: true },
  country: { type: String, default: 'NG' },
  phoneNumber: { type: String},
  password: {
    type: String,
    required: function() {
      return this.authProvider === 'local'; // Only required for local auth
    }
  },
  isActive: { type: Boolean, default: true },
  profileImage: {
    url: { type: String },
    public_id: { type: String },
  },
  shippingAddresses: {
    type: [addressSchema],
    default: []
  },
  viewedBlips: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product.blips',
    default: []
  }],
  bio: { type: String },
  createdAt: { type: Date, default: Date.now },
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
  phoneVerification: {
    otp: String,
    expiresAt: Date,
    attempts: { type: Number, default: 0 }
  },
  otp: { type: String },
  selectedCategories: [categorySchema],
  isDisabled: { type: Boolean, default: false },
 
  activityFeed: [{
    type: { type: String, enum: ['post', 'product_review', 'product_purchase', 'follow'] },
    content: { type: String },
    reference: { type: mongoose.Schema.Types.ObjectId, refPath: 'activityFeed.referenceModel' },
    referenceModel: { type: String, enum: ['Post', 'Product', 'Buyer', 'Seller'] },
    createdAt: { type: Date, default: Date.now }
  }],
  messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
  conversations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' }],
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  wishlist: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    addedAt: { type: Date, default: Date.now }
  }],
  isNewBuyer: { type: Boolean, default: true },
  identityDocument: {
    url: { type: String },
    public_id: { type: String },
    uploadedAt: { type: Date },
    status: { 
      type: String, 
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending'
    }
  },
  isIdentityVerified: { type: Boolean, default: false },
  identityVerificationNote: { type: String },
  resetPasswordOTP: String,
  resetPasswordOTPExpires: Date,
  notificationPreferences: {
    orderUpdates: {
      orderConfirmation: { type: Boolean, default: true },
      shippingAndDelivery: { type: Boolean, default: true },
      orderCancellation: { type: Boolean, default: true },
      refundUpdates: { type: Boolean, default: true }
    },
    liveShows: {
      allShows: { type: Boolean, default: true },
      followedSellers: { type: Boolean, default: true },
      recommendedShows: { type: Boolean, default: true }
    },
    messages: {
      fromSellers: { type: Boolean, default: true },
      fromBuyers: { type: Boolean, default: true },
      chatReplies: { type: Boolean, default: true },
      mentions: { type: Boolean, default: true }
    },
    communityActivity: {
      postComments: { type: Boolean, default: true },
      postLikes: { type: Boolean, default: true },
      repliesAndMentions: { type: Boolean, default: true }
    },
    promotionsAndSales: {
      flashSales: { type: Boolean, default: true },
      couponsAndDeals: { type: Boolean, default: true },
      trendingProducts: { type: Boolean, default: true },
      recommendations: { type: Boolean, default: true }
    }
  },
  expoPushToken: { type: String },
  preferredLanguage: {
    type: String,
    enum: ['en', 'es', 'fr'],
    default: 'en'
  },
  preferredCurrency: {
    type: String,
    default: 'NGN'
  },
  followers: [{
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller' },
    storeName: { type: String },
    businessName: { type: String },
    followDate: { type: Date, default: Date.now },
    lastInteraction: { type: Date },
    optedOut: { type: Boolean, default: false }
  }],
  accountDeletion: {
    otp: String,
    expiresAt: Date,
    attempts: { type: Number, default: 0 }
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  googleId: {
    type: String,
    sparse: true // Allows null/undefined values
  },
  reports: [{
    reportedUser: {
      userId: { type: mongoose.Schema.Types.ObjectId, required: true },
      userType: { type: String, enum: ['buyer', 'seller'], required: true }
    },
    reason: { type: String, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved'],
      default: 'pending'
    },
    createdAt: { type: Date, default: Date.now }
  }],
  wallet: {
    balance: { 
      type: Number, 
      default: 0,
      min: 0 
    },
    onHoldAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    onHoldItems: [{
      productId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Product', 
        required: true 
      },
      amount: { 
        type: Number, 
        required: true 
      },
      bidDate: { 
        type: Date, 
        default: Date.now 
      }
    }],
    currency: { 
      type: String, 
      default: 'NGN' 
    },
    transactions: [transactionSchema]
  },
});

// Middleware to update isNew property after 3 days
buyerSchema.pre('save', async function(next) {
  // First handle the isNew check
  if (this.isNewBuyer && this.createdAt) {
    const createdAt = new Date(this.createdAt);
    const now = new Date();
    const daysDifference = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));

    if (daysDifference >= 3) {
      this.isNewBuyer = false;
    }
  }

  // Only hash password if it's been modified (or is new) and exists
  if (this.isModified('password') && this.password) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  
  next();
});

// Compare passwords
buyerSchema.methods.comparePassword = function(password) {
  if (!this.password) {
    return false; // OAuth users won't have a password
  }
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('Buyer', buyerSchema);