// Server calls for the buyer app.
import axios from 'axios';

export const API = (import.meta.env.VITE_API_BASE_URL || 'https://livecommerce-api-4s2b.onrender.com').replace(/\/+$/, '');
export const PAYSTACK_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '';

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
  profile: () => http.get('/api/v2/buyers/profile').then(data),
  addAddress: (body) => http.post('/api/v2/buyers/addresses', body).then(data),
  wallet: () => http.get('/api/v2/buyers/wallet/balance').then(data),
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
  buyNow: (id, productId, quantity) => http.post(`/api/streams/${id}/buy-now`, { productId, quantity }, { timeout: 60000 }).then((r) => r.data),
};

export const naira = (n) => `₦${Math.round(Number(n || 0)).toLocaleString('en-NG')}`;
export const imageOf = (p) => p?.images?.[0]?.url || p?.product?.images?.[0]?.url || '';
