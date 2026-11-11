const crypto = require('crypto');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

// Paystack's verify API, as the server calls it
const mockVerify = jest.fn();
jest.mock('axios', () => {
  const actual = jest.requireActual('axios');
  const fakeClient = () => {
    const client = actual.create();
    client.get = (...args) => mockVerify(...args);
    return client;
  };
  return { ...actual, create: jest.fn(fakeClient) };
});

const Buyer = require('@models/Buyer');
const { app } = require('@/app');

const SECRET = 'sk_test_webhook_secret';
let mongoServer;

const sign = (body) => crypto.createHmac('sha512', SECRET).update(body).digest('hex');

const paystackPayment = (buyerId, { purpose = 'wallet_topup', amount = 500000, status = 'success', reference = 'TOPUP_REF_1' } = {}) => ({
  data: {
    status: true,
    data: { status, amount, currency: 'NGN', reference, metadata: { buyerId: String(buyerId), purpose } },
  },
});

const sendEvent = (event, signature) => {
  const body = JSON.stringify(event);
  return request(app)
    .post('/api/webhooks/paystack')
    .set('Content-Type', 'application/json')
    .set('x-paystack-signature', signature || sign(body))
    .send(body);
};

describe('Paystack charge.success webhook for wallet top-ups', () => {
  const savedKey = process.env.PAYSTACK_SECRET_KEY;

  beforeAll(async () => {
    process.env.PAYSTACK_SECRET_KEY = SECRET;
    mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 }, binary: { version: '7.0.3' } });
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    process.env.PAYSTACK_SECRET_KEY = savedKey;
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  let buyer;
  beforeEach(async () => {
    mockVerify.mockReset();
    await require('@models/Transaction').deleteMany({ type: 'wallet_topup' });
    await Buyer.deleteMany({});
    buyer = await Buyer.create({
      email: `ada-${Date.now()}@example.com`,
      username: `ada-${Date.now()}`,
      authProvider: 'google',
      wallet: { balance: 1000 },
    });
  });

  const balance = async () => (await Buyer.findById(buyer._id).lean()).wallet.balance;

  it('credits the amount Paystack confirms', async () => {
    mockVerify.mockResolvedValue(paystackPayment(buyer._id));
    const res = await sendEvent({ event: 'charge.success', data: { reference: 'TOPUP_REF_1', metadata: { purpose: 'wallet_topup' } } });

    expect(res.status).toBe(200);
    expect(mockVerify).toHaveBeenCalledWith('/transaction/verify/TOPUP_REF_1');
    expect(await balance()).toBe(6000); // 1,000 + ₦5,000 (500,000 kobo)
  });

  it('credits a payment only once when the event is delivered twice', async () => {
    mockVerify.mockResolvedValue(paystackPayment(buyer._id));
    const event = { event: 'charge.success', data: { reference: 'TOPUP_REF_1', metadata: { purpose: 'wallet_topup' } } };

    await Promise.all([sendEvent(event), sendEvent(event), sendEvent(event)]);

    expect(await balance()).toBe(6000);
    const credits = (await Buyer.findById(buyer._id).lean()).wallet.transactions.filter((t) => t.paymentReference === 'TOPUP_REF_1');
    expect(credits).toHaveLength(1);
  });

  it('rejects an event with a bad signature', async () => {
    mockVerify.mockResolvedValue(paystackPayment(buyer._id));
    const res = await sendEvent({ event: 'charge.success', data: { reference: 'TOPUP_REF_1', metadata: { purpose: 'wallet_topup' } } }, 'forged');

    expect(res.status).toBe(400);
    expect(mockVerify).not.toHaveBeenCalled();
    expect(await balance()).toBe(1000);
  });

  it('ignores payments that are not wallet top-ups', async () => {
    const res = await sendEvent({ event: 'charge.success', data: { reference: 'ORDER_REF_9', metadata: { purpose: 'order' } } });

    expect(res.status).toBe(200);
    expect(mockVerify).not.toHaveBeenCalled();
    expect(await balance()).toBe(1000);
  });

  it('does not credit when Paystack reports the payment was not a top-up', async () => {
    // The event claims a top-up, but Paystack's own record says otherwise
    mockVerify.mockResolvedValue(paystackPayment(buyer._id, { purpose: 'order' }));
    await sendEvent({ event: 'charge.success', data: { reference: 'TOPUP_REF_1', metadata: { purpose: 'wallet_topup' } } });

    expect(await balance()).toBe(1000);
  });
});
