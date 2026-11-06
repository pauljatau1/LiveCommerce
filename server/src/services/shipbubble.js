// Shipbubble API (https://docs.shipbubble.com): verify addresses, quote,
// book a courier, and look up shipment status.
// Keys: sb_sandbox_... (test, no real money) or sb_prod_... (live).

const axios = require('axios');

const API_BASE = 'https://api.shipbubble.com/v1';

class ShipbubbleError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

const isConfigured = () => Boolean(process.env.SHIPBUBBLE_API_KEY);

const client = () =>
  axios.create({
    baseURL: API_BASE,
    timeout: 30000,
    headers: { Authorization: `Bearer ${process.env.SHIPBUBBLE_API_KEY}`, 'Content-Type': 'application/json' },
  });

const call = async (fn, what) => {
  if (!isConfigured()) throw new ShipbubbleError('Delivery is not switched on (SHIPBUBBLE_API_KEY missing)', 503);
  try {
    const res = await fn(client());
    if (res.data?.status && res.data.status !== 'success') throw new ShipbubbleError(res.data.message || `${what} failed`, 422);
    return res.data?.data;
  } catch (error) {
    if (error instanceof ShipbubbleError) throw error;
    const body = error.response?.data;
    const reason = (Array.isArray(body?.errors) && body.errors.join('; ')) || body?.message || error.code || error.message;
    console.error(`[shipbubble] ${what} failed:`, { status: error.response?.status, reason });
    throw new ShipbubbleError(`${what} failed: ${reason}`, error.response?.status || 502);
  }
};

// Nigerian numbers as +234XXXXXXXXXX
const toPhone = (raw) => {
  const digits = String(raw || '').replace(/[^\d]/g, '');
  if (!digits) return '';
  if (digits.startsWith('234')) return `+${digits}`;
  if (digits.startsWith('0')) return `+234${digits.slice(1)}`;
  return `+234${digits}`;
};

const validateAddress = ({ name, email, phone, address }) =>
  call((c) => c.post('/shipping/address/validate', { name, email, phone: toPhone(phone), address }), 'Address check');

let categoryCache = null;
const categories = async () => {
  if (categoryCache) return categoryCache;
  const list = await call((c) => c.get('/shipping/labels/categories'), 'Package categories');
  categoryCache = Array.isArray(list) ? list : [];
  return categoryCache;
};

// Our catalogue -> Shipbubble's package categories (they price by category)
const CATEGORY_HINTS = [
  [/apparel|cosplay|fashion|t-shirt|hoodie/i, /fashion/i],
  [/gaming|controller|headset|keyboard|electronic/i, /electronic gadgets|electronics/i],
];
const categoryIdFor = async (ourCategory) => {
  if (process.env.SHIPBUBBLE_CATEGORY_ID) return Number(process.env.SHIPBUBBLE_CATEGORY_ID);
  const list = await categories();
  const hint = CATEGORY_HINTS.find(([ours]) => ours.test(ourCategory || ''));
  const match = (hint && list.find((c) => hint[1].test(c.category))) || list.find((c) => /accessor/i.test(c.category)) || list[0];
  if (!match) throw new ShipbubbleError('No package categories available', 502);
  return match.category_id;
};

// Requests after 5pm Lagos time are scheduled for the next day
const pickupDate = (now = new Date()) => {
  const lagos = new Date(now.getTime() + 60 * 60 * 1000); // UTC+1
  if (lagos.getUTCHours() >= 17) lagos.setUTCDate(lagos.getUTCDate() + 1);
  return lagos.toISOString().slice(0, 10);
};

const fetchRates = (body) => call((c) => c.post('/shipping/fetch_rates', body), 'Delivery quote');
const createShipment = ({ requestToken, courierId, serviceCode }) =>
  call((c) => c.post('/shipping/labels', { request_token: requestToken, courier_id: String(courierId), service_code: serviceCode }), 'Booking the courier');
const getShipments = async (orderIds) => {
  const ids = orderIds.filter(Boolean).slice(0, 50);
  if (!ids.length) return [];
  const data = await call((c) => c.get(`/shipping/labels/list/${ids.map(encodeURIComponent).join(',')}`), 'Tracking lookup');
  return data?.results || [];
};

module.exports = {
  isConfigured,
  validateAddress,
  categoryIdFor,
  pickupDate,
  fetchRates,
  createShipment,
  getShipments,
  toPhone,
  ShipbubbleError,
  _resetCache: () => { categoryCache = null; },
};
