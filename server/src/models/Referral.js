const mongoose = require('mongoose');

const ReferralSchema = new mongoose.Schema(
  {
    referrer: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'referrerModel',
      required: true,
    },
    referrerModel: {
      type: String,
      required: true,
      enum: ['Buyer', 'Seller'],
    },
    referee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Buyer',
      required: true,
      unique: true, // One referral record per referred user
    },
    referralCode:  { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'completed', 'expired'],
      default: 'pending',
    },
    linkTarget: {
      type:     { type: String, enum: ['store', 'product', 'stream'], default: 'store' },
      targetId: { type: mongoose.Schema.Types.ObjectId, default: null },
    },
    expiresAt:   { type: Date, required: true }, // sign-up + 7 days
    completedAt: { type: Date, default: null },
    orderId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    orderValue:  { type: Number, default: null },
    rewardIssued: { type: Boolean, default: false },

    // Reminder tracking
    day3ReminderSent:    { type: Boolean, default: false },
    day7ReminderSent:    { type: Boolean, default: false },
    manualReminderSent:  { type: Boolean, default: false }, // 1 manual remind max
    lastReminderAt:      { type: Date, default: null },

    // Fraud detection
    flaggedForReview: { type: Boolean, default: false },
    flagReason:       { type: String, default: null },
  },
  { timestamps: true }
);

ReferralSchema.index({ referrer: 1, status: 1 });
ReferralSchema.index({ referee: 1 });
ReferralSchema.index({ referralCode: 1 });
ReferralSchema.index({ expiresAt: 1, status: 1 });

module.exports = mongoose.model('Referral', ReferralSchema);
