const mongoose = require('mongoose');
const Buyer = require('../../models/Buyer');
const Transaction = require('../../models/Transaction');
const { emit } = require('./paystackClient');

// Verification happens before this function; the ledger claim and wallet write
// commit together. A unique Paystack reference also covers webhook/client races.
module.exports = async function creditTopUp(buyerId, payment, source) {
  await Transaction.init();
  const amount = payment.amount / 100, reference = payment.reference;
  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      const buyer = await Buyer.findById(buyerId).session(session);
      if (!buyer) throw new Error('Buyer not found');
      const existing = await Transaction.findOne({ type: 'wallet_topup', paymentReference: reference }).session(session);
      const old = buyer.wallet.transactions.find((t) => t.paymentReference === reference);
      if (existing && String(existing.buyer) !== String(buyerId)) throw new Error('Payment owner mismatch');
      const credited = !existing && old?.status !== 'completed';
      if (!existing) {
        await Transaction.create([{ buyer: buyerId, type: 'wallet_topup', source, amount, paymentReference: reference,
          description: source === 'bank_transfer' ? 'Wallet top-up by bank transfer' : 'Wallet top-up by card' }], { session });
      }
      if (credited) {
        if (old) { old.status = 'completed'; old.amount = amount; }
        else buyer.wallet.transactions.push({ type: 'credit', amount, paymentReference: reference,
          description: 'Wallet top up via Paystack', status: 'completed' });
        buyer.wallet.balance += amount;
        await buyer.save({ session });
      }
      result = { credited, amount, reference, newBalance: buyer.wallet.balance,
        balance: Math.max(0, buyer.wallet.balance - (buyer.wallet.onHoldAmount || 0)),
        transaction: buyer.wallet.transactions.find((t) => t.paymentReference === reference),
        message: credited ? 'Wallet topped up successfully' : 'Payment already processed' };
    });
  } catch (error) {
    if (error.code !== 11000) throw error;
    const ledger = await Transaction.findOne({ type: 'wallet_topup', paymentReference: reference, buyer: buyerId });
    if (!ledger) throw error;
    const buyer = await Buyer.findById(buyerId);
    result = { credited: false, amount, reference, newBalance: buyer.wallet.balance,
      balance: Math.max(0, buyer.wallet.balance - (buyer.wallet.onHoldAmount || 0)), message: 'Payment already processed' };
  } finally { await session.endSession(); }
  if (result.credited) {
    try { emit(buyerId, 'wallet_credited', { amount, balance: result.balance, source: source === 'bank_transfer' ? 'transfer' : 'card', reference }); }
    catch { console.warn('[wallet] Credit committed; live notification unavailable.'); }
  }
  return result;
};
