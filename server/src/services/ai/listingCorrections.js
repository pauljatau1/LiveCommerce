const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Category = require('../../models/Category');
const ListingCorrection = require('../../models/ListingCorrection');
const FIELDS = ['title', 'category', 'subCategory', 'fabric', 'localStyle'];
const snapshot = (draft) => Object.fromEntries(FIELDS.map((field) => [field, String(draft[field] || '').trim().slice(0, 100)]));

// A seller-bound proof keeps the original AI values intact through manual edits
// and refinements, without trusting a client-supplied "before" value.
const signDraft = (draft, sellerId) => jwt.sign(
  { purpose: 'listing-correction', sellerId: String(sellerId), original: snapshot(draft) },
  process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '7d' }
);
const readDraft = (proof, sellerId) => {
  if (!proof) {
    console.warn('[ai] Skipping listing correction: no draft proof.');
    return null; // Manual listings and older clients keep working.
  }
  try {
    const payload = jwt.verify(proof, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    if (payload.purpose !== 'listing-correction' || payload.sellerId !== String(sellerId) || !payload.original) throw new Error();
    const original = snapshot(payload.original);
    // Older proofs predate sub-category tracking. Do not invent a before value.
    if (!Object.prototype.hasOwnProperty.call(payload.original, 'subCategory')) delete original.subCategory;
    return original;
  } catch {
    // Never log the proof or turn optional learning data into a publish failure.
    console.warn('[ai] Skipping listing correction: expired or invalid draft proof.');
    return null;
  }
};

const categoryValue = (value) => String(value?.name || value?._id || value || '').trim();
const resolveCategoryNames = async (product) => {
  const category = categoryValue(product.category);
  const subCategory = categoryValue(product.subCategory);
  const categoryIsId = mongoose.isValidObjectId(category);
  const subCategoryIsId = mongoose.isValidObjectId(subCategory);
  if (!categoryIsId && !subCategoryIsId) return { category, subCategory };

  const row = await Category.findOne(categoryIsId ? { _id: category } : { name: category }).lean();
  if (!row) throw new Error('Category could not be resolved');
  const sub = subCategoryIsId ? row.subCategories.find((s) => String(s._id) === subCategory) : null;
  if (subCategoryIsId && !sub) throw new Error('Sub-category could not be resolved');
  return { category: row.name, subCategory: sub ? sub.name : subCategory };
};

const recordCorrection = async (original, product, sellerId) => {
  if (!original) return;
  try {
    const categoryNames = await resolveCategoryNames(product);
    const final = snapshot({ ...product.toObject(), ...categoryNames, title: product.name });
    const changes = FIELDS.filter((field) => Object.prototype.hasOwnProperty.call(original, field) && original[field] !== final[field])
      .map((field) => ({ field, draftValue: original[field], finalValue: final[field] }));
    if (changes.length) await ListingCorrection.updateOne(
      { product: product._id },
      { $setOnInsert: { seller: sellerId, product: product._id, changes } },
      { upsert: true }
    );
  } catch {
    // Publishing already succeeded; correction storage/lookup must be best-effort.
    console.warn('[ai] Could not record listing correction; publishing is unaffected.');
  }
};
module.exports = { signDraft, readDraft, recordCorrection };
