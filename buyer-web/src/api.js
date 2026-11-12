// Server calls for the buyer app.
import axios from 'axios';

export const API = (import.meta.env.VITE_API_BASE_URL || 'https://livecommerce-api-4s2b.onrender.com').replace(/\/+$/, '');
export const PAYSTACK_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '';
// Google sign-in shows only when this is set (and GOOGLE_CLIENT_ID on the server)
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const TOKEN_KEY = 'buyerToken';
const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch { /* private mode */ } },
};
let memoryToken = store.get(TOKEN_KEY);
export const getToken = () => memoryToken;
export const setToken = (t) => { memoryToken = t; store.set(TOKEN_KEY, t); };

const http = axios.create({ baseURL: API, timeout: 30000 });
http.interceptors.request.use((cfg) => {
  if (memoryToken) cfg.headers.Authorization = `Bearer ${memoryToken}`;
  return cfg;
});

export const errorMessage = (e, fallback = 'Something went wrong. Try again.') =>
  e?.response?.data?.message || (e?.code === 'ECONNABORTED' ? 'The server is waking up. Try again in a moment.' : fallback);

const data = (res) => res.data?.data ?? res.data;

export const api = {
  register: (body) => http.post('/api/v2/buyers/auth/register', body).then(data),
  login: (body) => http.post('/api/v2/buyers/auth/login', body).then(data),
  updateProfile:body=>http.put('/api/v2/buyers/profile',body).then(data),
  savePhone:phoneNumber=>http.put('/api/v2/buyers/profile/phone',{phoneNumber}).then(data),
  changePassword:body=>http.post('/api/v2/buyers/profile/change-password',body).then(data),
  addresses:()=>http.get('/api/v2/buyers/addresses').then(data),
  removeAddress:id=>http.delete(`/api/v2/buyers/addresses/${id}`).then(data),
  joinWaitlist:body=>http.post('/api/v2/watch/waitlist',body).then(data),
  profile: () => http.get('/api/v2/buyers/profile').then(data),
  activateAddress: (id) => http.patch(`/api/v2/buyers/addresses/${id}/set-active`, {}).then(data),
  updateAddress: (id, body) => http.put(`/api/v2/buyers/addresses/${id}`, body).then(data),
  addAddress: (body) => http.post('/api/v2/buyers/addresses', body).then(data),
  wallet: () => http.get('/api/v2/buyers/wallet/balance').then(data),
  dva: (since) => http.get('/api/v2/wallet/dva', { params: { since } }).then(data),
  assignDva: () => http.post('/api/v2/wallet/dva', { consent: true }).then(data),
  requeryDva: () => http.post('/api/v2/wallet/dva/requery').then(data),
  savedCards: () => http.get('/api/v2/wallet/cards').then((r) => r.data.cards || []),
  removeCard: (id) => http.delete(`/api/v2/wallet/cards/${id}`).then(data),
  chargeCard: (id, amount, idempotencyKey) => http.post(`/api/v2/wallet/cards/${id}/charge`, { amount, idempotencyKey }).then(data),
  topUpStatus: (reference) => http.get(`/api/v2/wallet/topups/${encodeURIComponent(reference)}`).then(data),
  confirmTopUp: (amount, paymentReference) => http.post('/api/v2/buyers/wallet/topup', { amount, paymentReference }, { timeout: 60000 }).then(data),
  orders: () => http.get('/api/v2/buyers/orders').then(data),
  deliveries: () => http.get('/api/v2/deliveries').then((r) => r.data?.deliveries || []),
  payDelivery: (id) => http.post(`/api/v2/deliveries/${id}/pay`, {}, { timeout: 60000 }).then((r) => r.data?.delivery),
  refreshDelivery: (id) => http.post(`/api/v2/deliveries/${id}/refresh`).then((r) => r.data?.delivery),
  liveShows: () => http.get('/api/streams/active').then((r) => r.data),
  upcomingShows: () => http.get('/api/streams', { params: { status: 'scheduled' } }).then((r) => r.data?.streams || []),
  show: (id) => http.get(`/api/streams/${id}`).then((r) => r.data),
  join: (id) => http.post(`/api/streams/${id}/join`, {}, { timeout: 60000 }).then((r) => r.data),
  leave: (id) => http.post(`/api/streams/${id}/leave`).catch(() => {}),
  chat: (id) => http.get(`/api/streams/${id}/chat`).then((r) => r.data?.chatInteractions || r.data?.data || r.data || []),
  googleAuth: (idToken) => http.post('/api/v2/buyers/auth/google-auth', { token: idToken }).then(data),
  guestJoin: (id) => http.post(`/api/v2/watch/${id}/guest-join`, {}, { timeout: 60000 }).then((r) => r.data),
  publicChat: (id) => http.get(`/api/v2/watch/${id}/chat`).then((r) => r.data?.chatInteractions || []),
  // Delivery deposit for this buyer: a Shipbubble quote to their saved address
  watchMe: (id, productId) => http.get(`/api/v2/watch/${id}/me`, { params: productId ? { productId } : {} }).then((r) => r.data),
  // Shipbubble price to an address typed in the one-step sheet (nothing saved)
  deliveryQuote: (id, body) => http.post(`/api/v2/watch/${id}/delivery-quote`, body).then((r) => r.data),
  estimate: (id, params = {}) => http.get(`/api/v2/watch/${id}/estimate`, { params }).then((r) => r.data),
  notes: (id) => http.get(`/api/v2/watch/${id}/notes`).then((r) => r.data),
  follow: (sellerId) => http.post(`/api/buyer/follow/${sellerId}`).then((r) => r.data).catch((e) => { if (/already following/i.test(e?.response?.data?.message || '')) return { following: true }; throw e; }),
  unfollow: (sellerId) => http.delete(`/api/buyer/follow/${sellerId}`).then((r) => r.data),
  review: (sellerId, body) => http.post(`/api/v2/buyers/seller/${sellerId}/review`, body).then(data),
  watchSummary: (id) => http.get(`/api/v2/watch/${id}/summary`).then((r) => r.data),
  report: (id, reason, note) => http.post(`/api/v2/watch/${id}/report`, { reason, note }).then((r) => r.data),
  buyNow: (id, productId, quantity, expected = {}) => http.post(`/api/streams/${id}/buy-now`, { productId, quantity, ...expected }, { timeout: 60000 }).then((r) => r.data),
};

export const naira = (n) => `₦${Math.round(Number(n || 0)).toLocaleString('en-NG')}`;
export const imageOf = (p) => p?.images?.[0]?.url || p?.product?.images?.[0]?.url || '';
