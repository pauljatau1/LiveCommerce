// Show deliveries: one package per buyer per show.
//
//  1. First win/buy in a show: create the delivery and hold a deposit
//     (DELIVERY_DEPOSIT_NGN, default 3,000) from the buyer's wallet.
//  2. Show ends: one Shipbubble quote for all the buyer's items (cheapest
//     courier). Charge it from the wallet, counting the held deposit. If the
//     wallet is short the buyer sees "Pay delivery" later.
//  3. Seller books the pickup; Shipbubble charges the platform's wallet.
//  4. Status updates come from Shipbubble lookups (webhooks trigger one).

const mongoose = require('mongoose');
const ShowDelivery = require('../models/ShowDelivery');
const shipbubble = require('./shipbubble');

const model = (name) => mongoose.model(name);
const QUOTE_TTL_MS = 6 * 24 * 60 * 60 * 1000; // Shipbubble tokens last 7 days

class DeliveryError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const depositAmount = () => Math.max(0, Number(process.env.DELIVERY_DEPOSIT_NGN ?? 3000) || 0);

const availableExpr = { $subtract: [{ $ifNull: ['$wallet.balance', 0] }, { $ifNull: ['$wallet.onHoldAmount', 0] }] };

// Deposit a new delivery would need (0 if the buyer already has one in this show)
const depositFor = async (streamId, buyerId) => {
  const existing = await ShowDelivery.exists({ stream: streamId, buyer: buyerId });
  return existing ? 0 : depositAmount();
};

// Called inside the order transaction: add the order to the buyer's delivery
// for this show, creating it (and holding the deposit) on the first item.
const attachOrder = async ({ session, streamId, buyerId, sellerId, order, product, quantity, unitPrice }) => {
  const item = {
    order: order._id,
    product: product._id,
    name: product.name,
    category: product.category,
    quantity,
    unitPrice,
    weightKg: Number(product.shippingInfo?.weight?.value || product.weight) || 0.5,
    image: product.images?.[0]?.url,
  };
  let delivery = await ShowDelivery.findOneAndUpdate(
    { stream: streamId, buyer: buyerId, seller: sellerId },
    { $push: { orders: order._id, items: item } },
    { new: true, session }
  );
  if (!delivery) {
    [delivery] = await ShowDelivery.create([{ stream: streamId, buyer: buyerId, seller: sellerId, orders: [order._id], items: [item] }], { session });
    const deposit = depositAmount();
    if (deposit > 0) {
      const held = await model('Buyer').updateOne(
        { _id: buyerId, $expr: { $gte: [availableExpr, deposit] } },
        { $inc: { 'wallet.onHoldAmount': deposit } },
        { session }
      );
      if (held.modifiedCount === 1) {
        delivery.depositHeld = deposit;
        await ShowDelivery.updateOne({ _id: delivery._id }, { depositHeld: deposit }, { session });
      }
    }
  }
  await model('Order').updateOne({ _id: order._id }, { delivery: delivery._id }, { session });
  return delivery;
};

// ---------- Shipbubble addresses (verified once, then reused) ----------

const sellerPickup = (seller) => {
  const a = seller.warehouseDetails?.address?.addressLine1 ? seller.warehouseDetails.address
    : seller.businessAddress?.addressLine1 ? seller.businessAddress
    : seller.sellerAddress || {};
  return {
    name: seller.storeName || [seller.firstName, seller.lastName].filter(Boolean).join(' ') || 'Seller',
    email: seller.businessEmail || seller.email,
    phone: seller.phoneNumber,
    address: [a.addressLine1, a.addressLine2, a.city, a.state, 'Nigeria'].filter(Boolean).join(', '),
  };
};

const buyerDropoff = (buyer) => {
  const a = buyer.shippingAddresses?.find((x) => x.isActive) || buyer.shippingAddresses?.[0];
  if (!a) return null;
  return {
    addressId: a._id,
    cached: a.shipbubbleCode,
    cachedKey: a.shipbubbleKey,
    name: [a.firstName || buyer.firstName, a.lastName || buyer.lastName].filter(Boolean).join(' ') || buyer.username || 'Buyer',
    email: a.email || buyer.email,
    phone: a.phoneNumber || buyer.phoneNumber,
    address: [a.addressLine1, a.addressLine2, a.city, a.state, 'Nigeria'].filter(Boolean).join(', '),
  };
};

