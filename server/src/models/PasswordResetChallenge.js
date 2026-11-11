const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  account: {type: mongoose.Schema.Types.ObjectId, required: true},
  role: {type: String, enum: ['Buyer', 'Seller'], required: true},
  codeHash: String,
  linkHash: String,
  expiresAt: {type: Date, required: true},
  attempts: {type: Number, default: 0},
  consumed: {type: Boolean, default: false},
});
schema.index({account: 1, role: 1}, {unique: true});
schema.index({expiresAt: 1}, {expireAfterSeconds: 0});
module.exports = mongoose.models.PasswordResetChallenge || mongoose.model('PasswordResetChallenge', schema);
