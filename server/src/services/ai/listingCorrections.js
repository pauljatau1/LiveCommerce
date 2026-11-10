const jwt = require('jsonwebtoken');
const ListingCorrection = require('../../models/ListingCorrection');
const FIELDS = ['title', 'category', 'fabric', 'localStyle'];
const snapshot = (draft) => Object.fromEntries(FIELDS.map((field) => [field, String(draft[field] || '').trim().slice(0, 100)]));

// A seller-bound proof keeps the original AI values intact through manual edits
// and refinements, without trusting a client-supplied "before" value.
const signDraft = (draft, sellerId) => jwt.sign(
  { purpose: 'listing-correction', sellerId: String(sellerId), original: snapshot(draft) },
  process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '7d' }
);
const readDraft = (proof, sellerId) => {
  if (!proof) return null; // Manual listings and older clients keep working.
  try {
    const payload = jwt.verify(proof, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    if (payload.purpose !== 'listing-correction' || payload.sellerId !== String(sellerId) || !payload.original) throw new Error();
    return snapshot(payload.original);
  } catch {
    const error = new Error('The AI draft has expired or is invalid. Generate a new draft before publishing.');
    error.status = 400;
    throw error;
  }
};
const recordCorrection = async (original, product, sellerId) => {
  if (!original) return;
  const final = snapshot({ ...product.toObject(), title: product.name });
  const changes = FIELDS.filter((field) => original[field] !== final[field])
    .map((field) => ({ field, draftValue: original[field], finalValue: final[field] }));
  if (changes.length) await ListingCorrection.updateOne(
    { product: product._id },
    { $setOnInsert: { seller: sellerId, product: product._id, changes } },
    { upsert: true }
  );
};
module.exports = { signDraft, readDraft, recordCorrection };
