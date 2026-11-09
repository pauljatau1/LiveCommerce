const mongoose = require('mongoose');
const express = require('express');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mockUser;
jest.mock('@/middlewares/authMiddleware', () => ({
  verifyToken: (req, res, next) => (mockUser ? ((req.user = mockUser), next()) : res.status(401).json({ message: 'Sign in first' })),
  isBuyer: (req, res, next) => (req.user.role === 'Buyer' ? next() : res.status(403).json({ message: 'Buyers only' })),
  isSeller: (req, res, next) => next(),
}));

jest.mock('@/services/agoraService', () => ({ generateToken: jest.fn(() => 'agora-token') }));
jest.mock('@/services/deliveryEstimate', () => {
  class EstimateUnavailable extends Error {}
  return {
    EstimateUnavailable,
    estimate: jest.fn(async ({ city }) => {
      if (!city) throw new EstimateUnavailable('Pick your state and area to see delivery.');
      return { amount: 2500, area: city, cached: true };
    }),
  };
});

const Stream = require('@models/Stream');

let mongoServer; let app; let show;
const productA = new mongoose.Types.ObjectId();
const productB = new mongoose.Types.ObjectId();

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({ binary: { version: '7.0.3' } });
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  await mongoose.connect(mongoServer.getUri());
  app = express();
  app.use(express.json());
  app.use('/api/v2/watch', require('@/routes/watchRoutes'));
});
afterAll(async () => { await mongoose.disconnect(); await mongoServer.stop(); });

beforeEach(async () => {
  mockUser = { id: String(new mongoose.Types.ObjectId()), role: 'Buyer' };
  await Stream.deleteMany({});
  const created = await Stream.create({ seller: new mongoose.Types.ObjectId(), title: 'Saturday drop', category: 'Women', channelName: 'c1', status: 'live', type: 'open_show', products: [{ product: { productId: String(productA) } }] });
  await Stream.collection.updateOne({ _id: created._id }, {
    $push: {
      orders: { $each: [
        { orderId: 'O1', buyer: new mongoose.Types.ObjectId(), product: productA, orderDetails: { quantity: 2 } },
        { orderId: 'O2', buyer: new mongoose.Types.ObjectId(), product: productA },
      ] },
      bids: { $each: [{ product: productB, amount: 5000 }, { product: productB, amount: 5500 }, { product: productB, amount: 6000 }] },
    },
  });
  show = created;
});

