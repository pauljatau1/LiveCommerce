const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const withdrawMethodSchema = new mongoose.Schema({
  method: { type: String, required: true },
  details: { type: String, required: true },
});

const subCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
});

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  subCategories: [subCategorySchema],
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
  createdAt: { type: Date, default: Date.now },
  emailVerified: { type: Boolean, default: false },
  otp: { type: String },
  isFeatured: { type: Boolean, default: false },
  isDisabled: { type: Boolean, default: false },
  walletBalance: { type: Number, default: 0 },
  withdrawRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Withdrawal' }],
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
  isNew: { type: Boolean, default: true },
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
});

// Middleware to update isNew property after 3 days
sellerSchema.pre('save', async function(next) {
  if (this.isNew && this.createdAt) {
    const createdAt = new Date(this.createdAt);
    const now = new Date();
    const daysDifference = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));

    if (daysDifference >= 3) {
      this.isNew = false; 
    }
  }

  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Compare passwords
sellerSchema.methods.comparePassword = function(password) {
  return bcrypt.compare(password, this.password);
};

// Middleware to update completion status
sellerSchema.pre('save', function(next) {
  // Update completion status based on filled details
  this.isProfileComplete = this.hasFilledAddress &&
                           this.hasFilledWarehouseAddress &&
                           this.hasFilledBankDetails &&
                           this.hasFilledCategoryDetails &&
                           this.hasFilledVerificationDocuments &&
                           this.hasFilledBusinessAddress;

  next();
});

module.exports = mongoose.model('Seller', sellerSchema);
