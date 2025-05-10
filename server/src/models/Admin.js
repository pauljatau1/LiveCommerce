const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// List of allowed admin emails
const ALLOWED_ADMIN_EMAILS = [
  'bolu@auqli.com',
  'admin@auqli.com',
  'joseph@auqli.com',
  'paul@auqli.com'
];

const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    validate: {
      validator: function(email) {
        return ALLOWED_ADMIN_EMAILS.includes(email.toLowerCase());
      },
      message: props => `${props.value} is not allowed to register as an admin. Only authorized email addresses are permitted.`
    }
  },
  password: { type: String, required: true },
  lastLogin: { type: Date },
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

module.exports = mongoose.model('Admin', adminSchema);

// just placing