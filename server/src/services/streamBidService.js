// Live-auction bidding with wallet holds.
//
// A bid only counts if it is still the highest when it is written: the stream
// update is a single conditional write, so two bids arriving at once can never
// both win, and a lower bid can never overwrite a higher one.
//
// The leading bidder's bid plus delivery fee is reserved in their wallet
// (wallet.onHoldAmount). Being outbid releases it; winning releases it just
// before the order charges the wallet; a cancelled or ended show releases it.
// The hold is recorded on the stream product (holdBuyer, holdAmount) so it is
// released exactly once.

const mongoose = require('mongoose');

const Buyer = () => mongoose.model('Buyer');
const Stream = () => mongoose.model('Stream');

const availableExpr = {
  $subtract: [{ $ifNull: ['$wallet.balance', 0] }, { $ifNull: ['$wallet.onHoldAmount', 0] }],
};

// Reserve `amount` if the buyer's available balance (balance minus holds) covers it.
const holdFunds = async (buyerId, amount) => {
  if (!(amount > 0)) return true;
  const result = await Buyer().updateOne(
    { _id: buyerId, $expr: { $gte: [availableExpr, amount] } },
    { $inc: { 'wallet.onHoldAmount': amount } }
  );
  return result.modifiedCount === 1;
};

// Release a reservation, never taking the held total below zero.
const releaseFunds = async (buyerId, amount) => {
  if (!buyerId || !(amount > 0)) return;
  await Buyer().updateOne({ _id: buyerId }, [
    {
      $set: {
        'wallet.onHoldAmount': {
          $max: [0, { $subtract: [{ $ifNull: ['$wallet.onHoldAmount', 0] }, amount] }],
        },
      },
    },
  ]);
};

// Stream products store productId as a string or an ObjectId; match either.
const productIdMatch = (productId) => {
  const ids = [String(productId)];
  if (mongoose.Types.ObjectId.isValid(productId)) ids.push(new mongoose.Types.ObjectId(String(productId)));
  return { $in: ids };
};

// Bid steps: ₦500 under ₦10,000, ₦1,000 under ₦50,000, ₦2,500 above.
const stepFor = (bid) => (bid < 10000 ? 500 : bid < 50000 ? 1000 : 2500);

// The lowest bid that counts next: the starting bid, or the top bid plus one step.
const minimumNextBid = (product) => {
  const current = Number(product?.currentBid) || 0;
  return current > 0 ? current + stepFor(current) : Math.max(Number(product?.minBid) || 0, 1);
};

const bidderSnapshot = (buyer) => ({
  _id: buyer._id,
  firstName: buyer.firstName,
  lastName: buyer.lastName,
  username: buyer.username,
  profileImage: buyer.profileImage,
});

/**
 * Place a bid atomically and move the wallet hold to the new leader.
 *
 * @param {object} p
 * @param {string} p.streamId
 * @param {string} p.productId
 * @param {object} p.buyer        Buyer document (needs _id and display fields)
 * @param {number} p.bidAmount
 * @param {number} [p.shippingFee=0]
 * @param {object} [p.notification] Chat notification to push with the bid
 * @param {number} [p.maxBid]     When the bid reaches this, the auction is won outright
 * @returns {Promise<{ok: true, isWinner: boolean, product: object, bid: object}
 *                 | {ok: false, reason: 'insufficient_funds'|'outbid'|'closed'}>}
 */
