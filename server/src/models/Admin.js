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
      // Super admins come from ADMIN_EMAILS; everyone else joins through an invite
      validator: function(email) {
        return isAllowedAdminEmail(email) || this.invited === true;
      },
      message: props => `${props.value} is not allowed to register as an admin. Only authorized email addresses are permitted.`
    }
  },
  password: { type: String, required: true },
  lastLogin: { type: Date },
  authVersion: { type: Number, default: 0 },
  // Team access (see config/adminAccess.js)
  role: { type: String, enum: ['super', 'member'], default: 'member' },
  roleTemplate: { type: String },
  permissions: { type: Map, of: { type: String, enum: ['none', 'view', 'manage'] }, default: {} },
  invited: { type: Boolean, default: false },
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  active: { type: Boolean, default: true },
  removedAt: { type: Date },
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