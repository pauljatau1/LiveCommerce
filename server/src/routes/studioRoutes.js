// Seller studio (new design): one endpoint per screen, shaped for the UI.
// Mounted at /api/v2/studio. Sellers only; every query is scoped to req.user.id.
const express = require('express');
const mongoose = require('mongoose');
const { verifyToken, isSeller } = require('../middlewares/authMiddleware');
// Make sure every model used below is registered
require('../models/Seller'); require('../models/Product'); require('../models/Stream'); require('../models/Order');
require('../models/ShowDelivery'); require('../models/Transaction'); require('../models/Withdrawal'); require('../models/Buyer');

const router = express.Router();
const model = (name) => mongoose.model(name);
const oid = (id) => new mongoose.Types.ObjectId(String(id));
const validId = (req, res, next) => (mongoose.Types.ObjectId.isValid(req.params.id) ? next() : res.status(404).json({ success: false, message: 'Not found' }));
const fail = (res, error) => {
  console.error('[studio]', error.message);
  res.status(error.status || 500).json({ success: false, message: error.status || process.env.NODE_ENV === 'test' ? error.message : 'Something went wrong' });
};

router.use(verifyToken, isSeller);

const productIdOf = (p) => String(p?.product?.productId || p?.product?._id || p?.product || '');
const image = (p) => p?.images?.find((i) => i.isDefault)?.url || p?.images?.[0]?.url || null;
const productCard = (p, showIds = new Set()) => ({
  _id: p._id,
  name: p.name,
  price: p.price,
  stock: p.stock ?? 0,
  image: image(p),
  status: p.status === 'draft' ? 'hidden' : (p.stock ?? 0) <= 0 ? 'sold_out' : showIds.has(String(p._id)) ? 'in_show' : 'active',
  category: p.category,
  createdAt: p.createdAt,
});

// Product ids that sit in a scheduled or live show
const productsInShows = async (sellerId) => {
  const shows = await model('Stream').find(
    { seller: oid(sellerId), status: { $in: ['scheduled', 'live'] }, $or: [{ status: 'live' }, { scheduledStartTime: { $gt: new Date(Date.now() - 6 * 3600 * 1000) } }] },
    { products: 1 }
  ).lean();
  return new Set(shows.flatMap((s) => (s.products || []).map(productIdOf)).filter(Boolean));
};

const showCard = (s) => ({
  _id: s._id,
  title: s.title,
  type: s.type === 'open_show' ? 'drop' : 'auction',
  status: s.status,
  scheduledStartTime: s.scheduledStartTime,
  actualStartTime: s.actualStartTime,
  endTime: s.endTime,
  coverImage: s.coverImage?.url || null,
  itemCount: (s.products || []).length,
  images: (s.products || []).map((p) => p.product?.images?.[0]?.url || p.product?.image || null).filter(Boolean).slice(0, 6),
  link: s.streamLink || null,
});

