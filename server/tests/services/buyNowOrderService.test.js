const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

const Buyer = require('@models/Buyer');
const Seller = require('@models/Seller');
const Stream = require('@models/Stream');
const Product = require('@models/Product');
const Order = require('@models/Order');
const { createBuyNowOrder } = require('@/services/buyNowOrderService');

let replSet;

describe('buyNowOrderService', () => {
  let seller; let product; let stream;

  const createBuyer = (name, balance, onHoldAmount = 0) => Buyer.create({
    firstName: name, lastName: 'Test', authProvider: 'google',
    username: `${name.toLowerCase()}-${new mongoose.Types.ObjectId()}`,
    email: `${name.toLowerCase()}-${new mongoose.Types.ObjectId()}@example.com`,
    wallet: { balance, onHoldAmount },
    shippingAddresses: [{ country: 'NG', state: 'Lagos', city: 'Yaba', addressLine1: '2 Herbert Macaulay Way', zipCode: '101212' }],
  });
  const wallet = async (b) => (await Buyer.findById(b._id).lean()).wallet;
  const buy = (buyer, quantity = 1) => createBuyNowOrder({ streamId: stream._id, productId: product._id.toString(), buyerId: buyer._id, quantity });

  beforeAll(async () => {
    replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 }, binary: { version: '7.0.3' } });
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    await mongoose.connect(replSet.getUri());
    await Promise.all([Order, Buyer, Product, Stream].map((m) => m.createCollection()));
  });
  afterAll(async () => { await mongoose.disconnect(); await replSet.stop(); });

  beforeEach(async () => {
    await Promise.all([Buyer, Seller, Stream, Product, Order].map((m) => m.deleteMany({})));
    seller = await Seller.collection.insertOne({ firstName: 'Sade', lastName: 'Seller', email: 's@example.com' }).then((r) => ({ _id: r.insertedId }));
    product = await Product.collection.insertOne({ name: 'Nezuko plush', price: 15000, salePrice: 0, stock: 3, status: 'active', seller: seller._id, images: [] }).then((r) => ({ _id: r.insertedId }));
    stream = await Stream.create({
      seller: seller._id, title: 'Plush drop', category: 'Plushies', channelName: 'ch', status: 'live', type: 'open_show',
      products: [{ product: { productId: product._id.toString(), name: 'Nezuko plush' } }],
    });
  });

  it('charges the wallet, takes stock and creates a paid order', async () => {
    const ada = await createBuyer('Ada', 50000);
    const result = await buy(ada, 2);
    expect(result).toMatchObject({ success: true, stockLeft: 1, order: { quantity: 2, unitPrice: 15000, total: 30000 } });
    expect((await wallet(ada)).balance).toBe(20000);
    const saved = await Order.findOne({ buyer: ada._id }).lean();
    expect(saved).toMatchObject({ paid: true, channel: 'liveshow', totalAmount: 30000 });
    expect((await Stream.findById(stream._id).lean()).orders).toHaveLength(1);
  });

  it('leaves the show savable after a sale (showing/hiding products saves the show)', async () => {
    const ada = await createBuyer('Ada', 50000);
    await buy(ada);
    const show = await Stream.findById(stream._id);
    expect(show.orders[0]).toMatchObject({ amount: 15000 });
    expect(String(show.orders[0].buyer)).toBe(String(ada._id));
    show.products[0].isVisible = true;
    await expect(show.save()).resolves.toBeTruthy();
  });

  it('never sells more than the stock when buyers race for the last items', async () => {
    const buyers = await Promise.all(Array.from({ length: 6 }, (_, i) => createBuyer(`B${i}`, 50000)));
    const results = await Promise.all(buyers.map((b) => buy(b)));
    expect(results.filter((r) => r.success)).toHaveLength(3);
    expect(results.filter((r) => r.reason === 'sold_out')).toHaveLength(3);
    expect((await Product.findById(product._id).lean()).stock).toBe(0);
    expect(await Order.countDocuments({})).toBe(3);
    const balances = await Promise.all(buyers.map(wallet));
    expect(balances.filter((w) => w.balance === 35000)).toHaveLength(3);
    expect(balances.filter((w) => w.balance === 50000)).toHaveLength(3);
  });

  it('counts wallet holds and writes nothing when the buyer cannot afford it', async () => {
    const ada = await createBuyer('Ada', 20000, 10000); // only 10,000 available
    expect(await buy(ada)).toMatchObject({ success: false, reason: 'insufficient_funds' });
    expect((await wallet(ada)).balance).toBe(20000);
    expect((await Product.findById(product._id).lean()).stock).toBe(3);
    expect(await Order.countDocuments({})).toBe(0);
  });

  it('refuses when the show is not live or the item is not in it', async () => {
    const ada = await createBuyer('Ada', 50000);
    await Stream.updateOne({ _id: stream._id }, { status: 'ended' });
    expect(await buy(ada)).toMatchObject({ success: false, reason: 'closed' });
    expect((await wallet(ada)).balance).toBe(50000);
  });
});
