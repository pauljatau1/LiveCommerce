// The live-auction clock.
//
// Each running auction's end time is stored on the stream product
// (products.auctionEndsAt), so the timer survives a server restart: on boot,
// recover() reloads every running auction. One ticker emits the time left
// each second on the existing `bid_timer_update` socket event and ends the
// auction (endProductBidding, which closes it atomically) when time is up.
//
// Late bids: any bid in the last LATE_BID_SECONDS resets the clock to
// LATE_BID_SECONDS. The seller can add time (+30s). Lengths: 30s, 60s, 2 min.

const mongoose = require('mongoose');

const LENGTHS = [30, 60, 120];
const DEFAULT_SECONDS = 30;
const LATE_BID_SECONDS = 5;
// After a restart, an auction with less than this left gets this much, so
// bidders who were cut off by the restart get a fair last chance.
const RECOVERY_SECONDS = 10;

const Stream = () => mongoose.model('Stream');
const idMatch = (productId) => require('./streamBidService').productIdMatch(productId);
const key = (streamId, productId) => `${streamId}:${productId}`;

const lengthFor = (seconds) => (LENGTHS.includes(Number(seconds)) ? Number(seconds) : DEFAULT_SECONDS);

const createClock = ({ now = () => Date.now(), emit, endAuction, interval = 1000 } = {}) => {
  const running = new Map(); // key -> { streamId, productId, endsAt (ms), productName }
  let ticker = null;
  const ending = new Set();

  const secondsLeft = (c) => Math.max(0, Math.ceil((c.endsAt - now()) / 1000));

  const emitUpdate = (c, extra = {}) => {
    if (!emit) return;
    const left = secondsLeft(c);
    emit(c.streamId, 'bid_timer_update', {
      streamId: c.streamId,
      productId: c.productId,
      productName: c.productName,
      secondsLeft: left,
      formattedTime: `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`,
      endsAt: new Date(c.endsAt),
      timestamp: new Date(now()),
      ...extra,
    });
  };

  const ensureTicker = () => {
    if (ticker || !interval) return;
    ticker = setInterval(() => { tick().catch((e) => console.error('[auction-clock] tick', e.message)); }, interval);
    if (ticker.unref) ticker.unref();
  };

  const stopTickerIfIdle = () => {
    if (ticker && running.size === 0) { clearInterval(ticker); ticker = null; }
  };

  const track = (streamId, productId, endsAt, productName) => {
    const c = { streamId: String(streamId), productId: String(productId), endsAt: new Date(endsAt).getTime(), productName };
    running.set(key(c.streamId, c.productId), c);
    ensureTicker();
    return c;
  };

  // Start (or restart) an auction's clock. Returns seconds.
  const start = async (streamId, productId, seconds, productName) => {
    const length = lengthFor(seconds);
    const endsAt = new Date(now() + length * 1000);
    await Stream().updateOne(
      { _id: streamId, products: { $elemMatch: { 'product.productId': idMatch(productId) } } },
      { $set: { 'products.$.auctionEndsAt': endsAt, 'products.$.auctionSeconds': length } }
    );
    emitUpdate(track(streamId, productId, endsAt, productName));
    return length;
  };

  // A bid landed. In the last LATE_BID_SECONDS it resets the clock to that. Atomic: only
  // moves the end time later, and only while bidding is open.
  const onBid = async (streamId, productId) => {
    const resetTo = new Date(now() + LATE_BID_SECONDS * 1000);
    const res = await Stream().updateOne(
      {
        _id: streamId,
        products: { $elemMatch: { 'product.productId': idMatch(productId), bidStatus: 'active', auctionEndsAt: { $lt: resetTo } } },
      },
      { $set: { 'products.$.auctionEndsAt': resetTo } }
    );
    if (res.modifiedCount !== 1) return false;
    const c = running.get(key(streamId, productId)) || track(streamId, productId, resetTo);
    c.endsAt = resetTo.getTime();
    emitUpdate(c, { extended: true, reason: 'late_bid' });
    return true;
  };

  // The seller adds time (+30s). Counts from now if the clock already ran out.
  const addTime = async (streamId, productId, seconds = 30) => {
    const add = Math.min(Math.max(Number(seconds) || 30, 5), 120);
    const stream = await Stream().findOne(
      { _id: streamId, products: { $elemMatch: { 'product.productId': idMatch(productId), bidStatus: 'active' } } },
      { 'products.$': 1 }
    ).lean();
    const p = stream?.products?.[0];
    if (!p) return null;
    const base = Math.max(now(), p.auctionEndsAt ? new Date(p.auctionEndsAt).getTime() : now());
    const endsAt = new Date(base + add * 1000);
    await Stream().updateOne(
      { _id: streamId, products: { $elemMatch: { 'product.productId': idMatch(productId), bidStatus: 'active' } } },
      { $set: { 'products.$.auctionEndsAt': endsAt } }
    );
    const c = running.get(key(streamId, productId)) || track(streamId, productId, endsAt, p.product?.name);
    c.endsAt = endsAt.getTime();
    emitUpdate(c, { extended: true, reason: 'seller', added: add });
    return Math.ceil((c.endsAt - now()) / 1000);
  };

  // Ended some other way (sold now, maxBid reached, show ended): stop counting.
  const stop = (streamId, productId) => {
    running.delete(key(streamId, productId));
    stopTickerIfIdle();
  };

  const finish = async (c) => {
    const k = key(c.streamId, c.productId);
    if (ending.has(k)) return;
    ending.add(k);
    try {
      // Re-read the stored end time: a late bid may have moved it
      const stream = await Stream().findOne(
        { _id: c.streamId, products: { $elemMatch: { 'product.productId': idMatch(c.productId) } } },
        { 'products.$': 1, status: 1 }
      ).lean();
      const p = stream?.products?.[0];
      if (!p || p.bidStatus !== 'active') { running.delete(k); return; }
      const storedEnd = p.auctionEndsAt ? new Date(p.auctionEndsAt).getTime() : c.endsAt;
      if (storedEnd > now()) { c.endsAt = storedEnd; return; }
      running.delete(k);
      if (emit) emit(c.streamId, 'bid_timer_complete', { streamId: c.streamId, productId: c.productId, productName: c.productName, timestamp: new Date(now()) });
      if (endAuction) await endAuction(c.streamId, c.productId);
    } finally {
      ending.delete(k);
      stopTickerIfIdle();
    }
  };

  const tick = async () => {
    const due = [];
    running.forEach((c) => {
      if (secondsLeft(c) <= 0) due.push(c);
      else emitUpdate(c);
    });
    await Promise.all(due.map(finish));
  };

  // After a restart: pick up every auction that was running.
  const recover = async () => {
    const streams = await Stream().find(
      { status: 'live', type: 'auction', products: { $elemMatch: { bidStatus: 'active', auctionEndsAt: { $ne: null } } } },
      { products: 1 }
    ).lean();
    let count = 0;
    for (const s of streams) {
      for (const p of s.products || []) {
        if (p.bidStatus !== 'active' || !p.auctionEndsAt) continue;
        const productId = String(p.product?.productId || '');
        if (!productId) continue;
        let endsAt = new Date(p.auctionEndsAt);
        if (endsAt.getTime() - now() < RECOVERY_SECONDS * 1000) {
          endsAt = new Date(now() + RECOVERY_SECONDS * 1000);
          await Stream().updateOne(
            { _id: s._id, products: { $elemMatch: { 'product.productId': idMatch(productId), bidStatus: 'active' } } },
            { $set: { 'products.$.auctionEndsAt': endsAt } }
          );
        }
        emitUpdate(track(s._id, productId, endsAt, p.product?.name), { recovered: true });
        count += 1;
      }
    }
    return count;
  };

  const shutdown = () => { if (ticker) clearInterval(ticker); ticker = null; running.clear(); };

  return { start, onBid, addTime, stop, tick, recover, shutdown, running, secondsLeft };
};

// The app-wide clock: emits through socket.io and ends auctions via the controller.
let shared = null;
const clock = () => {
  if (shared) return shared;
  shared = createClock({
    emit: (streamId, event, data) => {
      const io = require('../socket/socketManager').getIO();
      if (io) io.to(`stream_notifications_${streamId}`).emit(event, data);
    },
    endAuction: async (streamId, productId) => {
      const io = require('../socket/socketManager').getIO();
      const streamController = require('../controllers/streamController');
      const stream = await Stream().findById(streamId).select('seller').lean();
      const req = { params: { streamId }, body: { productId, sellerId: String(stream?.seller || '') }, app: { get: (n) => (n === 'io' ? io : null) }, user: { id: String(stream?.seller || '') }, get: () => null };
      const res = { status(code) { this.statusCode = code; return this; }, json(data) { this.data = data; return this; } };
      await streamController.endProductBidding(req, res);
      if (res.statusCode && res.statusCode >= 400 && res.statusCode !== 400) console.error('[auction-clock] end failed', res.statusCode, res.data?.message);
    },
  });
  return shared;
};

module.exports = { createClock, clock, lengthFor, LENGTHS, LATE_BID_SECONDS, RECOVERY_SECONDS };
