const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const withdrawMethodSchema = new mongoose.Schema({
  method: { type: String, required: true }, 
  details: { type: String, required: true },
});

const sellerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: {
    url: { type: String },
    public_id: { type: String },
  },
  addresses: [{
    country: { type: String },
    city: { type: String },
    address1: { type: String },
    address2: { type: String },
    zipCode: { type: String },
    addressType: { type: String },
  }],
  phoneNumber: { type: String, required: true },
  zipCode: { type: String, required: true },
  type: { type: String, enum: ['individual', 'business'], required: true },
  withdrawMethod: withdrawMethodSchema,
  createdAt: { type: Date, default: Date.now },
  aboutSeller: { type: String },
  tags: [{ type: String }],
  shippingMethods: [{ type: String }],
  emailVerified: { type: Boolean, default: false },
  otp: { type: String },
  isFeatured: { type: Boolean, default: false },
  isDisabled: { type: Boolean, default: false },
  walletBalance: { type: Number, default: 0 },
  withdrawRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Withdrawal' }],
  categories: [{
    name: { type: String },
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  }],
  followers: [{
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Buyer' },
    name: { type: String },
  }],
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