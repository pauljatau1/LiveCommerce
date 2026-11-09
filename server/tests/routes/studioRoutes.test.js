const mongoose = require('mongoose');
const express = require('express');
const request = require('supertest');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

let mockSellerId;
jest.mock('@/middlewares/authMiddleware', () => ({
  verifyToken: (req, res, next) => { req.user = { id: String(mockSellerId), role: 'Seller' }; next(); },
  isSeller: (req, res, next) => next(),
  isBuyer: (req, res, next) => next(),
}));

const Seller = require('@models/Seller');
const Product = require('@models/Product');
const Stream = require('@models/Stream');
const Order = require('@models/Order');
const ShowDelivery = require('@/models/ShowDelivery');
const Withdrawal = require('@/models/Withdrawal');

let replSet; let app;

describe('studio routes', () => {
  let figure; let plush; let otherSellersProduct;

  beforeAll(async () => {
    replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 }, binary: { version: '7.0.3' } });
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    await mongoose.connect(replSet.getUri());
    app = express();
    app.use(express.json());
    app.use('/api/v2/studio', require('@/routes/studioRoutes'));
  });
  afterAll(async () => { await mongoose.disconnect(); await replSet.stop(); });

  beforeEach(async () => {
    await Promise.all([Seller, Product, Stream, Order, ShowDelivery, Withdrawal].map((m) => m.deleteMany({})));
    mockSellerId = (await Seller.collection.insertOne({
      firstName: 'Tolu', storeName: 'OtakuHub', email: 't@example.com', agoraUid: 1, walletBalance: 62000,
      bankDetails: { bankName: 'GTBank', accountNumber: '0123456789', accountName: 'TOLU A', bankIdentifierCode: '058' },
    })).insertedId;
    const other = (await Seller.collection.insertOne({ firstName: 'Other', email: 'o@example.com', agoraUid: 2 })).insertedId;
    const mk = (doc) => Product.collection.insertOne({ status: 'active', images: [], createdAt: new Date(), seo: { slug: String(Math.random()) }, inventory: { sku: String(Math.random()) }, ...doc }).then((r) => r.insertedId);
    figure = await mk({ name: 'Gojo figure', price: 32000, stock: 1, seller: mockSellerId, images: [{ url: 'https://img/gojo.jpg', isDefault: true }] });
    plush = await mk({ name: 'Nezuko plush', price: 15000, stock: 0, seller: mockSellerId });
    otherSellersProduct = await mk({ name: 'Not mine', price: 1000, stock: 3, seller: other });
    await Stream.create({ seller: mockSellerId, title: 'Friday drop', category: 'Figures', channelName: 'c1', status: 'scheduled', type: 'open_show', scheduledStartTime: new Date(Date.now() + 86400000), products: [{ product: { productId: String(figure), name: 'Gojo figure' } }] });
  });

  it('home: next show, products with show status, money', async () => {
    const res = await request(app).get('/api/v2/studio/home').expect(200);
    expect(res.body.seller).toMatchObject({ firstName: 'Tolu', storeName: 'OtakuHub' });
    expect(res.body.nextShow).toMatchObject({ title: 'Friday drop', type: 'drop', itemCount: 1 });
    expect(res.body.recent.map((p) => [p.name, p.status])).toEqual(expect.arrayContaining([['Gojo figure', 'in_show'], ['Nezuko plush', 'sold_out']]));
    expect(res.body.recent.find((p) => p.name === 'Not mine')).toBeUndefined();
    expect(res.body.money).toMatchObject({ ready: 62000, bank: { bankName: 'GTBank', last4: '6789' } });
  });

  it('products: counts by status, and quick edits only touch my products', async () => {
    const res = await request(app).get('/api/v2/studio/products').expect(200);
    expect(res.body.counts).toMatchObject({ all: 2, in_show: 1, sold_out: 1, hidden: 0 });

    const edited = await request(app).patch(`/api/v2/studio/products/${plush}`).send({ stock: 4, price: 14000 }).expect(200);
    expect(edited.body.product).toMatchObject({ stock: 4, price: 14000, status: 'active' });
    await request(app).patch(`/api/v2/studio/products/${plush}`).send({ hidden: true }).expect(200);
    expect((await Product.findById(plush).lean()).status).toBe('draft');

    await request(app).patch(`/api/v2/studio/products/${otherSellersProduct}`).send({ stock: 0 }).expect(404);
    await request(app).patch(`/api/v2/studio/products/${plush}`).send({ price: 5 }).expect(400);
  });

  it('recap: what sold to whom, what did not, and delivery counts', async () => {
    const show = await Stream.create({ seller: mockSellerId, title: 'Past show', category: 'Figures', channelName: 'c2', status: 'ended', type: 'open_show', actualStartTime: new Date(Date.now() - 50 * 60000), endTime: new Date(), products: [{ product: { productId: String(figure) } }, { product: { productId: String(plush) } }] });
    const buyerId = new mongoose.Types.ObjectId();
    await mongoose.connection.collection('buyers').insertOne({ _id: buyerId, firstName: 'Ada', shippingAddresses: [{ state: 'Lagos', city: 'Lekki' }] });
    const orderId = new mongoose.Types.ObjectId();
    await Stream.collection.updateOne({ _id: show._id }, { $push: { orders: { orderId: 'O1', buyer: buyerId, product: figure, amount: 35000 } } });
    await ShowDelivery.create({ stream: show._id, buyer: buyerId, seller: mockSellerId, orders: [orderId], status: 'paid', items: [{ order: orderId, product: figure, name: 'Gojo figure', quantity: 1, unitPrice: 32000 }] });

    const res = await request(app).get(`/api/v2/studio/shows/${show._id}/recap`);
    if (res.status !== 200) throw new Error(res.body.message);
    expect(res.body).toMatchObject({ earned: 32000, itemsSold: 1, buyers: 1, minutes: 50, deliveries: { toBook: 1 } });
    expect(res.body.sold[0]).toMatchObject({ name: 'Gojo figure', buyer: 'Ada', area: 'Lagos · Lekki' });
    expect(res.body.unsold.map((u) => u.name)).toEqual(['Nezuko plush']);
  });

  it('show: items with live state, stock and sales; other sellers get 404', async () => {
    const show = await Stream.findOne({ title: 'Friday drop' }).lean();
    const res = await request(app).get(`/api/v2/studio/shows/${show._id}`).expect(200);
    expect(res.body.show).toMatchObject({ title: 'Friday drop', type: 'drop', status: 'scheduled' });
    expect(res.body.items[0]).toMatchObject({ name: 'Gojo figure', stock: 1, price: 32000, image: 'https://img/gojo.jpg', bidStatus: 'pending', sold: 0 });
    const theirs = await Stream.create({ seller: new mongoose.Types.ObjectId(), title: 'Theirs', category: 'x', channelName: 'c3', type: 'open_show', products: [] });
    await request(app).get(`/api/v2/studio/shows/${theirs._id}`).expect(404);
  });

  it('withdraw: within what is ready, and pending requests count against it', async () => {
    await request(app).post('/api/v2/studio/withdraw').send({ amount: 500 }).expect(400);
    await request(app).post('/api/v2/studio/withdraw').send({ amount: 40000 }).expect(200);
    const money = await request(app).get('/api/v2/studio/money').expect(200);
    expect(money.body).toMatchObject({ ready: 22000, requested: 40000 });
    expect(money.body.activity[0]).toMatchObject({ kind: 'out', amount: 40000, detail: 'Processing' });
    await request(app).post('/api/v2/studio/withdraw').send({ amount: 30000 }).expect(400);
  });

  it('+30s adds time to the running auction on my live show only', async () => {
    const show = await Stream.create({ seller: mockSellerId, title: 'Live now', category: 'Women', channelName: 'c9', status: 'live', type: 'auction', products: [{ product: { productId: String(figure), name: 'Gojo figure' }, minBid: 5000, maxBid: 500000, bidStatus: 'active', auctionEndsAt: new Date(Date.now() + 10000) }] });
    const res = await request(app).post(`/api/v2/studio/shows/${show._id}/auction/time`).send({ productId: String(figure), seconds: 30 }).expect(200);
    expect(res.body.secondsLeft).toBeGreaterThanOrEqual(39);
    await request(app).post(`/api/v2/studio/shows/${show._id}/auction/time`).send({}).expect(400);
    const notMine = await Stream.create({ seller: new mongoose.Types.ObjectId(), title: 'Other', category: 'Women', channelName: 'c10', status: 'live', type: 'auction', products: [{ product: { productId: String(figure) }, minBid: 1, maxBid: 2, bidStatus: 'active' }] });
    await request(app).post(`/api/v2/studio/shows/${notMine._id}/auction/time`).send({ productId: String(figure) }).expect(404);
    require('@/services/auctionClock').clock().shutdown();
  });

  it('show notes: pin on my show, reuse for next shows, refuse what is unsafe', async () => {
    const show = await Stream.findOne({ title: 'Friday drop' });
    const res = await request(app).put(`/api/v2/studio/shows/${show._id}/notes`).send({ notes: { howToBuy: 'Tap Buy now.', delivery: 'One fee per show.' }, saveAsDefault: true }).expect(200);
    expect(res.body.notes).toMatchObject({ howToBuy: 'Tap Buy now.', payment: 'Never pay outside the app.' });
    expect(res.body.firstLine).toBe('Tap Buy now.');
    const def = await request(app).get('/api/v2/studio/show-notes/default').expect(200);
    expect(def.body.notes.delivery).toBe('One fee per show.');
    const bad = await request(app).put(`/api/v2/studio/shows/${show._id}/notes`).send({ notes: { delivery: 'call 08031234567' } }).expect(400);
    expect(bad.body.message).toMatch(/phone numbers/);
    const detail = await request(app).get(`/api/v2/studio/shows/${show._id}`).expect(200);
    expect(detail.body.show.notes.howToBuy).toBe('Tap Buy now.');
    await request(app).delete(`/api/v2/studio/shows/${show._id}/notes`).expect(200);
    const drafted = await request(app).post('/api/v2/studio/show-notes/draft').send({ title: 'x', type: 'drop', items: [] }).expect(200);
    expect(drafted.body.notes.payment).toMatch(/^Never pay outside the app\./);
  });

  it('weekly slot: save it, and "Same time next week?" plans unsold + new items for the next slot', async () => {
    await request(app).put('/api/v2/studio/slot').send({ day: 9, time: '19:00' }).expect(400);
    const saved = await request(app).put('/api/v2/studio/slot').send({ day: 6, time: '19:00' }).expect(200);
    expect(saved.body.slot).toMatchObject({ day: 6, time: '19:00', saved: true, label: 'Live every Saturday at 7pm' });

    const start = new Date(Date.now() - 3 * 3600 * 1000);
    const past = await Stream.create({ seller: mockSellerId, title: 'Saturday thrift', category: 'Women', channelName: 'c11', status: 'ended', type: 'auction', scheduledStartTime: start, actualStartTime: start, endTime: new Date(), products: [{ product: { productId: String(figure), name: 'Gojo figure' }, minBid: 20000, maxBid: 2000000, auctionSeconds: 60, bidStatus: 'ended' }] });
    await Stream.deleteMany({ title: 'Friday drop' }); // free the figure from the upcoming show
    const fresh = (await Product.collection.insertOne({ name: 'Ankara two-piece', price: 9000, stock: 2, status: 'active', seller: mockSellerId, images: [], createdAt: new Date(), seo: { slug: 'a2p' }, inventory: { sku: 'a2p' } })).insertedId;

    const res = await request(app).get(`/api/v2/studio/shows/${past._id}/next-plan`).expect(200);
    expect(res.body.counts).toEqual({ unsold: 1, new: 1 });
    expect(new Date(res.body.plan.scheduledStartTime).toISOString()).toBe(new Date(res.body.slot.next).toISOString());
    expect(new Date(res.body.plan.scheduledStartTime).getUTCDay()).toBe(6);
    // Cheapest first; the unsold item keeps its starting bid and auction time
    expect(res.body.plan.products).toEqual([
      expect.objectContaining({ product: { productId: String(fresh) }, minBid: 5500, auctionSeconds: 30 }),
      expect.objectContaining({ product: { productId: String(figure) }, minBid: 20000, auctionSeconds: 60 }),
    ]);

    const recap = await request(app).get(`/api/v2/studio/shows/${past._id}/recap`).expect(200);
    expect(recap.body.slot.label).toBe('Live every Saturday at 7pm');
    expect(recap.body.payout.rule).toBe('Each order pays out 1 day after delivery.');
  });

  it('notifications: new orders, wins, payouts, newest first; mark all read', async () => {
    const buyerId = new mongoose.Types.ObjectId();
    await mongoose.connection.collection('buyers').insertOne({ _id: buyerId, firstName: 'Ada', username: 'ada_notif', email: 'ada-notif@example.com' });
    const orderId = new mongoose.Types.ObjectId();
    await ShowDelivery.create({ stream: new mongoose.Types.ObjectId(), buyer: buyerId, seller: mockSellerId, orders: [orderId], status: 'paid', items: [{ order: orderId, product: figure, name: 'Gojo figure', quantity: 2, unitPrice: 21750 }] });
    await Withdrawal.create({ seller: mockSellerId, amount: 62000, status: 'completed', bankDetails: { bankName: 'GTBank', accountNumber: '0123456789' }, paymentInfo: { completedAt: new Date(Date.now() - 3600000) } });

    let res = await request(app).get('/api/v2/studio/notifications').expect(200);
    expect(res.body.items.map((n) => n.title)).toEqual(['New order from Ada', '₦62,000 sent to GTBank ••6789']);
    expect(res.body.items[0]).toMatchObject({ body: '2 items · ₦43,500', link: '/studio/orders', unread: true });
    expect(res.body.unread).toBe(2);

    await request(app).post('/api/v2/studio/notifications/read').expect(200);
    res = await request(app).get('/api/v2/studio/notifications').expect(200);
    expect(res.body.unread).toBe(0);
  });
});
