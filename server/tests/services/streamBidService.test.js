const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const Buyer = require('@models/Buyer');
const Stream = require('@models/Stream');
const bids = require('@/services/streamBidService');

let mongoServer;

const PRODUCT_ID = new mongoose.Types.ObjectId();

const createBuyer = (name, balance, onHoldAmount = 0) =>
  Buyer.create({
    firstName: name,
    lastName: 'Test',
    username: `${name.toLowerCase()}-${new mongoose.Types.ObjectId()}`,
    email: `${name.toLowerCase()}-${new mongoose.Types.ObjectId()}@example.com`,
    authProvider: 'google',
    wallet: { balance, onHoldAmount },
  });

const createStream = (overrides = {}) =>
  Stream.create({
    seller: new mongoose.Types.ObjectId(),
    title: 'Figure auction',
    category: 'Figures',
    channelName: 'ch-1',
    status: 'live',
    type: 'auction',
    products: [{
      product: { productId: PRODUCT_ID.toString(), name: 'Gojo figure' },
      minBid: 5000,
      maxBid: 100000,
      bidStatus: 'active',
      ...overrides,
    }],
  });

const wallet = async (buyer) => (await Buyer.findById(buyer._id).lean()).wallet;
const productOf = async (stream) => (await Stream.findById(stream._id).lean()).products[0];

const bid = (stream, buyer, bidAmount, extra = {}) =>
  bids.placeBid({ streamId: stream._id, productId: PRODUCT_ID.toString(), buyer, bidAmount, maxBid: 100000, ...extra });

describe('streamBidService', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create({ binary: { version: '7.0.3' } });
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Promise.all([Buyer.deleteMany({}), Stream.deleteMany({})]);
  });

  it('places a bid and holds the bid plus delivery fee', async () => {
    const stream = await createStream();
    const ada = await createBuyer('Ada', 50000);

    const result = await bid(stream, ada, 10000, { shippingFee: 2000 });

    expect(result).toMatchObject({ ok: true, isWinner: false });
    expect((await wallet(ada)).onHoldAmount).toBe(12000);
    const product = await productOf(stream);
    expect(product).toMatchObject({ currentBid: 10000, holdAmount: 12000 });
    expect(String(product.holdBuyer)).toBe(String(ada._id));
  });

  it('moves the hold to the new leader when someone is outbid', async () => {
    const stream = await createStream();
    const ada = await createBuyer('Ada', 50000);
    const bola = await createBuyer('Bola', 50000);

    await bid(stream, ada, 10000);
    await bid(stream, bola, 15000);

    expect((await wallet(ada)).onHoldAmount).toBe(0);
    expect((await wallet(bola)).onHoldAmount).toBe(15000);
  });

  it('replaces, not adds to, the hold when the leader raises their own bid', async () => {
    const stream = await createStream();
    const ada = await createBuyer('Ada', 50000);

    await bid(stream, ada, 10000);
    await bid(stream, ada, 20000);

    expect((await wallet(ada)).onHoldAmount).toBe(20000);
  });

  it('refuses a bid the available balance cannot cover, counting existing holds', async () => {
    const stream = await createStream();
    const ada = await createBuyer('Ada', 30000, 25000); // only 5,000 available

    const result = await bid(stream, ada, 10000);

    expect(result).toEqual({ ok: false, reason: 'insufficient_funds' });
    expect((await wallet(ada)).onHoldAmount).toBe(25000);
    expect((await productOf(stream)).currentBid).toBe(0);
  });

  it('rejects a bid that does not beat the current bid and releases its hold', async () => {
    const stream = await createStream();
    const ada = await createBuyer('Ada', 50000);
    const bola = await createBuyer('Bola', 50000);

    await bid(stream, ada, 10000);
    const result = await bid(stream, bola, 10000);

    expect(result).toMatchObject({ ok: false, reason: 'outbid', currentBid: 10000 });
    expect((await wallet(bola)).onHoldAmount).toBe(0);
    expect((await wallet(ada)).onHoldAmount).toBe(10000);
  });

  it('rejects bids when bidding is closed or the show is not live', async () => {
    const closed = await createStream({ bidStatus: 'ended' });
    const ada = await createBuyer('Ada', 50000);
    expect(await bid(closed, ada, 10000)).toMatchObject({ ok: false, reason: 'closed' });

    const ended = await createStream();
    await Stream.updateOne({ _id: ended._id }, { status: 'ended' });
    expect(await bid(ended, ada, 10000)).toMatchObject({ ok: false, reason: 'closed' });
    expect((await wallet(ada)).onHoldAmount).toBe(0);
  });

  it('keeps the highest bid when many bids arrive at the same moment', async () => {
    const stream = await createStream();
    const buyers = await Promise.all(
      Array.from({ length: 12 }, (_, i) => createBuyer(`Bidder${i}`, 1000000))
    );
    const amounts = buyers.map((_, i) => 10000 + i * 1000); // highest is 21,000

    // Fire every bid at once, in a shuffled order
    const order = buyers.map((b, i) => i).sort(() => Math.random() - 0.5);
    await Promise.all(order.map((i) => bid(stream, buyers[i], amounts[i])));

    const product = await productOf(stream);
    expect(product.currentBid).toBe(21000);
    expect(String(product.currentBidder._id)).toBe(String(buyers[11]._id));

    // Exactly one hold remains, on the winner, for the winning amount
    const holds = await Promise.all(buyers.map(wallet));
    const held = holds.map((w) => w.onHoldAmount);
    expect(held.filter((h) => h > 0)).toEqual([21000]);
    expect(held[11]).toBe(21000);
  });

  it('declares the winner when a bid reaches the maximum', async () => {
    const stream = await createStream();
    const ada = await createBuyer('Ada', 200000);

    const result = await bid(stream, ada, 100000);

    expect(result).toMatchObject({ ok: true, isWinner: true });
    const product = await productOf(stream);
    expect(product.bidStatus).toBe('ongoing');
    expect(product.bidWinner.bidAmount).toBe(100000);
    // Further bids are refused once won
    const bola = await createBuyer('Bola', 500000);
    expect(await bid(stream, bola, 120000)).toMatchObject({ ok: false, reason: 'closed' });
  });

  it('releases a hold exactly once', async () => {
    const stream = await createStream();
    const ada = await createBuyer('Ada', 50000, 3000); // 3,000 held elsewhere
    await bid(stream, ada, 10000);

    const first = await bids.releaseProductHold(stream._id, PRODUCT_ID.toString());
    const second = await bids.releaseProductHold(stream._id, PRODUCT_ID.toString());

    expect(first).toMatchObject({ amount: 10000 });
    expect(second).toBeNull();
    expect((await wallet(ada)).onHoldAmount).toBe(3000);
  });

  it('releases all holds when a show ends', async () => {
    const stream = await createStream();
    const ada = await createBuyer('Ada', 50000);
    await bid(stream, ada, 10000);

    expect(await bids.releaseAllHolds(stream._id)).toBe(1);
    expect((await wallet(ada)).onHoldAmount).toBe(0);
  });
});