const placeBid = async ({ streamId, productId, buyer, bidAmount, shippingFee = 0, notification, maxBid, expectedRun }) => {
  const holdAmount = bidAmount + (shippingFee || 0);

  if (!(await holdFunds(buyer._id, holdAmount))) {
    return { ok: false, reason: 'insufficient_funds' };
  }

  const now = new Date();
  const bid = { buyer: buyer._id, product: productId, amount: bidAmount, timestamp: now };
  const isWinner = Boolean(maxBid) && bidAmount >= maxBid;

  const set = {
    'products.$.currentBid': bidAmount,
    'products.$.currentBidder': bidderSnapshot(buyer),
    'products.$.holdBuyer': buyer._id,
    'products.$.holdAmount': holdAmount,
  };
  if (isWinner) {
    set['products.$.bidStatus'] = 'ongoing';
    set['products.$.bidWinner'] = { buyer: bidderSnapshot(buyer), bidAmount, winningTime: now };
  }

  const push = { bids: bid };
  if (notification) push.chatInteractions = notification;

  // Only succeeds if, at the moment of writing, the stream is live, bidding is
  // open, the bid meets the minimum, and it beats the current highest bid.
  const before = await Stream().findOneAndUpdate(
    {
      _id: streamId,
      status: 'live',
      type: 'auction',
      products: {
        $elemMatch: {
          'product.productId': productIdMatch(productId),
          bidStatus: 'active',
          minBid: { $lte: bidAmount },
          currentBid: { $lt: bidAmount },
          // A resumed bid must still be on the chosen run and a valid next step.
          ...(expectedRun === undefined ? {} : { $and: [
            { $or: [{ run: Number(expectedRun) }, ...(Number(expectedRun) === 1 ? [{ run: { $exists: false } }] : [])] },
            { $or: [{ auctionEndsAt: { $gt: now } }, { auctionEndsAt: { $exists: false } }] },
            { $or: [
              { currentBid: { $lte: 0 } },
              { currentBid: { $gt: 0, $lt: 10000, $lte: bidAmount - 500 } },
              { currentBid: { $gte: 10000, $lt: 50000, $lte: bidAmount - 1000 } },
              { currentBid: { $gte: 50000, $lte: bidAmount - 2500 } },
            ] },
          ] }),
        },
      },
    },
    { $set: set, $push: push },
    { new: false, projection: { 'products.$': 1 } }
  ).lean();

  if (!before) {
    await releaseFunds(buyer._id, holdAmount);
    const current = await Stream().findOne(
      { _id: streamId, 'products.product.productId': productIdMatch(productId) },
      { status: 1, 'products.$': 1 }
    ).lean();
    const product = current && current.products && current.products[0];
    const open = current && current.status === 'live' && product && product.bidStatus === 'active';
    return { ok: false, reason: open ? 'outbid' : 'closed', currentBid: product ? product.currentBid : undefined };
  }

  const previous = before.products[0];
  if (previous.holdBuyer && previous.holdAmount > 0) {
    await releaseFunds(previous.holdBuyer, previous.holdAmount);
  }

  const product = {
    ...previous,
    currentBid: bidAmount,
    currentBidder: bidderSnapshot(buyer),
    holdBuyer: buyer._id,
    holdAmount,
    ...(isWinner ? { bidStatus: 'ongoing', bidWinner: { buyer: bidderSnapshot(buyer), bidAmount, winningTime: now } } : {}),
  };
  // A bid in the last seconds pushes the clock back (see auctionClock); never blocks the bid
  if (!isWinner) {
    try { await require('./auctionClock').clock().onBid(streamId, productId); } catch (e) { console.error('[bid] late-bid extension', e.message); }
  }
  return { ok: true, isWinner, product, bid };
};

/**
 * Release whatever is held for a stream product's leading bid. Safe to call
 * more than once: the hold is cleared atomically, so funds are released once.
 * @returns {Promise<{buyerId, amount} | null>}
 */
const releaseProductHold = async (streamId, productId) => {
  const before = await Stream().findOneAndUpdate(
    {
      _id: streamId,
      products: { $elemMatch: { 'product.productId': productIdMatch(productId), holdAmount: { $gt: 0 } } },
    },
    { $set: { 'products.$.holdAmount': 0 }, $unset: { 'products.$.holdBuyer': 1 } },
    { new: false, projection: { 'products.$': 1 } }
  ).lean();
  const held = before && before.products && before.products[0];
  if (!held || !held.holdBuyer) return null;
  await releaseFunds(held.holdBuyer, held.holdAmount);
  return { buyerId: held.holdBuyer, amount: held.holdAmount };
};

// Release every remaining hold on a stream (e.g. when the show ends).
const releaseAllHolds = async (streamId) => {
  const stream = await Stream().findById(streamId, { 'products.product.productId': 1, 'products.holdAmount': 1 }).lean();
  if (!stream) return 0;
  let released = 0;
  for (const p of stream.products || []) {
    if (p.holdAmount > 0 && p.product && p.product.productId) {
      if (await releaseProductHold(streamId, p.product.productId)) released += 1;
    }
  }
  return released;
};

module.exports = { placeBid, holdFunds, releaseFunds, releaseProductHold, releaseAllHolds, productIdMatch, stepFor, minimumNextBid };
