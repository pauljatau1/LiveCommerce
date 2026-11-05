// Photo-to-listing: Gemini drafts a product listing from seller photos.
//
// The model sees the photos, the seller's optional note and our category
// list, and must answer in a fixed JSON shape. Everything it returns is then
// checked here: categories must be ours, numbers must be sane, text is
// trimmed. The draft is a suggestion the seller confirms; nothing is saved.

const axios = require('axios');
const mongoose = require('mongoose');

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const DEFAULT_MODEL = 'gemini-3.8-flash';
const CONDITIONS = ['Brand New', 'Fairly Used', 'Refurbished'];
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGES = 5;
const MAX_IMAGE_BYTES = 3 * 1024 * 1024; // 5 photos stay under the 25 MB request limit

class ListingDraftError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const isConfigured = () => Boolean(process.env.GEMINI_API_KEY);

const client = () =>
  axios.create({
    baseURL: API_BASE,
    timeout: 45000,
    headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY, 'Content-Type': 'application/json' },
  });

const DRAFT_SCHEMA = {
  type: 'OBJECT',
  properties: {
    title: { type: 'STRING', description: 'Short buyer-facing title, max 80 characters' },
    category: { type: 'STRING', description: 'Exactly one category name from the list, or empty if none fits' },
    subCategory: { type: 'STRING', description: 'Exactly one sub-category of that category, or empty' },
    condition: { type: 'STRING', enum: [...CONDITIONS, 'Unknown'] },
    description: { type: 'STRING', description: '2-4 short paragraphs, only facts visible or stated by the seller' },
    tags: { type: 'ARRAY', items: { type: 'STRING' } },
    franchise: { type: 'STRING', description: 'Series, game or franchise, or empty if unsure' },
    character: { type: 'STRING', description: 'Character shown, or empty if unsure' },
    brand: { type: 'STRING', description: 'Maker or brand only if visible on the item or box, else empty' },
    priceLowNGN: { type: 'NUMBER', description: 'Low end of a typical Nigerian resale price in naira' },
    priceHighNGN: { type: 'NUMBER', description: 'High end of a typical Nigerian resale price in naira' },
    estimatedWeightKg: { type: 'NUMBER' },
    confidence: { type: 'STRING', enum: ['high', 'medium', 'low'] },
    questions: {
      type: 'ARRAY',
      description: 'What to ask the seller: things the photos cannot show',
      items: { type: 'STRING' },
    },
  },
  required: ['title', 'category', 'condition', 'description', 'tags', 'confidence', 'questions'],
};

const loadCategories = async () => {
  const Category = mongoose.model('Category');
  const rows = await Category.find({}, { name: 1, 'subCategories.name': 1 }).lean();
  return rows.map((c) => ({ name: c.name, subCategories: (c.subCategories || []).map((s) => s.name) }));
};

const buildInstructions = (categories, note) => `You help Nigerian sellers of anime, manga, comics and gaming merchandise list items for a live shopping app.
Draft a listing from the photos.

Rules:
- Only state what is visible in the photos or written in the seller's note. Never invent scale, edition, release year, size or accessories.
- If you are not sure of the franchise or character, leave it empty and ask.
- Never claim an item is official or authentic. Always include a question asking whether it is official merchandise.
- Category and sub-category must be copied exactly from this list:
${categories.map((c) => `  - ${c.name}: ${c.subCategories.join(', ')}`).join('\n')}
- Prices are rough Nigerian resale estimates in naira (NGN). Give a realistic range, not a single number.
- Write for fans: friendly and clear, no hype words like "amazing" or "best".
- Ask at most 3 questions, only about things the photos cannot answer (quantity is always one of them).
${note ? `\nSeller's note: """${String(note).slice(0, 500)}"""` : ''}`;

const validateImages = (images) => {
  if (!Array.isArray(images) || images.length === 0) throw new ListingDraftError(400, 'Add at least one photo');
  if (images.length > MAX_IMAGES) throw new ListingDraftError(400, `Use up to ${MAX_IMAGES} photos`);
  return images.map((img, i) => {
    const contentType = String(img?.contentType || '').toLowerCase();
    const data = String(img?.data || '').replace(/^data:[^;]+;base64,/, '');
    if (!IMAGE_TYPES.includes(contentType)) throw new ListingDraftError(400, `Photo ${i + 1} must be JPEG, PNG or WebP`);
    if (!data || Buffer.byteLength(data, 'base64') > MAX_IMAGE_BYTES) {
      throw new ListingDraftError(400, `Photo ${i + 1} is empty or larger than 3 MB`);
    }
    return { inline_data: { mime_type: contentType, data } };
  });
};

