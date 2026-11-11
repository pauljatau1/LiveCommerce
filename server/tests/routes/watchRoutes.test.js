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

// Delivery prices come from Shipbubble (mocked here): a quote to the buyer's
// saved address, or to an address typed in the one-step sheet
jest.mock('@/services/deliveryService', () => {
  const actual = jest.requireActual('@/services/deliveryService');
  return {
    ...actual,
    depositQuote: jest.fn(async ({ buyerId }) => {
      const b = await require('mongoose').connection.collection('buyers').findOne({ _id: new (require('mongoose').Types.ObjectId)(String(buyerId)) });
      if (!b?.shippingAddresses?.length) throw new actual.DeliveryError(422, 'Add your delivery address first.');
      return { amount: 2450, courierName: 'Kwik', deliveryEta: '1-2 days', area: `${b.shippingAddresses[0].city}, ${b.shippingAddresses[0].state}` };
    }),
    previewQuote: jest.fn(async ({ address }) => {
      if (!address?.addressLine1) throw new actual.DeliveryError(422, 'Add your street, area and state to see the delivery price.');
      return { amount: 2450, courierName: 'Kwik', area: `${address.city}, ${address.state}` };
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
  it('exposes both top-up flags without replacing the per-buyer delivery quote with a flat deposit', async () => {
    const savedDva = process.env.PAYSTACK_DVA_ENABLED, savedCards = process.env.PAYSTACK_SAVED_CARDS_ENABLED;
    try {
      process.env.PAYSTACK_DVA_ENABLED = 'true'; process.env.PAYSTACK_SAVED_CARDS_ENABLED = 'true';
      const res = await request(app).get(`/api/v2/watch/${show._id}/summary`).expect(200);
      expect(res.body).toMatchObject({ deliveryDeposit: 0, topUpMethods: { dva: true, savedCards: true } });
    } finally {
      if (savedDva === undefined) delete process.env.PAYSTACK_DVA_ENABLED; else process.env.PAYSTACK_DVA_ENABLED = savedDva;
      if (savedCards === undefined) delete process.env.PAYSTACK_SAVED_CARDS_ENABLED; else process.env.PAYSTACK_SAVED_CARDS_ENABLED = savedCards;
    }
  });

  it('counts what sold and how many bids each item had, without buyer details', async () => {
    const res = await request(app).get(`/api/v2/watch/${show._id}/summary`).expect(200);
    expect(res.body.sold).toEqual({ [String(productA)]: 3 });
    expect(res.body.bids).toEqual({ [String(productB)]: 3 });
    expect(res.body.deliveryDeposit).toBe(0); // no flat deposit: each buyer gets a Shipbubble quote
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
      { id: '4', type: 'comment', user: 'Test Store', content: 'Yes we deliver', data: { isHost: true } },
      { id: '3', type: 'comment', user: 'scam', content: 'pay 0123456789', hidden: true, hiddenReason: 'account' },
    ] } } });
    mockUser = null;
    const res = await request(app).get(`/api/v2/watch/${show._id}/chat`).expect(200);
    expect(res.body.chatInteractions).toEqual([expect.objectContaining({ id: '2', user: 'ada', content: 'how much to Lekki?' }), expect.objectContaining({ id: '4', isHost: true })]);
  });
});

describe('GET /api/v2/watch/:id/me', () => {
  it('tells a buyer the quoted delivery deposit before their first item, or why it can\'t be priced', async () => {
    const noAddress = await request(app).get(`/api/v2/watch/${show._id}/me`).expect(200);
    expect(noAddress.body).toMatchObject({ depositDue: null, deliveryProblem: 'Add your delivery address first.' });

    await mongoose.connection.collection('buyers').insertOne({ _id: new mongoose.Types.ObjectId(mockUser.id), username: `m-${mockUser.id}`, email: `m-${mockUser.id}@t.test`, shippingAddresses: [{ state: 'Lagos', city: 'Maryland' }] });
    const res = await request(app).get(`/api/v2/watch/${show._id}/me?productId=${productA}`).expect(200);
    expect(res.body).toMatchObject({ depositDue: 2450, delivery: { courierName: 'Kwik', area: 'Maryland, Lagos' } });

    await mongoose.connection.collection('showdeliveries').insertOne({ stream: show._id, buyer: new mongoose.Types.ObjectId(mockUser.id), seller: show.seller, items: [] });
    expect((await request(app).get(`/api/v2/watch/${show._id}/me`).expect(200)).body.depositDue).toBe(0);
    mockUser = null;
    await request(app).get(`/api/v2/watch/${show._id}/me`).expect(401);
  });
});