const sellerAddressCode = async (seller) => {
  const pickup = sellerPickup(seller);
  if (!pickup.phone) throw new DeliveryError(422, 'Add a phone number to your seller profile so couriers can reach you');
  if (!pickup.address.replace(/,?\s*Nigeria$/, '')) throw new DeliveryError(422, 'Add a pickup address to your seller profile');
  const key = `${pickup.address}|${pickup.phone}`;
  if (seller.shipbubbleAddress?.code && seller.shipbubbleAddress.key === key) return seller.shipbubbleAddress.code;
  const verified = await shipbubble.validateAddress(pickup);
  await model('Seller').updateOne({ _id: seller._id }, { shipbubbleAddress: { code: verified.address_code, key } });
  return verified.address_code;
};

const buyerAddressCode = async (buyer) => {
  const dropoff = buyerDropoff(buyer);
  if (!dropoff) throw new DeliveryError(422, 'The buyer has no delivery address');
  if (!dropoff.phone) throw new DeliveryError(422, 'The buyer needs to add a phone number for the courier');
  const key = `${dropoff.address}|${dropoff.phone}`;
  if (dropoff.cached && dropoff.cachedKey === key) return dropoff.cached;
  const verified = await shipbubble.validateAddress(dropoff);
  await model('Buyer').updateOne(
    { _id: buyer._id, 'shippingAddresses._id': dropoff.addressId },
    { $set: { 'shippingAddresses.$.shipbubbleCode': verified.address_code, 'shippingAddresses.$.shipbubbleKey': key } }
  );
  return verified.address_code;
};

// ---------- quote, charge, book ----------

const packageFor = (items) => {
  const weight = items.reduce((s, i) => s + (i.weightKg || 0.5) * (i.quantity || 1), 0);
  // One parcel; a little bigger for more items. Couriers re-measure anyway.
  const count = items.reduce((s, i) => s + (i.quantity || 1), 0);
  return {
    items: items.map((i) => ({
      name: String(i.name || 'Item').slice(0, 60),
      description: `${i.category || 'Merchandise'} from a live show`,
      unit_weight: String(Math.max(0.1, i.weightKg || 0.5)),
      unit_amount: String(Math.round(i.unitPrice || 0)),
      quantity: String(i.quantity || 1),
    })),
    dimension: { length: 30, width: 25, height: Math.min(60, 10 + 5 * Math.max(0, count - 1)) },
    weight,
  };
};

const quote = async (delivery) => {
  const [seller, buyer] = await Promise.all([
    model('Seller').findById(delivery.seller).lean(),
    model('Buyer').findById(delivery.buyer).lean(),
  ]);
  if (!seller || !buyer) throw new DeliveryError(404, 'Seller or buyer not found');
  const [senderCode, receiverCode, categoryId] = await Promise.all([
    sellerAddressCode(seller),
    buyerAddressCode(buyer),
    shipbubble.categoryIdFor(delivery.items[0]?.category),
  ]);
  const pkg = packageFor(delivery.items);
  pkg.dimension = await shipbubble.boxFor(pkg.weight, delivery.items.reduce((n, i) => n + (i.quantity || 1), 0));
  const rates = await shipbubble.fetchRates({
    sender_address_code: senderCode,
    reciever_address_code: receiverCode,
    pickup_date: shipbubble.pickupDate(),
    category_id: categoryId,
    package_items: pkg.items,
    package_dimension: pkg.dimension,
    service_type: 'pickup',
  });
  const couriers = (rates?.couriers || []).filter((c) => Number(c.rate_card_amount ?? c.total) > 0);
  if (!couriers.length) throw new DeliveryError(422, 'No courier can deliver this route right now');
  const best = couriers.reduce((a, b) => (Number(b.rate_card_amount ?? b.total) < Number(a.rate_card_amount ?? a.total) ? b : a));
  return {
    requestToken: rates.request_token,
    courierId: String(best.courier_id),
    courierName: best.courier_name,
    serviceCode: best.service_code,
    amount: Math.ceil(Number(best.rate_card_amount ?? best.total)),
    cost: Math.ceil(Number(best.total ?? best.rate_card_amount)),
    pickupEta: best.pickup_eta,
    deliveryEta: best.delivery_eta,
    fetchedAt: new Date(),
  };
};