describe('GET /api/v2/watch/:id/summary', () => {
  it('counts what sold and how many bids each item had, without buyer details', async () => {
    const res = await request(app).get(`/api/v2/watch/${show._id}/summary`).expect(200);
    expect(res.body.sold).toEqual({ [String(productA)]: 3 });
    expect(res.body.bids).toEqual({ [String(productB)]: 3 });
    expect(res.body.deliveryDeposit).toBe(3000);
    expect(JSON.stringify(res.body)).not.toContain('O1');
  });

  it('says plainly when the show does not exist', async () => {
    const res = await request(app).get(`/api/v2/watch/${new mongoose.Types.ObjectId()}/summary`).expect(404);
    expect(res.body.message).toMatch(/couldn't find/);
    await request(app).get('/api/v2/watch/not-an-id/summary').expect(404);
  });
});

describe('POST /api/v2/watch/:id/report', () => {
  it('saves one report per viewer per show', async () => {
    await request(app).post(`/api/v2/watch/${show._id}/report`).send({ reason: 'Rude or abusive' }).expect(200);
    await request(app).post(`/api/v2/watch/${show._id}/report`).send({ reason: 'Asking to pay outside the app', note: 'in chat' }).expect(200);
    const saved = await Stream.findById(show._id).lean();
    expect(saved.reports).toHaveLength(1);
    expect(saved.reports[0]).toMatchObject({ reason: 'Asking to pay outside the app', note: 'in chat' });
  });

  it('needs a known reason and a signed-in buyer', async () => {
    await request(app).post(`/api/v2/watch/${show._id}/report`).send({ reason: 'whatever' }).expect(400);
    mockUser = null;
    await request(app).post(`/api/v2/watch/${show._id}/report`).send({ reason: 'Rude or abusive' }).expect(401);
  });
});

describe('watching without an account', () => {
  it('gives a guest a watch-only video token for a live show', async () => {
    mockUser = null;
    const res = await request(app).post(`/api/v2/watch/${show._id}/guest-join`).expect(200);
    expect(res.body).toMatchObject({ guest: true, token: 'agora-token', channelName: 'c1' });
    expect(res.body.uid).toBeGreaterThanOrEqual(2000000);
    expect(res.body.stream.viewers).toBeUndefined();
    expect(require('@/services/agoraService').generateToken).toHaveBeenCalledWith('c1', res.body.uid, 2);
  });

  it('says plainly when the show has not started or has ended', async () => {
    await Stream.updateOne({ _id: show._id }, { status: 'scheduled' });
    expect((await request(app).post(`/api/v2/watch/${show._id}/guest-join`).expect(410)).body.message).toMatch(/hasn't started/);
    await Stream.updateOne({ _id: show._id }, { status: 'ended' });
    expect((await request(app).post(`/api/v2/watch/${show._id}/guest-join`).expect(410)).body.message).toMatch(/ended/);
  });

  it('shows the latest chat messages to anyone, without joins or bids', async () => {
    await Stream.collection.updateOne({ _id: show._id }, { $push: { chatInteractions: { $each: [
      { id: '1', type: 'join', user: 'ada', content: 'joined' },
      { id: '2', type: 'comment', user: 'ada', content: 'how much to Lekki?' },
      { id: '3', type: 'comment', user: 'scam', content: 'pay 0123456789', hidden: true, hiddenReason: 'account' },
    ] } } });
    mockUser = null;
    const res = await request(app).get(`/api/v2/watch/${show._id}/chat`).expect(200);
    expect(res.body.chatInteractions).toEqual([expect.objectContaining({ id: '2', user: 'ada', content: 'how much to Lekki?' })]);
  });
});

describe('GET /api/v2/watch/:id/me', () => {
  it('tells a buyer the delivery deposit due before their first item', async () => {
    const res = await request(app).get(`/api/v2/watch/${show._id}/me`).expect(200);
    expect(res.body.depositDue).toBe(3000);
    mockUser = null;
    await request(app).get(`/api/v2/watch/${show._id}/me`).expect(401);
  });
});

describe('GET /api/v2/watch/:id/estimate', () => {
  it('estimates delivery to an area for anyone, and to the saved address for a buyer', async () => {
    const jwt = require('jsonwebtoken');
    mockUser = null;
    const res = await request(app).get(`/api/v2/watch/${show._id}/estimate?state=Lagos&city=Lekki`).expect(200);
    expect(res.body).toMatchObject({ available: true, amount: 2500, area: 'Lekki', deposit: 3000 });

    const none = await request(app).get(`/api/v2/watch/${show._id}/estimate`).expect(200);
    expect(none.body).toMatchObject({ available: false, message: expect.stringMatching(/Pick your state/) });

    const buyerId = new mongoose.Types.ObjectId();
    await mongoose.connection.collection('buyers').insertOne({ _id: buyerId, shippingAddresses: [{ state: 'Lagos', city: 'Ikeja' }] });
    const token = jwt.sign({ id: String(buyerId), role: 'Buyer' }, process.env.JWT_SECRET);
    const mine = await request(app).get(`/api/v2/watch/${show._id}/estimate`).set('Authorization', `Bearer ${token}`).expect(200);
    expect(mine.body).toMatchObject({ available: true, area: 'Ikeja' });
  });
});

describe('GET /api/v2/watch/:id/notes', () => {
  it('shows the pinned notes and their first line to anyone', async () => {
    mockUser = null;
    expect((await request(app).get(`/api/v2/watch/${show._id}/notes`).expect(200)).body.notes).toBeNull();
    await Stream.updateOne({ _id: show._id }, { $set: { showNotes: { howToBuy: 'Tap Bid. Highest wins.', payment: 'Never pay outside the app.' } } });
    const res = await request(app).get(`/api/v2/watch/${show._id}/notes`).expect(200);
    expect(res.body).toMatchObject({ firstLine: 'Tap Bid.', notes: expect.objectContaining({ howToBuy: 'Tap Bid. Highest wins.' }) });
    expect(res.body.sections[0]).toEqual(['howToBuy', 'How to buy']);
  });
});