describe('delivery prices: Shipbubble to a real address only', () => {
  it('no area guesses: guests are asked for an address; buyers get a quote to their saved address', async () => {
    const jwt = require('jsonwebtoken');
    mockUser = null;
    const guest = await request(app).get(`/api/v2/watch/${show._id}/estimate?state=Lagos&city=Lekki`).expect(200);
    expect(guest.body).toMatchObject({ available: false, message: 'Add your delivery address to see the delivery price.' });

    const buyerId = new mongoose.Types.ObjectId();
    await mongoose.connection.collection('buyers').insertOne({ _id: buyerId, username: `i-${buyerId}`, email: `i-${buyerId}@t.test`, shippingAddresses: [{ state: 'Lagos', city: 'Ikeja' }] });
    const token = jwt.sign({ id: String(buyerId), role: 'Buyer' }, process.env.JWT_SECRET);
    const mine = await request(app).get(`/api/v2/watch/${show._id}/estimate`).set('Authorization', `Bearer ${token}`).expect(200);
    expect(mine.body).toMatchObject({ available: true, amount: 2450, area: 'Ikeja, Lagos' });
  });

  it('prices an address typed in the one-step sheet', async () => {
    mockUser = null;
    const ok = await request(app).post(`/api/v2/watch/${show._id}/delivery-quote`).send({ productId: String(productA), address: { addressLine1: '3 Ikorodu Rd', city: 'Maryland', state: 'Lagos', phoneNumber: '08031234567' } }).expect(200);
    expect(ok.body).toMatchObject({ available: true, amount: 2450, area: 'Maryland, Lagos' });
    const missing = await request(app).post(`/api/v2/watch/${show._id}/delivery-quote`).send({ address: { city: 'Maryland' } }).expect(200);
    expect(missing.body).toMatchObject({ available: false, message: expect.stringMatching(/street, area and state/) });
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

describe('host rating and follow state', () => {
  const Seller = require('@models/Seller');
  it('shows "New host" under 5 ratings, then the average', async () => {
    const sellerId = show.seller;
    await mongoose.connection.collection('sellers').insertOne({ _id: sellerId, email: 'a@x.ng', agoraUid: 71, storeName: 'Tolu', stats: { averageRating: 4.83, totalReviews: 4 }, followers: [] });
    expect((await request(app).get(`/api/v2/watch/${show._id}/summary`)).body.host).toEqual({ rating: null, ratings: 4, isNew: true, slot: null, shipsInDays: null });
    await Seller.collection.updateOne({ _id: sellerId }, { $set: { 'stats.totalReviews': 5 } });
    expect((await request(app).get(`/api/v2/watch/${show._id}/summary`)).body.host).toEqual({ rating: 4.8, ratings: 5, isNew: false, slot: null, shipsInDays: null });
  });

  it('tells a buyer whether they follow the host', async () => {
    await mongoose.connection.collection('sellers').insertOne({ _id: show.seller, email: 'b@x.ng', agoraUid: 72, storeName: 'Tolu', followers: [{ buyerId: new mongoose.Types.ObjectId(mockUser.id) }] });
    expect((await request(app).get(`/api/v2/watch/${show._id}/me`)).body.following).toBe(true);
    mockUser = { id: String(new mongoose.Types.ObjectId()), role: 'Buyer' };
    expect((await request(app).get(`/api/v2/watch/${show._id}/me`)).body.following).toBe(false);
  });
});

describe('ships in N days', () => {
  it('uses the host\'s real median from paid to courier booked, once there are 3 shipped packages', async () => {
    const ShowDelivery = require('@/models/ShowDelivery');
    await ShowDelivery.deleteMany({});
    const day = 86400000;
    const now = Date.now();
    const mk = (paidDaysAgo, bookedAfterDays) => ShowDelivery.create({ stream: show._id, buyer: new mongoose.Types.ObjectId(), seller: show.seller, orders: [], status: 'booked', paidAt: new Date(now - paidDaysAgo * day), shipbubble: { bookedAt: new Date(now - paidDaysAgo * day + bookedAfterDays * day) } });
    await mk(10, 0.5);
    await mk(9, 1.5);
    expect((await request(app).get(`/api/v2/watch/${show._id}/summary`)).body.host.shipsInDays).toBeNull();
    await mk(8, 1.2);
    expect((await request(app).get(`/api/v2/watch/${show._id}/summary`)).body.host.shipsInDays).toBe(2);
  });
});