// Charge the quoted fee from the wallet, counting the held deposit. Atomic.
const charge = async (delivery) => {
  const fee = delivery.quote.amount;
  const held = delivery.depositHeld || 0;
  const reference = `delivery_${delivery._id}`;
  const stream = await model('Stream').findById(delivery.stream, { title: 1 }).lean();
  const paid = await model('Buyer').updateOne(
    {
      _id: delivery.buyer,
      'wallet.onHoldAmount': { $gte: held },
      'wallet.transactions.paymentReference': { $ne: reference },
      $expr: { $gte: [{ $add: [availableExpr, held] }, fee] },
    },
    {
      $inc: { 'wallet.balance': -fee, 'wallet.onHoldAmount': -held },
      $push: { 'wallet.transactions': { type: 'debit', amount: fee, paymentReference: reference, description: `Delivery: ${stream?.title || 'live show'}`, status: 'completed' } },
    }
  );
  if (paid.modifiedCount !== 1) return false;
  await ShowDelivery.updateOne({ _id: delivery._id }, { status: 'paid', fee, depositHeld: 0, paidAt: new Date(), lastError: null });
  return true;
};

// Quote and charge one delivery (after the show, or on retry)
const settle = async (deliveryId) => {
  const delivery = await ShowDelivery.findOneAndUpdate(
    { _id: deliveryId, status: { $in: ['collecting', 'quote_failed', 'awaiting_payment'] } },
    { $set: { lastError: null } },
    { new: true }
  );
  if (!delivery) return null;
  try {
    const q = await quote(delivery);
    await ShowDelivery.updateOne({ _id: delivery._id }, { quote: q, status: 'awaiting_payment' });
    delivery.quote = q;
    const ok = await charge(delivery);
    return ShowDelivery.findById(delivery._id).lean().then((d) => ({ ...d, charged: ok }));
  } catch (error) {
    await ShowDelivery.updateOne({ _id: delivery._id }, { status: 'quote_failed', lastError: plainError(error.message) });
    return ShowDelivery.findById(delivery._id).lean();
  }
};

// Seller-facing wording for the pricing problems we know about. Every one of
// these is retried automatically (see retryStuck), so the seller needn't act.
const plainError = (msg = '') => {
  if (/enable api access/i.test(msg)) return 'Delivery pricing is switched off on Shipbubble (API access). We retry every 10 minutes.';
  if (/kyc/i.test(msg)) return 'Shipbubble needs your business verification (KYC) first. We retry every 10 minutes.';
  if (/address/i.test(msg)) return `Shipbubble couldn't check an address: ${msg.replace(/^Address check failed:\s*/i, '')}. We retry every 10 minutes.`;
  return `${msg || "Couldn't get a delivery price"}. We retry every 10 minutes.`;
};

// Scheduled every 10 minutes: price deliveries that failed, and any whose show
// ended without being settled (e.g. the server restarted mid-settle). Gives up
// after 3 days; the seller can still press "Get a new delivery price".
const RETRY_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;
const retryStuck = async ({ now = Date.now() } = {}) => {
  const since = new Date(now - RETRY_WINDOW_MS);
  const failed = await ShowDelivery.find(
    { status: 'quote_failed', createdAt: { $gte: since }, updatedAt: { $lte: new Date(now - 5 * 60 * 1000) } },
    { _id: 1 }
  ).limit(20).lean();
  const collecting = await ShowDelivery.find({ status: 'collecting', createdAt: { $gte: since } }, { _id: 1, stream: 1 }).limit(50).lean();
  const ended = collecting.length
    ? new Set((await model('Stream').find({ _id: { $in: collecting.map((d) => d.stream) }, status: 'ended' }, { _id: 1 }).lean()).map((s) => String(s._id)))
    : new Set();
  const ids = [...failed.map((d) => d._id), ...collecting.filter((d) => ended.has(String(d.stream))).map((d) => d._id)];
  const results = [];
  for (const id of ids) results.push(await settle(id)); // one at a time: Shipbubble rate limits
  return results;
};

