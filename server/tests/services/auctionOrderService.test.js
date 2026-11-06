const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

const Buyer = require('@models/Buyer');
const Seller = require('@models/Seller');
const Stream = require('@models/Stream');
const Product = require('@models/Product');
const Order = require('@models/Order');
const bids = require('@/services/streamBidService');
const { createAuctionOrder } = require('@/services/auctionOrderService');

let replSet;

describe('auctionOrderService', () => {
  let seller;
  let product;
  let stream;

  const createBuyer = (name, balance) =>
    Buyer.create({
      firstName: name,
      lastName: 'Test',
      username: `${name.toLowerCase()}-${new mongoose.Types.ObjectId()}`,
      email: `${name.toLowerCase()}-${new mongoose.Types.ObjectId()}@example.com`,
      authProvider: 'google',
      wallet: { balance, onHoldAmount: 0 },
      shippingAddresses: [{ country: 'NG', state: 'Lagos', city: 'Ikeja', addressLine1: '1 Allen Avenue', zipCode: '100001' }],
    });

  const wallet = async (b) => (await Buyer.findById(b._id).lean()).wallet;
  const streamProduct = async () => (await Stream.findById(stream._id).lean()).products[0];
  const win = (buyer, bidAmount = 20000, shippingFee = 2000) =>
    bids.placeBid({ streamId: stream._id, productId: product._id.toString(), buyer, bidAmount, shippingFee, maxBid: 100000 });
  const order = (buyer, bidAmount = 20000, shippingFee = 2000) =>
    createAuctionOrder({ streamId: stream._id, productId: product._id.toString(), buyerId: buyer._id, bidAmount, shippingFee });

  beforeAll(async () => {
    replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 }, binary: { version: '7.0.3' } });
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    await mongoose.connect(replSet.getUri());
    // Collections must exist before use inside a transaction
    await Promise.all([Order, Buyer, Product, Stream].map((m) => m.createCollection()));
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await replSet.stop();
  });

  beforeEach(async () => {
    await Promise.all([Buyer, Seller, Stream, Product, Order].map((m) => m.deleteMany({})));
    seller = await Seller.collection.insertOne({ firstName: 'Sade', lastName: 'Seller', email: 's@example.com', storeName: 'Figures' })
      .then((r) => ({ _id: r.insertedId }));
    product = await Product.collection.insertOne({ name: 'Gojo figure', price: 20000, stock: 1, seller: seller._id, images: [] })
      .then((r) => ({ _id: r.insertedId }));
    stream = await Stream.create({
      seller: seller._id,
      title: 'Figure auction',
      category: 'Figures',
      channelName: 'ch-1',
      status: 'live',
      type: 'auction',
      products: [{ product: { productId: product._id.toString(), name: 'Gojo figure' }, minBid: 5000, maxBid: 100000, bidStatus: 'active' }],
    });
  });

  it('charges the winner bid plus delivery, clears the hold and creates a paid order', async () => {
    const ada = await createBuyer('Ada', 50000);
    await win(ada);
    expect((await wallet(ada)).onHoldAmount).toBe(22000);

    const result = await order(ada);

    expect(result).toMatchObject({ success: true, totals: { grandTotal: 22000 } });
    // The bid hold is gone; the show's delivery deposit (3,000) is now held
    expect(await wallet(ada)).toMatchObject({ balance: 28000, onHoldAmount: 3000 });
    const saved = await Order.findOne({ buyer: ada._id }).lean();
    expect(saved).toMatchObject({ paid: true, channel: 'auction', totalAmount: 20000, shipping: { fee: { amount: 2000 } } });
    expect(saved.delivery_address.state).toBe('Lagos');
    expect((await Product.findById(product._id).lean()).stock).toBe(0);
    const sp = await streamProduct();
    expect(sp).toMatchObject({ orderCreated: true, orderId: saved.order_id, holdAmount: 0 });
    expect((await Stream.findById(stream._id).lean()).orders).toHaveLength(1);
    const show = await Stream.findById(stream._id);
    expect(show.orders[0]).toMatchObject({ amount: 22000 });
    await expect(show.save()).resolves.toBeTruthy();
  });

  it('charges a win only once, even when called twice at the same time', async () => {
    const ada = await createBuyer('Ada', 50000);
    await win(ada);

    const results = await Promise.all([order(ada), order(ada)]);

    expect(results.filter((r) => r.success)).toHaveLength(1);
    // The bid hold is gone; the show's delivery deposit (3,000) is now held
    expect(await wallet(ada)).toMatchObject({ balance: 28000, onHoldAmount: 3000 });
    expect(await Order.countDocuments({ buyer: ada._id })).toBe(1);
  });

  it('rolls everything back and frees the hold when the item is out of stock', async () => {
    const ada = await createBuyer('Ada', 50000);
    await win(ada);
    await Product.collection.updateOne({ _id: product._id }, { $set: { stock: 0 } });

    const result = await order(ada);

    expect(result).toMatchObject({ success: false, reason: 'sold_out' });
    expect(await wallet(ada)).toMatchObject({ balance: 50000, onHoldAmount: 0 });
    expect(await Order.countDocuments({})).toBe(0);
    expect((await streamProduct()).orderCreated).not.toBe(true);
  });

  it('refuses to charge a buyer who does not hold the win', async () => {
    const ada = await createBuyer('Ada', 50000);
    const bola = await createBuyer('Bola', 50000);
    await win(ada);

    const result = await order(bola);

    expect(result).toMatchObject({ success: false, reason: 'no_hold' });
    expect(await wallet(bola)).toMatchObject({ balance: 50000, onHoldAmount: 0 });
  });
});
