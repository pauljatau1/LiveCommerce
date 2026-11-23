const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

const Buyer = require('@models/Buyer');
const Seller = require('@models/Seller');
const Transaction = require('@models/Transaction');
const AdminWalletAdjustment = require('@models/AdminWalletAdjustment');
const { adjust, history } = require('@/services/adminWalletAdjust');

let replSet;
const admin = { _id: new mongoose.Types.ObjectId(), email: 'paul@example.com' };

describe('admin wallet adjustments', () => {
  beforeAll(async () => {
    replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 }, binary: { version: '7.0.3' } });
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    await mongoose.connect(replSet.getUri());
    await Promise.all([Buyer, Seller, Transaction, AdminWalletAdjustment].map((m) => m.createCollection()));
  });
  afterAll(async () => { await mongoose.disconnect(); await replSet.stop(); });
  beforeEach(() => Promise.all([Buyer, Seller, Transaction, AdminWalletAdjustment].map((m) => m.deleteMany({}))));

  const seller = (walletBalance) => Seller.collection.insertOne({ firstName: 'Tolu', email: `t${Date.now()}@example.com`, walletBalance }).then((r) => r.insertedId);
  const buyer = (balance, onHoldAmount = 0) => Buyer.collection.insertOne({ firstName: 'Ada', email: `a${Date.now()}@example.com`, wallet: { balance, onHoldAmount } }).then((r) => r.insertedId);

  test('credit and debit a seller wallet with a full audit record', async () => {
    const id = await seller(5000);
    const add = await adjust({ party: 'seller', partyId: id, direction: 'add', amount: 2500, reason: 'Refund for failed courier fee', admin });
    expect(add.balance).toBe(7500);
    const take = await adjust({ party: 'seller', partyId: id, direction: 'deduct', amount: '1,000', reason: 'Duplicate payout correction', admin });
    expect(take.balance).toBe(6500);
    const log = await history('seller', id);
    expect(log.map((l) => [l.direction, l.amount, l.balanceBefore, l.balanceAfter, l.adminEmail])).toEqual([
      ['deduct', 1000, 7500, 6500, 'paul@example.com'],
      ['add', 2500, 5000, 7500, 'paul@example.com'],
    ]);
    expect(await Transaction.countDocuments({ seller: id })).toBe(2);
  });

  test('reason, amount and balance are checked; nothing changes on a refusal', async () => {
    const id = await seller(1000);
    await expect(adjust({ party: 'seller', partyId: id, direction: 'add', amount: 500, reason: 'x', admin })).rejects.toThrow(/reason/);
    await expect(adjust({ party: 'seller', partyId: id, direction: 'add', amount: -5, reason: 'Valid reason', admin })).rejects.toThrow(/amount/);
    await expect(adjust({ party: 'seller', partyId: id, direction: 'add', amount: 10.5, reason: 'Valid reason', admin })).rejects.toThrow(/amount/);
    await expect(adjust({ party: 'seller', partyId: id, direction: 'deduct', amount: 2000, reason: 'Too much taken', admin })).rejects.toThrow(/Not enough/);
    expect((await Seller.findById(id).lean()).walletBalance).toBe(1000);
    expect(await AdminWalletAdjustment.countDocuments()).toBe(0);
    expect(await Transaction.countDocuments()).toBe(0);
  });

  test('a buyer deduction can only take money that is not held for bids', async () => {
    const id = await buyer(10000, 8000);
    await expect(adjust({ party: 'buyer', partyId: id, direction: 'deduct', amount: 3000, reason: 'Chargeback adjustment', admin })).rejects.toThrow(/Available: ₦2,000/);
    const ok = await adjust({ party: 'buyer', partyId: id, direction: 'deduct', amount: 2000, reason: 'Chargeback adjustment', admin });
    expect(ok.balance).toBe(8000);
    expect((await Buyer.findById(id).lean()).wallet).toMatchObject({ balance: 8000, onHoldAmount: 8000 });
  });

  test('concurrent deductions never take the wallet below zero', async () => {
    const id = await seller(1000);
    const tries = await Promise.allSettled(Array.from({ length: 5 }, () => adjust({ party: 'seller', partyId: id, direction: 'deduct', amount: 400, reason: 'Concurrent test', admin })));
    const won = tries.filter((t) => t.status === 'fulfilled').length;
    const final = (await Seller.findById(id).lean()).walletBalance;
    expect(won).toBe(2);
    expect(final).toBe(200);
    expect(await AdminWalletAdjustment.countDocuments({ partyId: id })).toBe(2);
  });
});
