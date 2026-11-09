// Server calls and photo handling for the Listing Agent.
import axios from 'axios';
import { BASE_URL, BASE_URL_V2 } from '@/Constants/Server';
import { tokenUtils } from '@/util/auth';
import { LAUNCH_CATEGORIES } from './catalogue';

const auth = () => ({ headers: { Authorization: `Bearer ${tokenUtils.getBearerToken()}` } });

const message = (error, fallback) => error?.response?.data?.message || fallback;

// Shrink a photo on the device before upload: longest side 1600px, JPEG.
// Keeps a draft working on patchy mobile data (a 4 MB phone photo becomes ~300 KB).
export const shrinkPhoto = (file, maxSide = 1600, quality = 0.82) =>
  new Promise((resolve, reject) => {
    if (!/^image\/(jpeg|png|webp|heic|heif)$/i.test(file.type) && !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)) {
      reject(new Error(`${file.name} isn't a photo`));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      const base64 = dataUrl.split(',')[1];
      resolve({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        dataUrl,
        base64,
        contentType: 'image/jpeg',
        bytes: Math.round((base64.length * 3) / 4),
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Couldn't open ${file.name}`));
    };
    img.src = url;
  });

export const draftFromPhotos = async (photos, note) => {
  try {
    const res = await axios.post(
      `${BASE_URL_V2}/ai/listing-draft`,
      { images: photos.map((p) => ({ data: p.base64, contentType: p.contentType })), note },
      { ...auth(), timeout: 60000 }
    );
    return res.data.draft;
  } catch (error) {
    throw new Error(message(error, "I couldn't read that one. Fill it in here."));
  }
};

export const refineDraft = async (draft, instruction) => {
  try {
    const res = await axios.post(`${BASE_URL_V2}/ai/listing-draft/refine`, { draft, instruction }, { ...auth(), timeout: 60000 });
    return res.data.draft;
  } catch (error) {
    throw new Error(message(error, "I couldn't make that change. You can edit it directly."));
  }
};

export const fetchCategories = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/public/categories`);
    const rows = res.data?.categories || res.data?.data || res.data || [];
    const all = Array.isArray(rows) ? rows.map((c) => ({ name: c.name, subCategories: (c.subCategories || []).map((s) => s.name || s) })) : [];
    // Offer only the clothing categories once the server has them (older ones stay in the database)
    const launch = LAUNCH_CATEGORIES.map((name) => all.find((c) => c.name === name)).filter(Boolean);
    return launch.length ? launch : all;
  } catch {
    return [];
  }
};

// Publish through the same endpoint the full product form uses.
export const publishListing = async (listing) => {
  const weight = Number(listing.weightKg) || 1;
  const payload = {
    name: listing.title,
    description: listing.description,
    price: listing.price,
    salePrice: 0,
    stock: listing.quantity,
    condition: listing.condition,
    status: 'active',
    category: listing.category,
    subCategory: listing.subCategory || '',
    brand: listing.brand || '',
    tags: listing.tags,
    authenticity: listing.authenticity,
    sku: `SKU-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
    images: listing.photos.map((p, i) => ({ data: p.base64, contentType: p.contentType, isDefault: i === 0 })),
    variants: [],
    weight,
    shippingInfo: {
      weight: { value: weight, unit: 'kg' },
      dimensions: { length: 10, width: 10, height: 10 },
      freeShipping: false,
      shippingClass: 'standard',
    },
    ...(listing.auction ? { auction: { minBid: listing.auction.startingBid, ...(listing.auction.instant ? { maxBid: listing.auction.instant } : {}) } } : {}),
  };
  try {
    const res = await axios.post(`${BASE_URL}/products`, payload, { ...auth(), timeout: 90000 });
    return res.data?.product || res.data?.data || res.data;
  } catch (error) {
    throw new Error(message(error, "Couldn't publish. Check your connection and try again."));
  }
};
