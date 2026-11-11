// End-to-end: a buyer must not be able to credit their own wallet without paying.
const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

const mockVerify = jest.fn();
jest.mock('axios', () => {
  const actual = jest.requireActual('axios');
  return {
    ...actual,
    create: jest.fn(() => {
      const client = actual.create();
      client.get = (...args) => mockVerify(...args);
      return client;
    }),
  };
});

const Buyer = require('@models/Buyer');
const { app } = require('@/app');

let mongoServer;

const payment = (buyerId, purpose = 'wallet_topup', amountKobo = 200000) => ({
  data: { status: true, data: { status: 'success', amount: amountKobo, currency: 'NGN', reference: 'REF_A', metadata: { buyerId: String(buyerId), purpose } } },
});

describe('wallet top-up endpoints', () => {
  let ada;
  let bola;
  const tokenFor = (buyer) => jwt.sign({ id: String(buyer._id), role: 'Buyer' }, process.env.JWT_SECRET);
  const balance = async (buyer) => (await Buyer.findById(buyer._id).lean()).wallet.balance;

  beforeAll(async () => {
    mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 }, binary: { version: '7.0.3' } });
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    mockVerify.mockReset();
    await require('@models/Transaction').deleteMany({ type: 'wallet_topup' });
    await Buyer.deleteMany({});
    ada = await Buyer.create({ email: 'ada@example.com', username: 'ada', authProvider: 'google', wallet: { balance: 0 } });
    bola = await Buyer.create({ email: 'bola@example.com', username: 'bola', authProvider: 'google', wallet: { balance: 0 } });
  });

  for (const path of ['/api/v2/buyers/wallet/topup', '/api/buyer/wallet/topup']) {
    describe(path, () => {
      it('refuses to credit an amount with no payment', async () => {
        const res = await request(app).post(path).set('Authorization', `Bearer ${tokenFor(ada)}`).send({ amount: 1000000 });
        expect(res.status).toBe(422);
        expect(await balance(ada)).toBe(0);
      });

      it('refuses bypassPaystack from a buyer', async () => {
        const res = await request(app).post(path).set('Authorization', `Bearer ${tokenFor(ada)}`).send({ amount: 1000000, bypassPaystack: true });
        expect(res.status).toBeGreaterThanOrEqual(400);
        expect(await balance(ada)).toBe(0);
      });

      it("credits Paystack's confirmed amount, not the requested one", async () => {
        mockVerify.mockResolvedValue(payment(ada._id, 'wallet_topup', 200000));
        const res = await request(app).post(path).set('Authorization', `Bearer ${tokenFor(ada)}`).send({ amount: 1000000, paymentReference: 'REF_A' });
        expect(res.status).toBe(200);
        expect(await balance(ada)).toBe(2000);
      });

      it("refuses another buyer's payment reference", async () => {
        mockVerify.mockResolvedValue(payment(ada._id));
        const res = await request(app).post(path).set('Authorization', `Bearer ${tokenFor(bola)}`).send({ amount: 2000, paymentReference: 'REF_A' });
        expect(res.status).toBe(422);
        expect(await balance(bola)).toBe(0);
        expect(await balance(ada)).toBe(0);
      });

      it('refuses a payment that was not a wallet top-up', async () => {
        mockVerify.mockResolvedValue(payment(ada._id, 'order'));
        const res = await request(app).post(path).set('Authorization', `Bearer ${tokenFor(ada)}`).send({ amount: 2000, paymentReference: 'REF_A' });
        expect(res.status).toBe(422);
        expect(await balance(ada)).toBe(0);
      });
    });
  }

  it('credits a payment once even when submitted twice at the same time', async () => {
    mockVerify.mockResolvedValue(payment(ada._id, 'wallet_topup', 200000));
    const send = () => request(app).post('/api/v2/buyers/wallet/topup').set('Authorization', `Bearer ${tokenFor(ada)}`).send({ amount: 2000, paymentReference: 'REF_A' });
    await Promise.all([send(), send(), send(), send()]);
    expect(await balance(ada)).toBe(2000);
  });
});
