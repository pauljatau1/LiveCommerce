const mongoose = require('mongoose');
const Seller = require('../models/Seller');
const Buyer = require('../models/Buyer');
const Transaction = require('../models/Transaction');
const AdminWalletAdjustment = require('../models/AdminWalletAdjustment');

class AdjustError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

// Seller wallets hold one balance; buyer wallets hold a balance with part of it
// on hold for live bids, so a deduction may only take what's available.
const PARTIES = {
  seller: { Model: Seller, field: 'walletBalance', available: (d) => d.walletBalance || 0 },
  buyer: { Model: Buyer, field: 'wallet.balance', available: (d) => (d.wallet?.balance || 0) - (d.wallet?.onHoldAmount || 0) },
};

const parseAmount = (value) => {
  const amount = typeof value === 'string' ? Number(value.replace(/[,\s₦]/g, '')) : Number(value);
  if (!Number.isFinite(amount) || amount <= 0 || !Number.isInteger(amount)) throw new AdjustError(400, 'Enter a whole naira amount above 0.');
  if (amount > 10000000) throw new AdjustError(400, 'That amount is too large for a manual change.');
  return amount;
};

async function adjust({ party, partyId, direction, amount: rawAmount, reason: rawReason, admin }) {
  const cfg = PARTIES[party];
  if (!cfg || !['add', 'deduct'].includes(direction)) throw new AdjustError(400, 'Unknown wallet change.');
  if (!mongoose.isValidObjectId(String(partyId))) throw new AdjustError(404, `We couldn't find this ${party}.`);
  const amount = parseAmount(rawAmount);
  const reason = String(rawReason || '').trim();
  if (reason.length < 5) throw new AdjustError(400, 'Write a reason (at least 5 characters). The team will see it in the audit log.');
  if (reason.length > 300) throw new AdjustError(400, 'Keep the reason under 300 characters.');

  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await cfg.Model.findById(partyId).session(session).lean();
      if (!before) throw new AdjustError(404, `We couldn't find this ${party}.`);
      const filter = { _id: partyId };
      if (direction === 'deduct') {
        if (cfg.available(before) < amount) throw new AdjustError(400, `Not enough available in this wallet. Available: ₦${cfg.available(before).toLocaleString()}.`);
        // Conditional write: a bid hold or payout landing at the same moment can't push the wallet below zero
        if (party === 'buyer') filter.$expr = { $gte: [{ $subtract: [{ $ifNull: ['$wallet.balance', 0] }, { $ifNull: ['$wallet.onHoldAmount', 0] }] }, amount] };
        else filter.walletBalance = { $gte: amount };
      }
      const after = await cfg.Model.findOneAndUpdate(filter, { $inc: { [cfg.field]: direction === 'add' ? amount : -amount } }, { new: true, session, runValidators: false }).lean();
      if (!after) throw new AdjustError(409, 'The wallet changed while you were adjusting it. Check the balance and try again.');
      const balanceBefore = party === 'seller' ? before.walletBalance || 0 : before.wallet?.balance || 0;
      const balanceAfter = party === 'seller' ? after.walletBalance || 0 : after.wallet?.balance || 0;
      const [log] = await AdminWalletAdjustment.create([{ admin: admin._id, adminEmail: admin.email, party, partyId, direction, amount, reason, balanceBefore, balanceAfter }], { session });
      if (party === 'seller') {
        await Transaction.create([{
          seller: partyId, type: direction === 'add' ? 'order_payment' : 'platform_fee', amount, status: 'completed',
          description: `Admin ${direction === 'add' ? 'credit' : 'deduction'}: ${reason}`,
          metadata: { adminAdjustment: log._id, adminId: admin._id, reason },
        }], { session });
      }
      result = { adjustment: log.toObject(), balance: balanceAfter };
    });
    return result;
  } finally {
    await session.endSession();
  }
}

const history = (party, partyId) => AdminWalletAdjustment.find({ party, partyId }).sort({ createdAt: -1 }).limit(100).lean();

module.exports = { adjust, history, AdjustError, parseAmount };