const clean = (value, max) => String(value || '').replace(/\s+\n/g, '\n').trim().slice(0, max);
const roundPrice = (n) => (Number.isFinite(n) && n > 0 ? Math.round(n / 500) * 500 : null);

// Make the model's answer safe to show: our categories only, sane numbers.
const normaliseDraft = (raw, categories) => {
  const category = categories.find((c) => c.name.toLowerCase() === String(raw.category || '').toLowerCase());
  const subCategory = category?.subCategories.find((s) => s.toLowerCase() === String(raw.subCategory || '').toLowerCase());
  let low = roundPrice(Number(raw.priceLowNGN));
  let high = roundPrice(Number(raw.priceHighNGN));
  if (low && high && low > high) [low, high] = [high, low];
  const questions = (Array.isArray(raw.questions) ? raw.questions : []).map((q) => clean(q, 200)).filter(Boolean);
  if (!questions.some((q) => /official|authentic|original|bootleg/i.test(q))) {
    questions.push('Is this official merchandise, or a replica?');
  }
  const weight = Number(raw.estimatedWeightKg);

  return {
    title: clean(raw.title, 80),
    category: category?.name || null,
    subCategory: subCategory || null,
    condition: CONDITIONS.includes(raw.condition) ? raw.condition : null,
    description: clean(raw.description, 1500),
    tags: [...new Set((Array.isArray(raw.tags) ? raw.tags : []).map((t) => clean(t, 30).toLowerCase()).filter(Boolean))].slice(0, 8),
    franchise: clean(raw.franchise, 60) || null,
    character: clean(raw.character, 60) || null,
    brand: clean(raw.brand, 60) || null,
    suggestedPrice: low || high ? { low: low || high, high: high || low, currency: 'NGN', isEstimate: true } : null,
    weightKg: Number.isFinite(weight) && weight > 0 && weight < 50 ? Math.round(weight * 10) / 10 : 1,
    confidence: ['high', 'medium', 'low'].includes(raw.confidence) ? raw.confidence : 'low',
    questions: questions.slice(0, 4),
  };
};

const callGemini = async (parts) => {
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  let res;
  try {
    res = await client().post(`/models/${model}:generateContent`, {
      contents: [{ role: 'user', parts }],
      generationConfig: { responseMimeType: 'application/json', responseSchema: DRAFT_SCHEMA, temperature: 0.4 },
    });
  } catch (error) {
    const status = error.response?.status;
    // Log Google's reason (never the key) so failures can be diagnosed
    console.error('[ai] Gemini request failed:', { model, status, reason: error.response?.data?.error?.message || error.code || error.message });
    if (status === 429) throw new ListingDraftError(503, 'The AI is busy right now. Try again in a minute, or fill the form yourself.');
    throw new ListingDraftError(502, 'The AI could not draft this listing. You can fill the form yourself.');
  }
  const text = res.data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
  try {
    return JSON.parse(text);
  } catch {
    console.error('[ai] Gemini returned unreadable JSON:', { model, finishReason: res.data?.candidates?.[0]?.finishReason, sample: text.slice(0, 200) });
    throw new ListingDraftError(502, 'The AI returned an unreadable draft. Try again, or fill the form yourself.');
  }
};

const draftFromPhotos = async ({ images, note }) => {
  if (!isConfigured()) throw new ListingDraftError(503, 'AI listing is not switched on for this server');
  const imageParts = validateImages(images);
  const categories = await loadCategories();
  const raw = await callGemini([{ text: buildInstructions(categories, note) }, ...imageParts]);
  return normaliseDraft(raw, categories);
};

// Apply a seller's instruction ("shorter title", "funnier description") to a draft.
const refineDraft = async ({ draft, instruction }) => {
  if (!isConfigured()) throw new ListingDraftError(503, 'AI listing is not switched on for this server');
  if (!draft || typeof draft !== 'object') throw new ListingDraftError(400, 'Send the current draft');
  const ask = clean(instruction, 400);
  if (!ask) throw new ListingDraftError(400, 'Say what to change');
  const categories = await loadCategories();
  const raw = await callGemini([
    {
      text: `${buildInstructions(categories)}

Here is the current listing draft as JSON:
${JSON.stringify(draft).slice(0, 6000)}

The seller asks: """${ask}"""
Return the full updated draft. Change only what the seller asked for; keep every other field as it is.`,
    },
  ]);
  const updated = normaliseDraft({ ...draft, ...raw }, categories);
  // Keep the seller's own decisions (price, quantity) out of the model's hands
  return { ...updated, suggestedPrice: draft.suggestedPrice ?? updated.suggestedPrice };
};

module.exports = { draftFromPhotos, refineDraft, normaliseDraft, isConfigured, ListingDraftError, DEFAULT_MODEL };