// Money: what's withdrawable now, and what's still waiting on delivery
const moneySummary = async (sellerId) => {
  const seller = await model('Seller').findById(sellerId, { walletBalance: 1, bankDetails: 1, isBankVerified: 1 }).lean();
  const [pendingWithdrawals] = await model('Withdrawal').aggregate([
    { $match: { seller: oid(sellerId), status: { $in: ['pending', 'processing'] } } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const [onTheWay] = await model('Order').aggregate([
    { $match: { seller: oid(sellerId), paid: true, isOpen: { $ne: false }, status: { $nin: ['cancelled', 'refunded'] } } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } },
  ]);
  const wallet = Math.max(0, seller?.walletBalance || 0);
  const requested = pendingWithdrawals?.total || 0;
  const b = seller?.bankDetails || {};
  return {
    ready: Math.max(0, wallet - requested),
    requested,
    pending: onTheWay?.total || 0,
    bank: b.accountNumber ? { bankName: b.bankName, last4: String(b.accountNumber).slice(-4), accountName: b.accountName, verified: seller.isBankVerified !== false } : null,
  };
};

// ---- Home ----
router.get('/home', async (req, res) => {
  try {
    const sellerId = req.user.id;
    const [seller, upcoming, lastEnded, recent, inShows, money, toShip, productCount] = await Promise.all([
      model('Seller').findById(sellerId, { firstName: 1, storeName: 1, storeAvatar: 1 }).lean(),
      model('Stream').find({ seller: oid(sellerId), $or: [{ status: 'live' }, { status: 'scheduled', scheduledStartTime: { $gt: new Date(Date.now() - 6 * 3600 * 1000) } }] })
        .sort({ status: 1, scheduledStartTime: 1 }).limit(3).lean(),
      model('Stream').findOne({ seller: oid(sellerId), status: 'ended' }).sort({ endTime: -1, updatedAt: -1 }).lean(),
      model('Product').find({ seller: oid(sellerId), status: { $ne: 'offline_auction' } }, { name: 1, price: 1, stock: 1, images: 1, status: 1, category: 1, createdAt: 1 })
        .sort({ createdAt: -1 }).limit(8).lean(),
      productsInShows(sellerId),
      moneySummary(sellerId),
      model('ShowDelivery').countDocuments({ seller: oid(sellerId), status: 'paid' }),
      model('Product').countDocuments({ seller: oid(sellerId), status: 'active', stock: { $gt: 0 } }),
    ]);
    const live = upcoming.find((s) => s.status === 'live');
    const next = live || upcoming[0] || null;
    const readyForShow = recent.filter((p) => p.status === 'active' && (p.stock ?? 0) > 0 && !inShows.has(String(p._id))).length;
    res.json({
      success: true,
      seller: { firstName: seller?.firstName, storeName: seller?.storeName, avatar: seller?.storeAvatar?.url || null },
      nextShow: next ? showCard(next) : null,
      lastShow: lastEnded ? { ...showCard(lastEnded), sold: (lastEnded.orders || []).length } : null,
      recent: recent.map((p) => productCard(p, inShows)),
      productCount,
      readyForShow,
      toShip,
      money,
    });
  } catch (e) { fail(res, e); }
});

// ---- Products ----
router.get('/products', async (req, res) => {
  try {
    const sellerId = req.user.id;
    const [all, inShows] = await Promise.all([
      model('Product').find({ seller: oid(sellerId), status: { $ne: 'offline_auction' } }, { name: 1, price: 1, stock: 1, images: 1, status: 1, category: 1, createdAt: 1 })
        .sort({ createdAt: -1 }).limit(300).lean(),
      productsInShows(sellerId),
    ]);
    const cards = all.map((p) => productCard(p, inShows));
    const counts = {
      all: cards.length,
      ready: cards.filter((c) => c.status === 'active').length,
      in_show: cards.filter((c) => c.status === 'in_show').length,
      sold_out: cards.filter((c) => c.status === 'sold_out').length,
      hidden: cards.filter((c) => c.status === 'hidden').length,
    };
    res.json({ success: true, products: cards, counts });
  } catch (e) { fail(res, e); }
});

router.get('/products/:id', validId, async (req, res) => {
  try {
    const p = await model('Product').findOne({ _id: req.params.id, seller: oid(req.user.id) }).lean();
    if (!p) return res.status(404).json({ success: false, message: 'Product not found' });
    const shows = await model('Stream').find({ seller: oid(req.user.id), 'products.product.productId': String(p._id) }, { title: 1, status: 1, scheduledStartTime: 1, type: 1 })
      .sort({ scheduledStartTime: -1 }).limit(5).lean();
    const inShows = new Set(shows.filter((s) => ['scheduled', 'live'].includes(s.status)).map(() => String(p._id)));
    res.json({
      success: true,
      product: {
        ...productCard(p, inShows),
        description: p.description,
        condition: p.condition,
        brand: p.brand,
        subCategory: p.subCategory,
        authenticity: p.authenticity,
        images: (p.images || []).map((i) => i.url).filter(Boolean),
        weightKg: p.shippingInfo?.weight?.value || p.weight || null,
        views: p.stats?.views || 0,
        sold: p.stats?.soldCount || 0,
        auction: p.auction || null,
      },
      shows: shows.map((s) => ({ _id: s._id, title: s.title, status: s.status, scheduledStartTime: s.scheduledStartTime })),
    });
  } catch (e) { fail(res, e); }
});

// Quick edits from the product screen: price, stock, show/hide
router.patch('/products/:id', validId, async (req, res) => {
  try {
    const set = {};
    const { price, stock, hidden } = req.body || {};
    if (price !== undefined) {
      const n = Math.round(Number(price));
      if (!Number.isFinite(n) || n < 100) return res.status(400).json({ success: false, message: 'Price must be at least ₦100' });
      set.price = n;
    }
    if (stock !== undefined) {
      const n = Math.round(Number(stock));
      if (!Number.isFinite(n) || n < 0 || n > 9999) return res.status(400).json({ success: false, message: 'Stock must be between 0 and 9,999' });
      set.stock = n;
    }
    if (hidden !== undefined) set.status = hidden ? 'draft' : 'active';
    if (!Object.keys(set).length) return res.status(400).json({ success: false, message: 'Nothing to change' });
    // Raw collection update: skips legacy save hooks that expect the full product form
    const done = await model('Product').collection.findOneAndUpdate(
      { _id: oid(req.params.id), seller: oid(req.user.id) },
      { $set: { ...set, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    const p = done?.value || done;
    if (!p || !p._id) return res.status(404).json({ success: false, message: 'Product not found' });
    const inShows = await productsInShows(req.user.id);
    res.json({ success: true, product: productCard(p, inShows) });
  } catch (e) { fail(res, e); }
});

// ---- Shows ----
router.get('/shows', async (req, res) => {
  try {
    const sellerId = oid(req.user.id);
    const ended = req.query.status === 'ended';
    const filter = ended
      ? { seller: sellerId, status: 'ended' }
      : { seller: sellerId, $or: [{ status: 'live' }, { status: 'scheduled', scheduledStartTime: { $gt: new Date(Date.now() - 6 * 3600 * 1000) } }] };
    const shows = await model('Stream').find(filter).sort(ended ? { endTime: -1 } : { scheduledStartTime: 1 }).limit(30).lean();
    res.json({ success: true, shows: shows.map((s) => ({ ...showCard(s), sold: (s.orders || []).length })) });
  } catch (e) { fail(res, e); }
});

// One show with each item's live state: used by Go Live and the live studio
router.get('/shows/:id', validId, async (req, res) => {
  try {
    const s = await model('Stream').findOne({ _id: req.params.id, seller: oid(req.user.id) }).lean();
    if (!s) return res.status(404).json({ success: false, message: 'Show not found' });
    const ids = (s.products || []).map(productIdOf).filter((id) => mongoose.Types.ObjectId.isValid(id));
    const products = await model('Product').find({ _id: { $in: ids.map(oid) } }, { name: 1, images: 1, price: 1, stock: 1, category: 1 }).lean();
    const byId = new Map(products.map((p) => [String(p._id), p]));
    const bidderIds = (s.products || []).map((p) => p.currentBidder?._id || p.currentBidder || p.bidWinner?.buyer?._id || p.bidWinner?.buyer).filter((id) => id && mongoose.Types.ObjectId.isValid(String(id)));
    const bidders = bidderIds.length ? await model('Buyer').find({ _id: { $in: bidderIds.map((id) => oid(id)) } }, { firstName: 1, username: 1 }).lean() : [];
    const nameOf = (id) => { const b = bidders.find((x) => String(x._id) === String(id?._id || id)); return b ? (b.firstName || `@${b.username}`) : null; };
    const soldBy = (s.orders || []).reduce((m, o) => { const k = String(o.product); m[k] = m[k] || { count: 0, amount: 0 }; m[k].count += o.orderDetails?.items?.[0]?.quantity || 1; m[k].amount += o.orderDetails?.totalAmount || o.amount || 0; return m; }, {});
    const items = (s.products || []).map((sp) => {
      const id = productIdOf(sp);
      const p = byId.get(id) || {};
      return {
        productId: id,
        name: p.name || sp.product?.name || 'Item',
        image: image(p) || sp.product?.images?.[0]?.url || null,
        price: p.price ?? sp.product?.price ?? 0,
        stock: p.stock ?? 0,
        minBid: sp.minBid || 0,
        bidStatus: sp.bidStatus || 'pending',
        auctionSeconds: sp.auctionSeconds || 30,
        auctionEndsAt: sp.auctionEndsAt || null,
        isVisible: Boolean(sp.isVisible),
        currentBid: sp.currentBid || 0,
        currentBidder: nameOf(sp.currentBidder),
        winner: sp.bidWinner?.bidAmount ? { name: nameOf(sp.bidWinner.buyer), amount: sp.bidWinner.bidAmount } : null,
        sold: soldBy[id]?.count || 0,
        soldAmount: soldBy[id]?.amount || 0,
      };
    });
    res.json({
      success: true,
      show: { ...showCard(s), description: s.description, viewers: (s.viewers || []).length, notes: s.showNotes && !require('../services/showNotes').isEmpty(s.showNotes) ? s.showNotes : null },
      items,
      sales: { count: (s.orders || []).length, amount: (s.orders || []).reduce((n, o) => n + (o.orderDetails?.totalAmount || 0), 0) },
    });
  } catch (e) { fail(res, e); }
});

// After a show: what sold, to whom, what didn't, and what to do next
router.get('/shows/:id/recap', validId, async (req, res) => {
  try {
    const s = await model('Stream').findOne({ _id: req.params.id, seller: oid(req.user.id) }).lean();
    if (!s) return res.status(404).json({ success: false, message: 'Show not found' });
    const deliveries = await model('ShowDelivery').find({ stream: s._id }).populate('buyer', 'firstName username shippingAddresses').lean();
    const buyerName = (b) => b?.firstName || (b?.username ? `@${b.username}` : 'A buyer');
    const area = (b) => { const a = b?.shippingAddresses?.[0]; return a ? [a.state, a.city].filter(Boolean).join(' · ') : ''; };
    const sold = deliveries.flatMap((d) => d.items.map((i) => ({
      name: i.name, image: i.image, quantity: i.quantity || 1, amount: i.unitPrice * (i.quantity || 1), buyer: buyerName(d.buyer), area: area(d.buyer), delivery: d.status,
    })));
    // Shows from before deliveries existed: fall back to the show's own order list
    if (!sold.length) {
      for (const o of s.orders || []) {
        const items = o.orderDetails?.items || [];
        for (const i of items) sold.push({ name: i.productName, image: i.productImages?.[0]?.url || null, quantity: i.quantity || 1, amount: (i.price || 0) * (i.quantity || 1), buyer: o.orderDetails?.buyer?.firstName || 'A buyer', area: '', delivery: null });
      }
    }
    const soldIds = new Set((s.orders || []).map((o) => String(o.product)));
    const unsoldIds = (s.products || []).map(productIdOf).filter((id) => id && !soldIds.has(id) && mongoose.Types.ObjectId.isValid(id));
    const unsold = unsoldIds.length
      ? (await model('Product').find({ _id: { $in: unsoldIds.map(oid) } }, { name: 1, images: 1, price: 1, stock: 1 }).lean()).map((p) => ({ _id: p._id, name: p.name, image: image(p), stock: p.stock ?? 0 }))
      : [];
    const started = s.actualStartTime || s.scheduledStartTime;
    res.json({
      success: true,
      show: showCard(s),
      earned: sold.reduce((n, i) => n + i.amount, 0),
      itemsSold: sold.reduce((n, i) => n + i.quantity, 0),
      buyers: new Set(deliveries.map((d) => String(d.buyer?._id))).size || new Set((s.orders || []).map((o) => String(o.buyer))).size,
      viewers: new Set([...(s.viewers || []).map(String), ...(s.departedViewers || []).map((v) => String(v.buyer))]).size,
      bids: (s.bids || []).length,
      minutes: started && s.endTime ? Math.max(1, Math.round((new Date(s.endTime) - new Date(started)) / 60000)) : null,
      sold,
      unsold,
      deliveries: {
        pricing: deliveries.filter((d) => ['collecting', 'quote_failed'].includes(d.status)).length,
        awaitingPayment: deliveries.filter((d) => d.status === 'awaiting_payment').length,
        toBook: deliveries.filter((d) => d.status === 'paid').length,
        booked: deliveries.filter((d) => ['booked', 'in_transit', 'delivered'].includes(d.status)).length,
      },
    });
  } catch (e) { fail(res, e); }
});

// ---- Money ----
// ---------- Show notes (services/showNotes.js) ----------
const showNotes = require('../services/showNotes');
const roomOf = (id) => `stream_notifications_${id}`;

// GET /api/v2/studio/show-notes/default → the notes the seller reuses for new shows
router.get('/show-notes/default', async (req, res) => {
  try {
    const seller = await model('Seller').findById(req.user.id).select('defaultShowNotes').lean();
    const notes = seller?.defaultShowNotes;
    res.json({ success: true, notes: notes && !showNotes.isEmpty(notes) ? showNotes.normalise(notes) : null });
  } catch (error) { fail(res, error); }
});

// POST /api/v2/studio/show-notes/draft { title, type, items:[{name, price}], auctionSeconds } → AI draft (or a plain one)
router.post('/show-notes/draft', async (req, res) => {
  try {
    const seller = await model('Seller').findById(req.user.id).select('storeName firstName businessAddress warehouseDetails sellerAddress').lean();
    const a = seller?.warehouseDetails?.address?.city ? seller.warehouseDetails.address : seller?.businessAddress?.city ? seller.businessAddress : seller?.sellerAddress || {};
    const out = await showNotes.draft({
      title: req.body?.title,
      type: req.body?.type === 'drop' ? 'drop' : 'auction',
      items: Array.isArray(req.body?.items) ? req.body.items : [],
      auctionSeconds: Number(req.body?.auctionSeconds) || 30,
      deliveryDeposit: require('../services/deliveryService').depositAmount(),
      hostName: seller?.firstName || seller?.storeName,
      pickupArea: [a.city, a.state].filter(Boolean).join(', '),
    });
    res.json({ success: true, ...out, maxChars: showNotes.MAX_CHARS, sections: showNotes.SECTIONS });
  } catch (error) { fail(res, error); }
});

// PUT /api/v2/studio/shows/:id/notes { notes, saveAsDefault } → pin (or update) the notes on my show
router.put('/shows/:id/notes', validId, async (req, res) => {
  try {
    const notes = showNotes.normalise(req.body?.notes || {});
    const show = await model('Stream').findOneAndUpdate(
      { _id: oid(req.params.id), seller: oid(req.user.id), status: { $in: ['scheduled', 'live'] } },
      { $set: { showNotes: { ...notes, updatedAt: new Date() } } },
      { new: true, projection: { showNotes: 1, status: 1 } }
    ).lean();
    if (!show) return res.status(404).json({ success: false, message: "You can only change notes on a show that hasn't ended." });
    const seller = await model('Seller').findById(req.user.id).select('storeName firstName').lean();
    if (req.body?.saveAsDefault) await model('Seller').updateOne({ _id: oid(req.user.id) }, { $set: { defaultShowNotes: notes } });
    if (show.status === 'live') {
      const io = require('../socket/socketManager').getIO();
      const name = seller?.firstName || seller?.storeName || 'The host';
      const line = { id: `notes-${Date.now()}`, type: 'notes_updated', user: seller?.storeName || 'Host', content: `${name} updated the show notes`, data: { streamId: String(show._id), message: `${name} updated the show notes` }, timestamp: new Date() };
      await model('Stream').updateOne({ _id: show._id }, { $push: { chatInteractions: line } });
      if (io) {
        io.to(roomOf(show._id)).emit('show_notes_updated', { streamId: String(show._id), notes: show.showNotes, firstLine: showNotes.firstLine(show.showNotes) });
        io.to(roomOf(show._id)).emit('stream_notification', line);
      }
      showNotes.suggester.reset(String(show._id));
    }
    res.json({ success: true, notes: show.showNotes, firstLine: showNotes.firstLine(show.showNotes) });
  } catch (error) { fail(res, error); }
});

// DELETE /api/v2/studio/shows/:id/notes → unpin
router.delete('/shows/:id/notes', validId, async (req, res) => {
  try {
    const show = await model('Stream').findOneAndUpdate(
      { _id: oid(req.params.id), seller: oid(req.user.id), status: { $in: ['scheduled', 'live'] } },
      { $unset: { showNotes: 1 } },
      { projection: { _id: 1, status: 1 } }
    ).lean();
    if (!show) return res.status(404).json({ success: false, message: "You can only change notes on a show that hasn't ended." });
    const io = require('../socket/socketManager').getIO();
    if (io && show.status === 'live') io.to(roomOf(show._id)).emit('show_notes_updated', { streamId: String(show._id), notes: null, firstLine: '' });
    res.json({ success: true, notes: null });
  } catch (error) { fail(res, error); }
});

// POST /api/v2/studio/shows/:id/auction/time { productId, seconds = 30 } → "+30s" on the running auction
router.post('/shows/:id/auction/time', validId, async (req, res) => {
  try {
    const productId = String(req.body?.productId || '');
    if (!productId) return res.status(400).json({ success: false, message: 'Which item? Pick the one being auctioned.' });
    const show = await model('Stream').findOne({ _id: oid(req.params.id), seller: oid(req.user.id), status: 'live' }, { _id: 1 }).lean();
    if (!show) return res.status(404).json({ success: false, message: "This show isn't live." });
    const secondsLeft = await require('../services/auctionClock').clock().addTime(String(show._id), productId, req.body?.seconds || 30);
    if (secondsLeft === null) return res.status(409).json({ success: false, message: 'That auction has already ended.' });
    res.json({ success: true, secondsLeft });
  } catch (error) { fail(res, error); }
});

router.get('/money', async (req, res) => {
  try {
    const sellerId = oid(req.user.id);
    const [summary, txns, withdrawals] = await Promise.all([
      moneySummary(req.user.id),
      model('Transaction').find({ seller: sellerId }).sort({ createdAt: -1 }).limit(30).lean(),
      model('Withdrawal').find({ seller: sellerId }).sort({ createdAt: -1 }).limit(10).lean(),
    ]);
    const LABEL = { order_payment: 'Sale', platform_fee: 'Platform fee', processing_fee: 'Payment fee', withdrawal: 'Withdrawal', referral_reward: 'Referral reward' };
    const activity = [
      ...txns.filter((t) => t.type !== 'withdrawal').map((t) => ({
        _id: t._id,
        kind: t.type === 'order_payment' || t.type === 'referral_reward' ? 'in' : 'fee',
        label: LABEL[t.type] || 'Transaction',
        detail: t.description || t.metadata?.productName || '',
        amount: Math.abs(t.amount || 0),
        date: t.createdAt,
      })),
      ...withdrawals.map((w) => ({
        _id: w._id,
        kind: 'out',
        label: `Withdrawal to ${w.bankDetails?.bankName || 'bank'}`,
        detail: w.status === 'completed' ? 'Sent' : w.status === 'pending' || w.status === 'processing' ? 'Processing' : w.status[0].toUpperCase() + w.status.slice(1),
        amount: w.amount,
        date: w.createdAt || w.requestDate,
      })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 30);
    res.json({ success: true, ...summary, activity });
  } catch (e) { fail(res, e); }
});

router.post('/withdraw', async (req, res) => {
  try {
    const amount = Math.floor(Number(req.body?.amount));
    const seller = await model('Seller').findById(req.user.id, { bankDetails: 1, isBankVerified: 1 }).lean();
    const b = seller?.bankDetails || {};
    if (!b.accountNumber || !b.bankName || !b.accountName || !b.bankIdentifierCode) return res.status(400).json({ success: false, message: 'Add your bank account first' });
    if (seller.isBankVerified === false) return res.status(400).json({ success: false, message: 'Your bank account needs verifying first' });
    if (!Number.isFinite(amount) || amount < 1000) return res.status(400).json({ success: false, message: 'The smallest withdrawal is ₦1,000' });
    const { ready } = await moneySummary(req.user.id);
    if (amount > ready) return res.status(400).json({ success: false, message: `You can withdraw up to ₦${ready.toLocaleString('en-NG')}` });
    const Withdrawal = model('Withdrawal');
    const w = await Withdrawal.create({
      seller: oid(req.user.id),
      amount,
      bankDetails: { bankName: b.bankName, accountNumber: b.accountNumber, accountName: b.accountName, bankIdentifierCode: b.bankIdentifierCode },
      notes: [{ content: 'Withdrawal requested in the studio', addedBy: 'seller' }],
    });
    res.json({ success: true, withdrawal: { _id: w._id, amount: w.amount, status: w.status, reference: w.reference } });
  } catch (e) { fail(res, e); }
});

module.exports = router;
