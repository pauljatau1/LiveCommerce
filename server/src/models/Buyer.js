const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const addressSchema = new mongoose.Schema({
  country: { type: String },
  city: { type: String },
  address1: { type: String },
  address2: { type: String },
  zipCode: { type: String },
  addressType: { type: String },
});

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
  shippingAddresses: [addressSchema],
  bio: { type: String },
  createdAt: { type: Date, default: Date.now },
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
  otp: { type: String },
  selectedCategories: [categorySchema],
  isDisabled: { type: Boolean, default: false },
  following: [{
    userId: { type: mongoose.Schema.Types.ObjectId, refPath: 'following.userType' },
    userType: { type: String, enum: ['Buyer', 'Seller'] },
    name: { type: String },
    followedAt: { type: Date, default: Date.now }
  }],
  followers: [{
    userId: { type: mongoose.Schema.Types.ObjectId, refPath: 'followers.userType' },
    userType: { type: String, enum: ['Buyer', 'Seller'] },
    name: { type: String },
    followedAt: { type: Date, default: Date.now }
  }],
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
});

// Hash password before saving
buyerSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Compare passwords
buyerSchema.methods.comparePassword = function(password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('Buyer', buyerSchema);
