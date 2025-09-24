const { findBuyerById, applyAnonymizedDeletion, deleteBuyerById } = require('../repositories/buyer.repository');
const { purgeBuyerReferences } = require('../repositories/seller.repository');

/**
 * Service for Admin operations on Buyer accounts.
 */

/**
 * Soft-delete and anonymize a buyer account by id. Idempotent.
 * @param {string} buyerId
 * @returns {Promise<{ status: boolean, message: string, buyerId?: string }>}
 */
async function deleteBuyerAccount(buyerId, options = {}) {
  const { hard = false } = options;
  if (!buyerId || !buyerId.match(/^[0-9a-fA-F]{24}$/)) {
    const err = new Error('Invalid buyerId');
    err.status = 400;
    throw err;
  }

  const buyer = await findBuyerById(buyerId);
  if (!buyer) {
    const err = new Error('Buyer not found');
    err.status = 404;
    throw err;
  }

  if (hard) {
    // Remove references from sellers (followers, customers)
    await purgeBuyerReferences(buyer._id);
    // Delete buyer document
    const result = await deleteBuyerById(buyer._id);
    return { status: true, message: 'Buyer hard-deleted successfully', buyerId: buyer._id, deletedCount: result.deletedCount };
  }

  if (buyer.isDisabled === true && buyer.isActive === false) {
    return { status: true, message: 'Buyer already deleted', buyerId: buyer._id };
  }

  const timestamp = Date.now();
  const updates = {
    isActive: false,
    isDisabled: true,
    email: `deleted_${buyer._id}_${timestamp}@anonymized.local`,
    username: `deleted_${buyer._id}_${timestamp}`,
    phoneNumber: undefined,
    profileImage: { url: undefined, public_id: undefined },
    googleId: undefined,
    otp: undefined,
    resetPasswordToken: undefined,
    resetPasswordExpires: undefined,
    resetPasswordOTP: undefined,
    resetPasswordOTPExpires: undefined,
    phoneVerification: { otp: undefined, expiresAt: undefined, attempts: 0 },
    accountDeletion: { otp: undefined, expiresAt: undefined, attempts: 0 },
    expoPushToken: undefined,
  };

  await applyAnonymizedDeletion(buyer._id, updates);
  return { status: true, message: 'Buyer deleted successfully', buyerId: buyer._id };
}

module.exports = {
  deleteBuyerAccount,
};


