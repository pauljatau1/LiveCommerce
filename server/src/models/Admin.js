const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const { isAllowedAdminEmail } = require('../config/admins');

const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    validate: {
      validator: function(email) {
        return isAllowedAdminEmail(email);
      },
      message: props => `${props.value} is not allowed to register as an admin. Only authorized email addresses are permitted.`
    }
  },
  password: { type: String, required: true },
  lastLogin: { type: Date },
  authVersion: { type: Number, default: 0 },
}, {
  timestamps: true
});

adminSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

adminSchema.methods.comparePassword = function(password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

// just placing