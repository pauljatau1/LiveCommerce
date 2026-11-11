const mongoose = require('mongoose');
const schema = new mongoose.Schema({ buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'Buyer' }, email: String, phone: String, state: { type: String, required: true, set: require('../services/serviceArea').normalizeState }, streamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Stream' }, createdAt: { type: Date, default: Date.now } });
schema.pre('validate', function(next) { if (!this.email && !this.phone) this.invalidate('email', 'Add an email or phone number.'); next(); });
schema.index({ buyer: 1, state: 1 }, { unique: true, partialFilterExpression: { buyer: { $type: 'objectId' } } });
module.exports = mongoose.models.DeliveryWaitlist || mongoose.model('DeliveryWaitlist', schema);
