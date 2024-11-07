const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const addressSchema = new mongoose.Schema({
  country: { type: String }, // Will default to buyer's country if not provided
  city: { type: String },
  address1: { type: String },
  address2: { type: String },
  zipCode: { type: String },
  addressType: { type: String }, // e.g., 'home', 'work', etc.
});

// Main buyer schema
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
  otp: { type: String },
  selectedCategories: [{ type: String }], // Add this line
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