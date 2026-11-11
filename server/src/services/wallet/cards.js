const crypto = require('crypto');
const mongoose = require('mongoose');
const Buyer = require('../../models/Buyer');
const Card = require('../../models/PaystackCard');
const Charge = require('../../models/WalletCharge');
const { client, requireMethod, WalletPaymentError: Error } = require('./paystackClient');
const { publicCard, usable, decrypt } = require('./cardStore');
const declined = 'Your bank declined this card. Try another card or a bank transfer.';
const list = async (buyerId) => {
  const buyer = await Buyer.findById(buyerId).select('email');
  const cards = await Card.find({ buyer: buyerId }).select('+email').sort({ createdAt: -1 });
  return cards.map((c) => publicCard(c, buyer.email));
};
const remove = async (buyerId, cardId) => {
  if (!mongoose.isValidObjectId(cardId)) throw new Error(404, 'Card not found.');
  await Card.deleteOne({ _id: cardId, buyer: buyerId });
  return { removed: true };
};
const response = async (charge) => {
  const buyer = await Buyer.findById(charge.buyer).select('wallet');
  return { status: charge.status, reference: charge.reference, amount: charge.amountKobo / 100,
    ...(charge.status === 'success' ? { balance: Math.max(0, buyer.wallet.balance - (buyer.wallet.onHoldAmount || 0)) } : {}),
    ...(charge.status === 'needs_bank_check' ? { accessCode: charge.accessCode } : {}),
    ...(charge.status === 'failed' ? { message: declined } : {}) };
};
async function verifyCharge(charge) {
  try {
    const result = await require('../../modules/buyer/services/verifyWalletTopUp.service').verifyWalletTopUp(charge.reference, { expectedBuyerId: charge.buyer });
    await Charge.updateOne({ _id: charge._id }, { $set: { status: 'success' }, $unset: { accessCode: 1 } });
    return { status: 'success', reference: charge.reference, amount: result.amount, balance: result.balance };
  } catch {
    // Pending, paused and transient failures must never cause a new charge.
    return response(charge);
  }
}
const status = async (buyerId, reference) => {
  const charge = await Charge.findOne({ buyer: buyerId, reference }).select('+accessCode');
  if (!charge) throw new Error(404, 'Top-up not found.');
  return charge.status === 'success' || charge.status === 'failed' ? response(charge) : verifyCharge(charge);
};
const charge = async (buyerId, cardId, { amount, idempotencyKey }) => {
  requireMethod('savedCards');
  if (typeof idempotencyKey !== 'string' || !/^[A-Za-z0-9_-]{8,100}$/.test(idempotencyKey)) throw new Error(400, 'Please start this top-up again.');
  if (!Number.isSafeInteger(amount * 100) || amount < 100 || amount > 10000000) throw new Error(400, 'Choose an amount between ₦100 and ₦10,000,000.');
  await Charge.init();
  const existing = await Charge.findOne({ buyer: buyerId, idempotencyKey }).select('+accessCode');
  if (existing) {
    if (String(existing.card) !== cardId || existing.amountKobo !== amount * 100) throw new Error(409, 'This top-up has already been started. Check your wallet.');
    return response(existing);
  }
  if (!mongoose.isValidObjectId(cardId)) throw new Error(404, 'Card not found.');
  const buyer = await Buyer.findById(buyerId).select('email');
  const card = await Card.findOne({ _id: cardId, buyer: buyerId }).select('+authorization +email');
  if (!card || !usable(card, buyer.email)) throw new Error(422, 'Use another card or a bank transfer.');
  let authorization;
  try { authorization = decrypt(card.authorization); } catch { throw new Error(422, 'Use another card or a bank transfer.'); }
  let attempt;
  try { attempt = await Charge.create({ buyer: buyerId, card: cardId, idempotencyKey, amountKobo: amount * 100, reference: `gbam_${crypto.randomUUID().replace(/-/g, '')}` }); }
  catch (error) {
    if (error.code !== 11000) throw error;
    const first = await Charge.findOne({ buyer: buyerId, idempotencyKey }).select('+accessCode');
    if (!first || String(first.card) !== cardId || first.amountKobo !== amount * 100) throw new Error(409, 'This top-up has already been started. Check your wallet.');
    return response(first);
  }
  try {
    const { data: payload } = await client().post('/transaction/charge_authorization', { authorization_code: authorization,
      email: card.email, amount: amount * 100, reference: attempt.reference,
      metadata: { purpose: 'wallet_topup', buyerId: String(buyerId) } });
    const data = payload.data;
    if (data?.paused === true && data.access_code) {
      attempt.status = 'needs_bank_check'; attempt.accessCode = data.access_code;
    } else if (data?.status === 'success') return verifyCharge(attempt);
    else if (payload.status === false || ['failed', 'abandoned'].includes(data?.status)) attempt.status = 'failed';
    await attempt.save();
  } catch (error) {
    // Timeout means unknown, not declined. Keep our reference for verification.
    if ([400, 402, 422].includes(error.response?.status)) { attempt.status = 'failed'; await attempt.save(); }
    console.warn('[wallet] Card charge awaiting confirmation or declined.');
  }
  return response(attempt);
};
module.exports = { list, remove, charge, status };
