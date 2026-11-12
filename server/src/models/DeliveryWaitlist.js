const mongoose = require('mongoose');
const schema = new mongoose.Schema({ buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'Buyer' }, seller:{type:mongoose.Schema.Types.ObjectId,ref:'Seller'}, contactType:String, email: String, phone: String, state: { type: String, required: true, set: require('../services/serviceArea').normalizeState }, streamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Stream' }, createdAt: { type: Date, default: Date.now } });
schema.pre('validate', function(next) { if (!this.email && !this.phone) this.invalidate('email', 'Add an email or phone number.'); next(); });
schema.index({ buyer: 1, state: 1 }, { unique: true, partialFilterExpression: { buyer: { $type: 'objectId' } } });
schema.index({seller:1,state:1},{unique:true,partialFilterExpression:{seller:{$type:'objectId'}}});
schema.index({email:1,state:1},{unique:true,partialFilterExpression:{contactType:'guest'}});
module.exports = mongoose.models.DeliveryWaitlist || mongoose.model('DeliveryWaitlist', schema);
