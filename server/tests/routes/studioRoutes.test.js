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
});
