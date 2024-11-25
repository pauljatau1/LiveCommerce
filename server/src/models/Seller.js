const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const withdrawMethodSchema = new mongoose.Schema({
  method: { type: String, required: true },
  details: { type: String, required: true },
});

const sellerSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  businessName: { type: String },
  businessAddress: {
    country: { type: String },
    state: { type: String },
    city: { type: String },
    streetAddressLine1: { type: String },
    streetAddressLine2: { type: String },
    zipCode: { type: String },
  },
  accountType: { type: String, enum: ['individual', 'business'] },
  isVerified: { type: Boolean, default: false },
  verificationDocuments: [{
    type: { type: String },
    fileUrl: { type: String },
  }],
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
  categories: [{
    name: { type: String },
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  }],
  shippingOptions: {
    shippingMethod: { type: String, enum: ['shippedBySeller', 'storePickup'] },
    returnPolicy: { type: String },
  },
  warehouseAddress: {
    country: { type: String },
    state: { type: String },
    city: { type: String },
    address: { type: String },
    zipCode: { type: String },
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
  followers: [{
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Buyer' },
    name: { type: String },
  }],
  messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
  conversations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' }],
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
  isProfileComplete: { type: Boolean, default: false },
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
