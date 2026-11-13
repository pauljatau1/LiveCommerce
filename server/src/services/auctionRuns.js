// Auction runs. An auction item with more than one in stock can be auctioned
// again after a run ends ("Run again · N left"). Each run sells one unit: stock
// comes down by one per sale in auctionOrderService (atomically, with the
// order); an unsold run doesn't touch stock. Before each run the seller can add
// a short note in their own words ("Red, size M"), shown to buyers and saved on
// the order. There are no size or colour fields.

const mongoose = require('mongoose');
const chatSafety = require('./chatSafety');
const { productIdMatch } = require('./streamBidService');

const NOTE_MAX = 40;
const LENGTHS = [30, 60, 120];

class RunError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

const cleanNote = (note) => {
  const text = String(note || '').replace(/\s+/g, ' ').trim();
  if (text.length > NOTE_MAX) throw new RunError(400, `Keep the note to ${NOTE_MAX} characters.`);
  if (text && chatSafety.check(text).hide) throw new RunError(400, 'Notes can’t include phone numbers, account numbers or links.');
  return text;
};

/**
 * Set up the next run of an auction item on the seller's live show.
 * - Not run yet: saves the note / starting bid / time for the first run.
 * - Ended (sold or not): needs stock ≥ 1; resets the item for a fresh auction (run + 1).
 * Running items can't be changed. Returns the updated show item.
 */
// Older versions left fully paid (or unsold) runs marked ongoing. Only heal
// records with no outstanding hold and a definitive order, or no bid at all.
const runReadiness = (item) => {
  const noHold = !(Number(item.holdAmount) > 0);
  const paid = item.orderCreated === true && Boolean(item.orderId);
  const unsold = !item.currentBidder && !(Number(item.currentBid) > 0) && !item.bidWinner?.bidAmount;
  const legacySettled = item.bidStatus === 'ongoing' && noHold && (paid || unsold);
  return { settled: noHold && (item.bidStatus === 'ended' || legacySettled), legacySettled,
    settling: (item.bidStatus === 'ongoing' && !legacySettled) || (item.bidStatus === 'ended' && !noHold) };
};

const prepareRun = async ({ streamId, sellerId, productId, note, minBid, seconds }) => {
  const Stream = mongoose.model('Stream');
  const text = cleanNote(note);
  const bid = minBid === undefined || minBid === null || minBid === '' ? null : Math.round(Number(minBid));
  if (bid !== null && !(bid >= 100)) throw new RunError(400, 'Set a starting bid of at least ₦100.');
  const length = seconds ? Number(seconds) : null;
  if (length !== null && !LENGTHS.includes(length)) throw new RunError(400, 'Pick 30s, 60s or 2 min.');

  const stream = await Stream.findOne(
    { _id: streamId, seller: sellerId, status: 'live', type: 'auction', 'products.product.productId': productIdMatch(productId) },
    { 'products.$': 1 }
  ).lean();
  let item = stream?.products?.[0];
  if (!item) throw new RunError(404, "That item isn't in your live show.");
  const readiness = runReadiness(item);
  if (readiness.legacySettled) {
    const healed = await Stream.findOneAndUpdate(
      { _id: streamId, seller: sellerId, status: 'live', products: { $elemMatch: {
        'product.productId': productIdMatch(productId), bidStatus: 'ongoing',
        ...(item.run ? { run: item.run } : { $or: [{ run: 1 }, { run: { $exists: false } }] }), holdAmount: { $not: { $gt: 0 } },
        ...(item.orderCreated ? { orderCreated: true, orderId: item.orderId } : { currentBid: { $not: { $gt: 0 } }, currentBidder: null, 'bidWinner.bidAmount': { $not: { $gt: 0 } } }),
      } } },
      { $set: { 'products.$.bidStatus': 'ended' } },
      { new: true, projection: { products: { $elemMatch: { 'product.productId': productIdMatch(productId) } } } }
    ).lean();
    if (!healed) throw new RunError(409, 'This item changed just now. Try again.');
    item = healed.products[0];
  }
  if (item.bidStatus === 'active') throw new RunError(409, 'This item is being auctioned now. Wait for it to end.');
  if (item.bidStatus === 'ongoing' || Number(item.holdAmount) > 0) throw new RunError(409, 'Finishing the last sale. Run again will be ready when payment is settled.');

  const set = { 'products.$.runNote': text || undefined };
  if (bid !== null) set['products.$.minBid'] = bid;
  if (length !== null) set['products.$.auctionSeconds'] = length;
  const unset = {};
  if (!text) { delete set['products.$.runNote']; unset['products.$.runNote'] = 1; }

  const match = { 'product.productId': productIdMatch(productId) };
  const update = { $set: set, ...(Object.keys(unset).length ? { $unset: unset } : {}) };

  if (item.bidStatus === 'ended') {
    // A fresh run needs one in stock
    const product = await mongoose.model('Product').findById(require('./colourLots').catalogueId(item), { stock: 1,colourVariants:1,colourQuantities:1,variants:1 }).lean();
    const stock = require('../config/colours').coloursEnabled()&&item.product?.colour?require('./productColours').colourRows(product || {}).find(c=>c.colour===item.product.colour)?.quantity || 0:Number(product?.stock) || 0;
    if (stock < 1) throw new RunError(409, 'None left in stock, so it can’t run again.');
    Object.assign(set, {
      'products.$.bidStatus': 'pending',
      'products.$.currentBid': 0,
      'products.$.currentBidder': null,
      'products.$.orderCreated': false,
      'products.$.holdAmount': 0,
      'products.$.isVisible': true,
      'products.$.product.quantity': stock,
    });
    Object.assign(unset, { 'products.$.bidWinner': 1, 'products.$.orderId': 1, 'products.$.holdBuyer': 1, 'products.$.auctionEndsAt': 1 });
    update.$unset = unset;
    // Missing run on older records means run 1; the next charge must use r2.
    set['products.$.run'] = (Number(item.run) || 1) + 1;
    // Only from "ended", and never while a winner's money is still held
    match.bidStatus = 'ended';
    match.$or = [{ holdAmount: { $exists: false } }, { holdAmount: { $lte: 0 } }];
  } else {
    match.bidStatus = item.bidStatus;
  }

  const after = await Stream.findOneAndUpdate(
    { _id: streamId, seller: sellerId, products: { $elemMatch: match } },
    update,
    { new: true, projection: { products: { $elemMatch: { 'product.productId': productIdMatch(productId) } } } }
  ).lean();
  if (!after) throw new RunError(409, 'This item changed just now. Try again.');
  return after.products[0];
};

module.exports = { prepareRun, cleanNote, RunError, NOTE_MAX, runReadiness };
