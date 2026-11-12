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
const isSandbox = () => String(process.env.SHIPBUBBLE_API_KEY || '').startsWith('sb_sandbox_');

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

const validateAddress = ({ name, email, phone, address, latitude, longitude }) =>
  call((c) => c.post('/shipping/address/validate', { name, email, phone: toPhone(phone), address, ...(Number.isFinite(latitude) && Number.isFinite(longitude) ? {latitude, longitude} : {}) }), 'Address check');

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

// Shipbubble schedules requests made after 6pm (GMT+1) for the next day
const pickupDate = (now = new Date()) => {
  const lagos = new Date(now.getTime() + 60 * 60 * 1000); // UTC+1
  if (lagos.getUTCHours() >= 18) lagos.setUTCDate(lagos.getUTCDate() + 1);
  return lagos.toISOString().slice(0, 10);
};

// Standard box sizes (cm, max kg): pick the smallest that carries the weight
let boxCache = null;
const boxes = async () => {
  if (boxCache) return boxCache;
  const list = await call((c) => c.get('/shipping/labels/boxes'), 'Box sizes');
  boxCache = (Array.isArray(list) ? list : []).filter((b) => b.length && b.width && b.height && b.max_weight);
  return boxCache;
};
const boxFor = async (weightKg, itemCount) => {
  const FALLBACK = { length: 30, width: 25, height: Math.min(60, 10 + 5 * Math.max(0, itemCount - 1)) };
  try {
    const fits = (await boxes())
      .filter((b) => b.max_weight >= weightKg)
      .sort((a, b) => a.length * a.width * a.height - b.length * b.width * b.height);
    // Several items rarely fit the tiniest box; skip boxes under ~1 litre for multi-item parcels
    const box = fits.find((b) => itemCount <= 1 || b.length * b.width * b.height >= 1000) || fits[0];
    return box ? { length: box.length, width: box.width, height: box.height } : FALLBACK;
  } catch {
    return FALLBACK;
  }
};

// Optional: only quote couriers you trust, e.g. SHIPBUBBLE_COURIERS=gigl,kwik
const fetchRates = (body) => {
  const codes = String(process.env.SHIPBUBBLE_COURIERS || '').split(',').map((c) => c.trim()).filter(Boolean);
  const path = codes.length ? `/shipping/fetch_rates/${codes.map(encodeURIComponent).join(',')}` : '/shipping/fetch_rates';
  return call((c) => c.post(path, body), 'Delivery quote');
};
const walletBalance = () => call((c) => c.get('/shipping/wallet/balance'), 'Shipbubble wallet');
const cancelShipment = (orderId) => call((c) => c.post(`/shipping/labels/cancel/${encodeURIComponent(orderId)}`), 'Cancelling the pickup');
const createShipment = ({ requestToken, courierId, serviceCode }) =>
  call((c) => c.post('/shipping/labels', { request_token: requestToken, courier_id: String(courierId), service_code: serviceCode }), 'Booking the courier');
// Sandbox only: ask Shipbubble to send a status webhook for a test shipment
const SIM_STATUSES = ['pending', 'confirmed', 'picked_up', 'in_transit', 'completed', 'cancelled'];
const simulateStatus = (orderId, status) => {
  if (!isSandbox()) return Promise.reject(new ShipbubbleError('Status simulation only works with a sandbox key', 403));
  if (!SIM_STATUSES.includes(status)) return Promise.reject(new ShipbubbleError(`Status must be one of ${SIM_STATUSES.join(', ')}`, 400));
  return call((c) => c.post(`/shipping/labels/webhooks/${encodeURIComponent(orderId)}`, { status_code: status }), 'Webhook simulator');
};
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
  boxFor,
  walletBalance,
  cancelShipment,
  createShipment,
  getShipments,
  isSandbox,
  simulateStatus,
  SIM_STATUSES,
  toPhone,
  ShipbubbleError,
  _resetCache: () => { categoryCache = null; boxCache = null; },
};
