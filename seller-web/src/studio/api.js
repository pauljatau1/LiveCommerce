// Studio API: one small client for the new seller studio screens.
import axios from 'axios';
import { BASE_URL, BASE_URL_V2 } from '@/Constants/Server';
import { tokenUtils } from '@/util/auth';

const auth = () => ({ headers: { Authorization: `Bearer ${tokenUtils.getBearerToken()}` } });
export const errorText = (e, fallback = 'Something went wrong. Try again.') => e?.response?.data?.message || fallback;

const get = (url, opts = {}) => axios.get(url, { ...auth(), timeout: 45000, ...opts }).then((r) => r.data);
const post = (url, body = {}, opts = {}) => axios.post(url, body, { ...auth(), timeout: 60000, ...opts }).then((r) => r.data);
const patch = (url, body = {}) => axios.patch(url, body, { ...auth(), timeout: 45000 }).then((r) => r.data);

export const studio = {
  home: () => get(`${BASE_URL_V2}/studio/home`),
  products: () => get(`${BASE_URL_V2}/studio/products`),
  product: (id) => get(`${BASE_URL_V2}/studio/products/${id}`),
  updateProduct: (id, body) => patch(`${BASE_URL_V2}/studio/products/${id}`, body),
  shows: (status) => get(`${BASE_URL_V2}/studio/shows${status ? `?status=${status}` : ''}`),
  show: (id) => get(`${BASE_URL_V2}/studio/shows/${id}`),
  recap: (id) => get(`${BASE_URL_V2}/studio/shows/${id}/recap`),
  money: () => get(`${BASE_URL_V2}/studio/money`),
  withdraw: (amount) => post(`${BASE_URL_V2}/studio/withdraw`, { amount }),
  // deliveries (one package per buyer per show)
  deliveries: () => get(`${BASE_URL_V2}/deliveries/seller`),
  deliveryAction: (id, action, body = {}) => post(`${BASE_URL_V2}/deliveries/${id}/${action}`, body),
  // shows (existing endpoints)
  createAuction: (body) => post(`${BASE_URL}/streams/create`, body),
  createDrop: (body) => post(`${BASE_URL}/streams/open-live-show`, body),
  stream: (id) => get(`${BASE_URL}/streams/${id}`),
  startShow: (id) => post(`${BASE_URL}/streams/${id}/start`),
  hostToken: (id) => get(`${BASE_URL}/streams/${id}/renew-token`),
  endShow: (id) => post(`${BASE_URL}/streams/${id}/end`),
  displayProduct: (id, productId) => post(`${BASE_URL}/streams/${id}/display-product`, { productId }),
  hideProduct: (id, productId) => post(`${BASE_URL}/streams/${id}/hide-product`, { productId }),
  startBidding: (id, productId, seconds) => post(`${BASE_URL}/streams/${id}/activate-product-bidding`, { productId, seconds }),
  notesDraft: (plan) => post(`${BASE_URL_V2}/studio/show-notes/draft`, plan),
  notesDefault: () => get(`${BASE_URL_V2}/studio/show-notes/default`),
  saveNotes: (id, notes, saveAsDefault = false) => axios.put(`${BASE_URL_V2}/studio/shows/${id}/notes`, { notes, saveAsDefault }, { ...auth(), timeout: 30000 }).then((r) => r.data),
  slot: () => get(`${BASE_URL_V2}/studio/slot`),
  saveSlot: (day, time) => axios.put(`${BASE_URL_V2}/studio/slot`, { day, time }, { ...auth(), timeout: 30000 }).then((r) => r.data),
  nextPlan: (id) => get(`${BASE_URL_V2}/studio/shows/${id}/next-plan`),
  notifications: () => get(`${BASE_URL_V2}/studio/notifications`),
  markRead: () => post(`${BASE_URL_V2}/studio/notifications/read`),
  endBidding: (id, productId) => post(`${BASE_URL}/streams/${id}/end-product-bidding`, { productId }),
  prepareRun: (id, productId, body) => axios.put(`${BASE_URL_V2}/studio/shows/${id}/items/${productId}/run`, body, { ...auth(), timeout: 30000 }).then((r) => r.data),
  addTime: (id, productId, seconds = 30) => post(`${BASE_URL_V2}/studio/shows/${id}/auction/time`, { productId, seconds }),
  chat: (id) => get(`${BASE_URL}/streams/${id}/chat`).catch(() => []),
};

// Getting started (routes/studioOnboardingRoutes.js)
const put = (url, body = {}) => axios.put(url, body, { ...auth(), timeout: 30000 }).then((r) => r.data);
export const onboarding = {
  get: () => get(`${BASE_URL_V2}/studio/onboarding`),
  store: (body) => put(`${BASE_URL_V2}/studio/onboarding/store`, body),
  pickup: (body) => put(`${BASE_URL_V2}/studio/onboarding/pickup`, body),
  banks: () => get(`${BASE_URL_V2}/studio/onboarding/banks`),
  checkBank: (body) => post(`${BASE_URL_V2}/studio/onboarding/bank/check`, body),
  bank: (body) => put(`${BASE_URL_V2}/studio/onboarding/bank`, body),
};

export const naira = (n) => `₦${Math.round(Number(n || 0)).toLocaleString('en-NG')}`;

export const when = (d) => {
  if (!d) return '';
  const date = new Date(d);
  const now = new Date();
  const day = date.toDateString() === now.toDateString() ? 'Today'
    : date.toDateString() === new Date(now.getTime() + 86400000).toDateString() ? 'Tomorrow'
      : date.toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' });
  return `${day} ${date.toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit', hour12: true }).replace(':00 ', ' ')}`;
};

export const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening';
};

// Studio replacements deliberately use the same seller and product endpoints as classic.
export const account = {
  banks: () => get(`${BASE_URL_V2}/sellers/banks`),
  checkBank: (body) => post(`${BASE_URL_V2}/sellers/banks/verify`, body),
  saveBank: (body) => put(`${BASE_URL_V2}/sellers/profile/bank-details`, body),
  product: (id) => get(`${BASE_URL}/products/${id}`),
  categories: () => get(`${BASE_URL}/public/categories`),
  // { fallback, categories: { Shoes: 3, … } }: typical weight in kg, to pre-fill a new product
  categoryWeights: () => get(`${BASE_URL_V2}/studio/category-weights`),
  saveProduct: (id, body) => id ? put(`${BASE_URL}/products/${id}`, body) : post(`${BASE_URL}/products`, body),
};
