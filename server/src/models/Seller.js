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
    type: { type: String, enum: ['post', 'product_added', 'product_updated', 'follow', 'promotion'] },
    content: { type: String },
    reference: { type: mongoose.Schema.Types.ObjectId, refPath: 'activityFeed.referenceModel' },
    referenceModel: { type: String, enum: ['Post', 'Product', 'Buyer', 'Seller', 'Promotion'] },
    createdAt: { type: Date, default: Date.now }
  }],
  messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
  conversations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' }],
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
  isProfileComplete: { type: Boolean, default: false },
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
});

sellerSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Compare passwords
sellerSchema.methods.comparePassword = function(password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('Seller', sellerSchema);