const settleShow = async (streamId) => {
  const pending = await ShowDelivery.find({ stream: streamId, status: 'collecting' }, { _id: 1 }).lean();
  const results = [];
  for (const d of pending) results.push(await settle(d._id)); // one at a time: Shipbubble rate limits
  return results;
};

// Buyer pays an outstanding delivery after topping up
const payDelivery = async ({ buyerId, deliveryId }) => {
  const delivery = await ShowDelivery.findOne({ _id: deliveryId, buyer: buyerId });
  if (!delivery) throw new DeliveryError(404, 'Delivery not found');
  if (delivery.status === 'paid' || ['booked', 'in_transit', 'delivered'].includes(delivery.status)) return delivery.toObject();
  if (delivery.status === 'collecting') throw new DeliveryError(409, 'The show is still on; delivery is settled when it ends');
  if (!delivery.quote?.amount || delivery.status === 'quote_failed' || Date.now() - new Date(delivery.quote.fetchedAt) > QUOTE_TTL_MS) {
    const result = await settle(delivery._id);
    if (result?.status === 'quote_failed') throw new DeliveryError(502, result.lastError || 'Could not get a delivery price');
    if (result?.status === 'paid') return result;
    delivery.quote = result.quote;
  }
  if (!(await charge(delivery))) throw new DeliveryError(402, 'Not enough in your wallet. Top up to pay for delivery.');
  return ShowDelivery.findById(delivery._id).lean();
};

// Seller books the courier for a paid delivery
const book = async ({ sellerId, deliveryId }) => {
  const claimed = await ShowDelivery.findOneAndUpdate(
    { _id: deliveryId, seller: sellerId, status: 'paid', 'shipbubble.orderId': { $exists: false } },
    { $set: { 'shipbubble.status': 'booking' } },
    { new: true }
  );
  if (!claimed) {
    const d = await ShowDelivery.findOne({ _id: deliveryId, seller: sellerId }).lean();
    if (!d) throw new DeliveryError(404, 'Delivery not found');
    if (d.shipbubble?.orderId) return d;
    throw new DeliveryError(409, d.status === 'awaiting_payment' ? 'The buyer hasn’t paid for delivery yet' : `Can't book a delivery that is ${d.status.replace('_', ' ')}`);
  }
  try {
    let q = claimed.quote;
    if (!q?.requestToken || Date.now() - new Date(q.fetchedAt) > QUOTE_TTL_MS) {
      q = await quote(claimed); // token expired: re-quote; the platform absorbs any difference
      await ShowDelivery.updateOne({ _id: claimed._id }, { quote: q });
    }
    // Shipbubble charges its wallet when booking; say so plainly if it's short
    try {
      const wallet = await shipbubble.walletBalance();
      if (wallet && typeof wallet.balance === 'number' && wallet.balance < (q.cost || q.amount)) {
        throw new DeliveryError(402, `Your Shipbubble wallet has ₦${Math.floor(wallet.balance).toLocaleString('en-NG')}; this pickup costs ₦${(q.cost || q.amount).toLocaleString('en-NG')}. Fund it on shipbubble.com, then book again.`);
      }
    } catch (e) {
      if (e instanceof DeliveryError) throw e; // balance lookup failing shouldn't block booking
    }
    const shipment = await shipbubble.createShipment({ requestToken: q.requestToken, courierId: q.courierId, serviceCode: q.serviceCode });
    await ShowDelivery.updateOne({ _id: claimed._id }, {
      status: 'booked',
      lastError: null,
      shipbubble: {
        orderId: shipment.order_id,
        trackingUrl: shipment.tracking_url,
        status: shipment.status || 'pending',
        courierName: shipment.courier?.name || q.courierName,
        bookedAt: new Date(),
        updatedAt: new Date(),
      },
    });
    await model('Order').updateMany({ _id: { $in: claimed.orders } }, { status: 'confirmed', 'shipping.tracking.url': shipment.tracking_url, 'shipping.carrier.name': shipment.courier?.name || q.courierName });
    return ShowDelivery.findById(claimed._id).lean();
  } catch (error) {
    const msg = /kyc/i.test(error.message) ? 'Complete your business verification (KYC) on Shipbubble before booking pickups.'
      : /insufficient|balance/i.test(error.message) ? 'Your Shipbubble wallet is too low for this pickup. Fund it on shipbubble.com, then book again.'
        : error.message;
    await ShowDelivery.updateOne({ _id: claimed._id }, { $unset: { 'shipbubble.status': 1 }, lastError: msg });
    throw error instanceof DeliveryError ? error : new DeliveryError(error.status || 502, msg);
  }
};

