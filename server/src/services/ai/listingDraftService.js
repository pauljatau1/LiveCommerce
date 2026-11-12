// Photo-to-listing: Gemini drafts a product listing from seller photos.
//
// The model sees the photos, the seller's optional note and our category
// list, and must answer in a fixed JSON shape. Everything it returns is then
// checked here: categories must be ours, numbers must be sane, text is
// trimmed. The draft is a suggestion the seller confirms; nothing is saved.

const axios = require('axios');
const mongoose = require('mongoose');
const { CONDITIONS, LAUNCH_CATEGORY_NAMES } = require('../../config/catalogue');

const { NIGERIAN_FASHION_GUIDE } = require('./nigerianFashionGuide');

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const DEFAULT_MODEL = 'gemini-3.6-flash';
// Used when the main model is overloaded or slow (GEMINI_BACKUP_MODEL, 'none' to turn off)
const DEFAULT_BACKUP_MODEL = 'gemini-3.5-flash-lite';
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

const client = (timeout = 50000) =>
  axios.create({
    baseURL: API_BASE,
    timeout, // the studio waits 60s in total
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
    localStyle: { type: 'STRING', description: 'Local garment style, or empty for ordinary clothing' },
    fabric: { type: 'STRING', description: 'Recognisable fabric name, or empty if unsupported' },
    fabricConfidence: { type: 'STRING', enum: ['high', 'medium', 'low'] },
    styleConfidence: { type: 'STRING', enum: ['high', 'medium', 'low'] },
    colourVariants: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Same design in distinct colourways, e.g. Blue and white; empty for one colourway' },
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

// Legacy fields remain documented above for old drafts; generation is switched off.
const { franchise: _franchise, character: _character, ...activeProperties } = DRAFT_SCHEMA.properties;
const ACTIVE_DRAFT_SCHEMA = { ...DRAFT_SCHEMA, properties: activeProperties };

const loadCategories = async () => {
  const Category = mongoose.model('Category');
  const rows = await Category.find({}, { name: 1, 'subCategories.name': 1 }).lean();
  // Offer only the launch (clothing) categories once they exist; older
  // databases still hold the anime and gaming ones, which stay untouched.
  const launch = rows.filter((c) => LAUNCH_CATEGORY_NAMES.includes(c.name));
  return (process.env.LEGACY_CATEGORIES === 'true' ? rows : launch).map((c) => ({ name: c.name, subCategories: (c.subCategories || []).map((s) => s.name) }));
};

const buildInstructions = (categories, note) => `You help Nigerian sellers of clothing, shoes, bags and accessories list items for a live shopping app.
Draft a listing from the photos.
${NIGERIAN_FASHION_GUIDE}

Rules:
- Only state what is visible in the photos or written in the seller's note. Never invent the brand, material, size or measurements.
- Never ask about size. Mention a size only if the seller's note or a visible label gives it, and then only in the title or description, in the seller's words.
- If you are not sure of the brand, leave it empty.
- Never claim an item is original. Always include a question asking whether it is original or a replica.
- Condition is one of: New with tags (unworn, tags on), Thrift (second-hand from a thrift bale), Fairly used (worn by the seller or a previous owner). Use Unknown if the photos can't tell.
- Category and sub-category must be copied exactly from this list:
${categories.map((c) => `  - ${c.name}: ${c.subCategories.join(', ')}`).join('\n')}
- Prices are rough Nigerian resale estimates in naira (NGN). Give a realistic range, not a single number.
- Write for shoppers: friendly and clear, no hype words like "amazing" or "best".
- If photos show the same design in several colours, return colourVariants (one label per colourway). Never list any colours in the description in that case. Ask "How many of each colour?" instead of total quantity.
- Return fabricConfidence and styleConfidence separately. Never ask about entertainment catalogue fields.
- If condition is Unknown, always ask "Is it new with tags, thrift or fairly used?".
- Quantity and original/replica are always asked. If both condition and fabric/style need confirmation, combine them in one clarification with separate choices, so the total stays at most 3 questions.
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
  const colourVariants = [...new Set((Array.isArray(raw.colourVariants) ? raw.colourVariants : [])
    .map((v) => clean(v, 60)).filter(Boolean))].slice(0, 12);
  const condition = CONDITIONS.includes(raw.condition) ? raw.condition : null;
  const fabric = clean(raw.fabric, 60) || null;
  const localStyle = clean(raw.localStyle, 60) || null;
  const confirmations = [
    fabric && raw.fabricConfidence !== 'high' && { field: 'fabric', value: fabric, choices: [...new Set([fabric, 'Adire', 'Ankara', 'Other'])] },
    localStyle && raw.styleConfidence !== 'high' && { field: 'localStyle', value: localStyle, choices: [...new Set([localStyle, 'Bubu', 'Kaftan', 'Other'])] },
  ].filter(Boolean);
  // Build mandatory questions deterministically: model omissions must not hide
  // condition, stock or authenticity. One clarification card holds both choices.
  const questions = [colourVariants.length > 1 ? 'How many of each colour?' : 'How many do you have?', 'Is it original or a replica?'];
  if (!condition || confirmations.length) {
    questions.push([
      !condition ? 'Is it new with tags, thrift or fairly used?' : '',
      confirmations.map((c) => `Confirm ${c.field === 'fabric' ? 'fabric' : 'style'}: ${c.choices.join(' · ')}`).join('; '),
    ].filter(Boolean).join(' '));
  }
  let description = clean(raw.description, 1500);
  if (colourVariants.length) {
    // Defence against model slips: drop whole colour-bearing sentences rather
    // than leave broken lists. Keep the other factual sentences intact.
    const colourWords = new Set(colourVariants.join(' ').toLowerCase().match(/[a-z]+/g) || []);
    ['and', 'with', 'on', 'in'].forEach((w) => colourWords.delete(w));
    'blue white indigo red green yellow orange pink purple black brown grey gray cream beige navy teal gold silver maroon burgundy multicolour multicolor'.split(' ').forEach((w) => colourWords.add(w));
    description = (description.match(/[^.!?\n]+[.!?]?/g) || []).filter((sentence) =>
      !(sentence.toLowerCase().match(/[a-z]+/g) || []).some((w) => colourWords.has(w))
    ).map((sentence) => sentence.trim()).filter(Boolean).join('\n');
    if (!description) description = 'The photos show the design and details. Choose your preferred colourway.';
  }
  const weight = Number(raw.estimatedWeightKg);

  return {
    title: clean(raw.title, 80),
    category: category?.name || null,
    subCategory: subCategory || null,
    condition,
    fabric,
    localStyle,
    fabricConfidence: raw.fabricConfidence || 'low',
    styleConfidence: raw.styleConfidence || 'low',
    colourVariants,
    confirmations,
    description,
    tags: [...new Set((Array.isArray(raw.tags) ? raw.tags : []).map((t) => clean(t, 30).toLowerCase()).filter(Boolean))].slice(0, 8),
    franchise: clean(raw.franchise, 60) || null,
    character: clean(raw.character, 60) || null,
    brand: clean(raw.brand, 60) || null,
    suggestedPrice: low || high ? { low: low || high, high: high || low, currency: 'NGN', isEstimate: true } : null,
    weightKg: Number.isFinite(weight) && weight > 0 && weight < 50 ? Math.round(weight * 10) / 10 : 1,
    confidence: ['high', 'medium', 'low'].includes(raw.confidence) ? raw.confidence : 'low',
    questions,
  };
};

const busyOrSlow = (error) => [429, 500, 503].includes(error.response?.status) || error.code === 'ECONNABORTED';

const callModel = async (model, parts, timeout, schema = ACTIVE_DRAFT_SCHEMA) => {
  // Listing drafts don't need deep reasoning; low thinking keeps them fast.
  const thinkingLevel = (process.env.GEMINI_THINKING_LEVEL || 'LOW').toUpperCase();
  const request = (withThinking) =>
    client(timeout).post(`/models/${model}:generateContent`, {
      contents: [{ role: 'user', parts }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: schema,
        temperature: 0.4,
        ...(withThinking && thinkingLevel !== 'DEFAULT' ? { thinkingConfig: { thinkingLevel } } : {}),
      },
    });
  try {
    return await request(true);
  } catch (error) {
    // A model that doesn't accept this thinking level: try once with its default
    if (error.response?.status === 400 && /thinking/i.test(error.response?.data?.error?.message || '')) {
      console.warn('[ai] thinking level not accepted by', model, '- retrying with the model default');
      return request(false);
    }
    throw error;
  }
};

const logFailure = (model, error) =>
  // Google's reason, never the key, so failures can be diagnosed
  console.error('[ai] Gemini request failed:', { model, status: error.response?.status, reason: error.response?.data?.error?.message || error.code || error.message });

// `schema`: the JSON shape to answer in (listing drafts by default; show notes use their own)
const callGemini = async (parts, schema = ACTIVE_DRAFT_SCHEMA) => {
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const backupSetting = process.env.GEMINI_BACKUP_MODEL || DEFAULT_BACKUP_MODEL;
  const backup = backupSetting.toLowerCase() === 'none' || backupSetting === model ? null : backupSetting;
  let res;
  let usedModel = model;
  try {
    try {
      // Leave time for the backup inside the studio's 60s wait
      res = await callModel(model, parts, backup ? 28000 : 50000, schema);
    } catch (error) {
      if (!backup || !busyOrSlow(error)) throw error;
      logFailure(model, error);
      console.warn('[ai] main model busy or slow; using backup', backup);
      usedModel = backup;
      res = await callModel(backup, parts, 25000, schema);
    }
  } catch (error) {
    logFailure(usedModel, error);
    const status = error.response?.status;
    if (status === 429 || status === 503) throw new ListingDraftError(503, 'The AI is busy right now. Try again in a minute, or fill the form yourself.');
    if (error.code === 'ECONNABORTED') throw new ListingDraftError(504, 'The AI took too long on this one. Try again, or fill the form yourself.');
    throw new ListingDraftError(502, 'The AI could not draft this listing. You can fill the form yourself.');
  }
  const text = res.data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
  try {
    return JSON.parse(text);
  } catch {
    console.error('[ai] Gemini returned unreadable JSON:', { model: usedModel, finishReason: res.data?.candidates?.[0]?.finishReason, sample: text.slice(0, 200) });
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

// Diagnostics: time two tiny calls so a slow or broken connection to Gemini
// can be told apart from a slow draft. Returns no secrets.
const checkConnection = async () => {
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const thinkingLevel = (process.env.GEMINI_THINKING_LEVEL || 'LOW').toUpperCase();
  const timed = async (fn) => {
    const started = Date.now();
    try {
      const res = await fn();
      return { ok: true, status: res.status, ms: Date.now() - started, res };
    } catch (error) {
      return { ok: false, status: error.response?.status || null, ms: Date.now() - started, error: error.response?.data?.error?.message || error.code || error.message };
    }
  };
  const api = axios.create({ baseURL: API_BASE, timeout: 20000, headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY, 'Content-Type': 'application/json' } });
  const modelInfo = await timed(() => api.get(`/models/${model}`));
  const textTest = await timed(() => api.post(`/models/${model}:generateContent`, {
    contents: [{ role: 'user', parts: [{ text: 'Reply with the single word OK.' }] }],
    generationConfig: { temperature: 0, ...(thinkingLevel !== 'DEFAULT' ? { thinkingConfig: { thinkingLevel } } : {}) },
  }));
  const strip = ({ res, ...rest }) => rest;
  return {
    configured: isConfigured(),
    model,
    thinkingLevel,
    modelInfo: { ...strip(modelInfo), displayName: modelInfo.res?.data?.displayName },
    textTest: { ...strip(textTest), reply: textTest.res?.data?.candidates?.[0]?.content?.parts?.map((x) => x.text || '').join('').slice(0, 20) },
  };
};

module.exports = { callGemini, draftFromPhotos, refineDraft, normaliseDraft, isConfigured, checkConnection, ListingDraftError, DEFAULT_MODEL, DRAFT_SCHEMA, ACTIVE_DRAFT_SCHEMA, buildInstructions };
