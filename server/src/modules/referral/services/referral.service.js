const Buyer    = require('../../../models/Buyer');
const Seller   = require('../../../models/Seller');
const Referral = require('../../../models/Referral');

/**
 * Called after a new buyer is created.
 * Validates referral code and creates Referral record.
 * Never throws — all errors are swallowed silently.
 */
async function attributeReferral({ newBuyerId, referralCode, deviceId }) {
  try {
    if (!referralCode) return;

    // Find referrer — check Buyers first, then Sellers
    let referrer = await Buyer.findOne({ referralCode }).lean();
    let referrerModel = 'Buyer';
    if (!referrer) {
      referrer = await Seller.findOne({ referralCode }).lean();
      referrerModel = 'Seller';
    }
    if (!referrer) return; // Code doesn't exist — silent fail

    // Block self-referral
    if (referrer._id.toString() === newBuyerId.toString()) return;

    // Guard: buyer already has a referral record
    const existing = await Referral.findOne({ referee: newBuyerId });
    if (existing) return;

    // Fraud check — flag but still create referral
    let flaggedForReview = false;
    let flagReason = null;
    if (deviceId && referrer.deviceId && deviceId === referrer.deviceId) {
      flaggedForReview = true;
      flagReason = 'Same deviceId as referrer';
    }

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const referral = await Referral.create({
      referrer:      referrer._id,
      referrerModel,
      referee:       newBuyerId,
      referralCode,
      expiresAt,
      flaggedForReview,
      flagReason,
    });

    // Update referrer stats
    if (referrerModel === 'Buyer') {
      await Buyer.updateOne(
        { _id: referrer._id },
        { $inc: { 'referralStats.totalReferred': 1 } }
      );
    } else {
      await Seller.updateOne(
        { _id: referrer._id },
        { $inc: { 'referralStats.totalReferred': 1 } }
      );
    }

    // Tag new buyer as referred
    await Buyer.updateOne(
      { _id: newBuyerId },
      { $set: { referredBy: referrer._id, referralCodeUsedAt: new Date() } }
    );

    // Schedule auto reminder jobs
    const { scheduleReferralReminders } = require('../../../config/agenda');
    
    // We only call this if it's exported. It will be implemented in Phase 4.
    if (typeof scheduleReferralReminders === 'function') {
      await scheduleReferralReminders(referral._id, expiresAt);
    }

  } catch (err) {
    console.error('[attributeReferral] Error:', err.message);
    // Never rethrow — registration must not fail because of referral logic
  }
}

module.exports = { attributeReferral };
