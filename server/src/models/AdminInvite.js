const mongoose = require('mongoose');

// An invitation to the admin. Only a hash of the link's token is stored.
const adminInviteSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true, index: true },
  tokenHash: { type: String, required: true, unique: true },
  role: { type: String, enum: ['super', 'member'], default: 'member' },
  roleTemplate: { type: String },
  permissions: { type: Map, of: { type: String, enum: ['none', 'view', 'manage'] }, default: {} },
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  invitedByEmail: { type: String },
  expiresAt: { type: Date, required: true },
  acceptedAt: { type: Date },
  acceptedAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  revokedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.models.AdminInvite || mongoose.model('AdminInvite', adminInviteSchema);
