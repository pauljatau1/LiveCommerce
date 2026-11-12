// Delivery estimate before and during a show: a Shipbubble quote from the
// seller's pickup area to the buyer's area, for one typical parcel. Cached per
// seller-area → buyer-area pair. It's an estimate: the real fee is quoted once
// after the show for everything a buyer got from that seller (deliveryService).

const mongoose = require('mongoose');
const shipbubble = require('./shipbubble');
const deliveries = require('./deliveryService');
const DeliveryEstimate = require('../models/DeliveryEstimate');

const QUOTE_TTL_MS = 24 * 3600 * 1000; // rates move; a day is close enough for an estimate
const AREA_TTL_MS = 90 * 24 * 3600 * 1000;
const TYPICAL_PARCEL = { name: 'Clothing', weightKg: 0.5, unitPrice: 15000, quantity: 1, category: 'Clothing' };

const norm = (s) => String(s || '').trim().replace(/\s+/g, ' ');
const areaKey = (city, state) => `${norm(city)}|${norm(state)}`.toLowerCase();

const sellerArea = (seller) => {
  const a = seller.warehouseDetails?.address?.addressLine1 ? seller.warehouseDetails.address
    : seller.businessAddress?.addressLine1 ? seller.businessAddress
    : seller.sellerAddress || {};
  return { city: norm(a.city), state: norm(a.state) };
};

// Shipbubble needs an address code for the drop-off; for an area we check
// "<area>, <LGA when known>, <state>, Nigeria" once and keep the code.
const areaCode = async (city, state, contact) => {
  const key = `area:${areaKey(city, state)}`;
  const hit = await DeliveryEstimate.findOne({ key, expiresAt: { $gt: new Date() } }).lean();
  if (hit?.addressCode) return hit.addressCode;
  const verified = await shipbubble.validateAddress({ ...contact, address: require('./areaDirectory').deliveryAddress({city:norm(city),state:norm(state)}) });
  await DeliveryEstimate.updateOne({ key }, { $set: { kind: 'area', addressCode: verified.address_code, expiresAt: new Date(Date.now() + AREA_TTL_MS) } }, { upsert: true });
  return verified.address_code;
};

class EstimateUnavailable extends Error {}

/**
 * @returns {Promise<{ amount, area, courierName, deliveryEta, cached }>}
 * @throws EstimateUnavailable with a plain-language message
 */
const estimate = async ({ sellerId, city, state }) => {
  if (!norm(city) || !norm(state)) throw new EstimateUnavailable('Pick your state and area to see delivery.');
  const seller = await mongoose.model('Seller').findById(sellerId).lean();
  if (!seller) throw new EstimateUnavailable("We couldn't find this host.");
  const from = sellerArea(seller);
  if (!from.state) throw new EstimateUnavailable("This host hasn't set a pickup address yet.");
  const key = `${areaKey(from.city, from.state)}>${areaKey(city, state)}`;

  const hit = await DeliveryEstimate.findOne({ key, expiresAt: { $gt: new Date() } }).lean();
  if (hit?.amount) return { amount: hit.amount, area: norm(city), courierName: hit.courierName, deliveryEta: hit.deliveryEta, cached: true };

  if (!shipbubble.isConfigured()) throw new EstimateUnavailable("Delivery quotes aren't switched on yet.");
  try {
    const pickup = deliveries.sellerPickup(seller);
    const senderCode = await deliveries.sellerAddressCode(seller);
    const receiverCode = await areaCode(city, state, { name: 'Delivery estimate', email: pickup.email, phone: pickup.phone });
    const pkg = deliveries.packageFor([TYPICAL_PARCEL]);
    pkg.dimension = await shipbubble.boxFor(pkg.weight, 1);
    const rates = await shipbubble.fetchRates({
      sender_address_code: senderCode,
      reciever_address_code: receiverCode,
      pickup_date: shipbubble.pickupDate(),
      category_id: await shipbubble.categoryIdFor(TYPICAL_PARCEL.category),
      package_items: pkg.items,
      package_dimension: pkg.dimension,
      service_type: 'pickup',
    });
    const couriers = (rates?.couriers || []).filter((c) => Number(c.rate_card_amount ?? c.total) > 0);
    if (!couriers.length) throw new EstimateUnavailable('No courier covers this area right now. The host will confirm delivery after the show.');
    const best = couriers.reduce((a, b) => (Number(b.rate_card_amount ?? b.total) < Number(a.rate_card_amount ?? a.total) ? b : a));
    // Round up to the next ₦100: it's an estimate
    const amount = Math.ceil(Number(best.rate_card_amount ?? best.total) / 100) * 100;
    await DeliveryEstimate.updateOne(
      { key },
      { $set: { kind: 'quote', amount, courierName: best.courier_name, deliveryEta: best.delivery_eta, expiresAt: new Date(Date.now() + QUOTE_TTL_MS) } },
      { upsert: true }
    );
    return { amount, area: norm(city), courierName: best.courier_name, deliveryEta: best.delivery_eta, cached: false };
  } catch (e) {
    if (e instanceof EstimateUnavailable) throw e;
    console.error('[delivery-estimate]', e.message);
    throw new EstimateUnavailable("Couldn't get a delivery estimate right now. The fee is confirmed after the show.");
  }
};

module.exports = { estimate, areaKey, EstimateUnavailable, QUOTE_TTL_MS };
