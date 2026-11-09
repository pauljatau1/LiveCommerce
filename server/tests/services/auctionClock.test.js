const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const Stream = require('@models/Stream');
require('@models/Buyer');
const { createClock, lengthFor } = require('@/services/auctionClock');

let mongoServer;
let t; // fake clock (ms)
let events;
let ended;
const productId = new mongoose.Types.ObjectId();

const makeClock = () => createClock({
  now: () => t,
  interval: 0, // tests call tick() themselves
  emit: (streamId, event, data) => events.push([event, data]),
  endAuction: async (streamId, pid) => {
    ended.push(pid);
    await Stream.updateOne({ _id: streamId, 'products.product.productId': String(pid) }, { $set: { 'products.$.bidStatus': 'ended' } });
  },
});

const liveShow = (extra = {}) => Stream.create({
  seller: new mongoose.Types.ObjectId(), title: 'Saturday drop', category: 'Women', channelName: 'c', status: 'live', type: 'auction',
  products: [{ product: { productId: String(productId), name: 'Ankara dress' }, minBid: 5000, maxBid: 500000, bidStatus: 'active', ...extra }],
});
const stored = async (show) => (await Stream.findById(show._id).lean()).products[0];
const lastUpdate = () => events.filter(([e]) => e === 'bid_timer_update').pop()?.[1];

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({ binary: { version: '7.0.3' } });
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  await mongoose.connect(mongoServer.getUri());
});
afterAll(async () => { await mongoose.disconnect(); await mongoServer.stop(); });
beforeEach(async () => { t = Date.parse('2026-11-14T19:00:00Z'); events = []; ended = []; await Stream.deleteMany({}); });

describe('auction length', () => {
  it("honours the seller's choice of 30s, 60s or 2 min, else 30s", async () => {
    expect([lengthFor(30), lengthFor(60), lengthFor(120), lengthFor(45), lengthFor(undefined)]).toEqual([30, 60, 120, 30, 30]);
    const show = await liveShow();
    const clock = makeClock();
    expect(await clock.start(show._id, productId, 60, 'Ankara dress')).toBe(60);
    const p = await stored(show);
    expect(p.auctionSeconds).toBe(60);
    expect(new Date(p.auctionEndsAt).getTime()).toBe(t + 60000);
    expect(lastUpdate()).toMatchObject({ secondsLeft: 60, productId: String(productId) });
  });
});

describe('late bids', () => {
  it('a bid in the last 5 seconds resets the timer to 5 seconds and says so on bid_timer_update', async () => {
    const show = await liveShow();
    const clock = makeClock();
    await clock.start(show._id, productId, 30);
    t += 27000; // 3s left
    expect(await clock.onBid(show._id, productId)).toBe(true);
    expect(new Date((await stored(show)).auctionEndsAt).getTime()).toBe(t + 5000);
    expect(lastUpdate()).toMatchObject({ secondsLeft: 5, extended: true, reason: 'late_bid' });
  });

  it('an earlier bid leaves the timer alone', async () => {
    const show = await liveShow();
    const clock = makeClock();
    await clock.start(show._id, productId, 30);
    t += 10000; // 20s left
    expect(await clock.onBid(show._id, productId)).toBe(false);
    expect(new Date((await stored(show)).auctionEndsAt).getTime()).toBe(t + 20000);
  });

  it('the auction ends only after the extended time, exactly once', async () => {
    const show = await liveShow();
    const clock = makeClock();
    await clock.start(show._id, productId, 30);
    t += 29000;
    await clock.onBid(show._id, productId); // ends at t+5s now
    t += 2000;
    await clock.tick();
    expect(ended).toEqual([]);
    expect(lastUpdate().secondsLeft).toBe(3);
    t += 3000;
    await Promise.all([clock.tick(), clock.tick()]);
    expect(ended).toEqual([String(productId)]);
    expect(events.some(([e]) => e === 'bid_timer_complete')).toBe(true);
    await clock.tick();
    expect(ended).toHaveLength(1);
  });
});

describe('seller adds time', () => {
  it('+30s pushes the end back 30 seconds', async () => {
    const show = await liveShow();
    const clock = makeClock();
    await clock.start(show._id, productId, 30);
    t += 20000; // 10s left
    expect(await clock.addTime(show._id, productId, 30)).toBe(40);
    expect(lastUpdate()).toMatchObject({ secondsLeft: 40, extended: true, reason: 'seller' });
  });

  it('says so when the auction is no longer running', async () => {
    const show = await liveShow({ bidStatus: 'ended' });
    expect(await makeClock().addTime(show._id, productId, 30)).toBeNull();
  });
});

describe('server restart', () => {
  it('a new clock picks up a running auction from the database and finishes it', async () => {
    const show = await liveShow();
    await makeClock().start(show._id, productId, 60); // the old process
    t += 20000;
    const afterRestart = makeClock();
    expect(await afterRestart.recover()).toBe(1);
    expect(lastUpdate()).toMatchObject({ secondsLeft: 40, recovered: true });
    t += 40000;
    await afterRestart.tick();
    expect(ended).toEqual([String(productId)]);
  });

  it('an auction that ran out while the server was down gets 10 seconds, not an instant end', async () => {
    const show = await liveShow({ auctionEndsAt: new Date(t - 5000) });
    const clock = makeClock();
    expect(await clock.recover()).toBe(1);
    expect(new Date((await stored(show)).auctionEndsAt).getTime()).toBe(t + 10000);
    await clock.tick();
    expect(ended).toEqual([]);
  });

  it('ignores auctions that already ended', async () => {
    await liveShow({ bidStatus: 'ended', auctionEndsAt: new Date(t + 5000) });
    expect(await makeClock().recover()).toBe(0);
  });

  it('stops counting when the auction is ended some other way', async () => {
    const show = await liveShow();
    const clock = makeClock();
    await clock.start(show._id, productId, 30);
    await Stream.updateOne({ _id: show._id }, { $set: { 'products.0.bidStatus': 'ended' } });
    clock.stop(String(show._id), String(productId));
    t += 31000;
    await clock.tick();
    expect(ended).toEqual([]);
    expect(clock.running.size).toBe(0);
  });
});
