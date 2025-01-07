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

const buyerSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  country: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  password: { type: String },
  profileImage: {
    url: { type: String },
    public_id: { type: String },
  },
  shippingAddresses: {
    type: [addressSchema],
    default: []
  },
  
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
  isNew: { type: Boolean, default: true },
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
});

// Middleware to update isNew property after 3 days
buyerSchema.pre('save', async function(next) {
  if (this.isNew && this.createdAt) {
    const createdAt = new Date(this.createdAt);
    const now = new Date();
    const daysDifference = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));

    if (daysDifference >= 3) {
      this.isNew = false; // Set isNew to false after 3 days
    }
  }

  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Add a pre-save middleware to check for duplicate address types
buyerSchema.pre('save', function(next) {
  if (this.isModified('shippingAddresses')) {
    const addressTypes = this.shippingAddresses.map(addr => addr.addressType);
    const uniqueTypes = new Set(addressTypes);
    
    if (addressTypes.length !== uniqueTypes.size) {
      return next(new Error('Multiple addresses of the same type are not allowed'));
    }
  }
  next();
});

// Compare passwords
buyerSchema.methods.comparePassword = function(password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('Buyer', buyerSchema);