// Seller cancels a booked pickup (only before Shipbubble processes it); the
// package goes back to "paid" so it can be booked again.
const cancelPickup = async ({ sellerId, deliveryId }) => {
  const d = await ShowDelivery.findOne({ _id: deliveryId, seller: sellerId });
  if (!d) throw new DeliveryError(404, 'Delivery not found');
  if (d.status !== 'booked' || !d.shipbubble?.orderId) throw new DeliveryError(409, 'Only a booked pickup that hasn’t been collected can be cancelled');
  try {
    await shipbubble.cancelShipment(d.shipbubble.orderId);
  } catch (error) {
    throw new DeliveryError(409, /processed/i.test(error.message) ? 'The courier has already processed this pickup, so it can’t be cancelled' : error.message);
  }
  await ShowDelivery.updateOne({ _id: d._id }, { status: 'paid', $unset: { shipbubble: 1, quote: 1 }, lastError: null });
  await model('Order').updateMany({ _id: { $in: d.orders } }, { status: 'processing' });
  return ShowDelivery.findById(d._id).lean();
};

// Map Shipbubble's status to ours
const statusFrom = (sb) => {
  const s = String(sb || '').toLowerCase();
  if (/deliver|completed/.test(s)) return 'delivered';
  if (/cancel/.test(s)) return 'cancelled';
  if (/picked|transit|out_for|dispatch/.test(s)) return 'in_transit';
  return 'booked';
};
const ORDER_STATUS = { booked: 'confirmed', in_transit: 'in_transit', delivered: 'delivered', cancelled: 'cancelled' };

// Apply one Shipbubble shipment record (from the API or a signed webhook)
const applyShipment = async (r) => {
  if (!r?.order_id) return null;
  const status = statusFrom(r.status);
  const set = { status, 'shipbubble.status': r.status, 'shipbubble.updatedAt': new Date() };
  if (r.tracking_url) set['shipbubble.trackingUrl'] = r.tracking_url;
  if (r.courier?.tracking_code) set['shipbubble.trackingCode'] = r.courier.tracking_code;
  const d = await ShowDelivery.findOneAndUpdate(
    { 'shipbubble.orderId': r.order_id, status: { $in: ['booked', 'in_transit'] } },
    set,
    { new: true }
  );
  if (d) await model('Order').updateMany({ _id: { $in: d.orders } }, { status: ORDER_STATUS[status] });
  return d;
};

// Refresh status from Shipbubble for the given Shipbubble order ids
const refreshTracking = async (orderIds) => {
  const results = await shipbubble.getShipments(orderIds);
  for (const r of results) await applyShipment(r);
  return results.length;
};

// Holds released if a show ends with deliveries that never settle (e.g. cancelled)
const releaseDeposit = async (delivery) => {
  if (!(delivery.depositHeld > 0)) return;
  const done = await ShowDelivery.updateOne({ _id: delivery._id, depositHeld: delivery.depositHeld }, { depositHeld: 0 });
  if (done.modifiedCount === 1) {
    await model('Buyer').updateOne({ _id: delivery.buyer }, [{ $set: { 'wallet.onHoldAmount': { $max: [0, { $subtract: [{ $ifNull: ['$wallet.onHoldAmount', 0] }, delivery.depositHeld] }] } } }]);
  }
};

module.exports = {
  depositAmount,
  depositFor,
  attachOrder,
  settle,
  settleShow,
  retryStuck,
  plainError,
  payDelivery,
  book,
  cancelPickup,
  refreshTracking,
  applyShipment,
  releaseDeposit,
  statusFrom,
  packageFor,
  DeliveryError,
};
