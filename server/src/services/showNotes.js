// Show notes: one pinned announcement per show, owned by the seller.
// Fixed sections in a fixed order; 600 characters in all; no links, phone or
// account numbers; "Never pay outside the app." is always in Payment and safety.
// The assistant drafts them from the show plan, and suggests additions when
// chat keeps asking the same thing.

const chatSafety = require('./chatSafety');

const SECTIONS = [
  ['howToBuy', 'How to buy'],
  ['delivery', 'Delivery'],
  ['payment', 'Payment and safety'],
  ['sizes', 'Sizes and returns'],
  ['fromSeller', 'From the seller'],
];
const KEYS = SECTIONS.map(([k]) => k);
const MAX_CHARS = 600;
const ALWAYS = 'Never pay outside the app.';

class NotesError extends Error {
  constructor(message) { super(message); this.status = 400; }
}

const clean = (s) => String(s || '').replace(/\s+/g, ' ').trim();

// Make sure the safety line is there, once, at the start of Payment and safety
const withSafetyLine = (payment) => {
  const rest = clean(payment).replace(/never pay outside the app\.?/gi, '').trim();
  return rest ? `${ALWAYS} ${rest}` : ALWAYS;
};

const totalChars = (notes) => KEYS.reduce((n, k) => n + clean(notes?.[k]).length, 0);

// Checks and tidies notes from the seller (or the AI). Throws NotesError in plain words.
const normalise = (input = {}) => {
  const out = {};
  KEYS.forEach((k) => { out[k] = clean(input[k]); });
  out.payment = withSafetyLine(out.payment);
  for (const [k, label] of SECTIONS) {
    const hit = chatSafety.check(out[k]);
    if (hit.hide) {
      const what = { phone: 'phone numbers', account: 'account numbers', link: 'links' }[hit.kind];
      throw new NotesError(`Take out the ${what} in "${label}". Buyers pay and talk to you in the app.`);
    }
  }
  const total = totalChars(out);
  if (total > MAX_CHARS) throw new NotesError(`Show notes can be ${MAX_CHARS} characters. These are ${total}: shorten them a little.`);
  return out;
};

// The first line buyers see under the host: "Show notes · <first line>"
const firstLine = (notes) => {
  if (!notes) return '';
  const first = KEYS.map((k) => clean(notes[k])).find(Boolean) || '';
  const sentence = first.split(/(?<=[.!?])\s/)[0];
  return sentence.length > 80 ? `${sentence.slice(0, 77)}…` : sentence;
};

const isEmpty = (notes) => !notes || KEYS.every((k) => !clean(notes[k]) || (k === 'payment' && clean(notes[k]) === ALWAYS));

// ---------- drafting ----------

// Without the AI: a plain starting point from the plan.
const templateDraft = ({ type, auctionSeconds, hostName } = {}) => normalise({
  howToBuy: type === 'drop'
    ? 'Tap Buy now while an item is on screen. Stock is real: when it says 2 left, there are 2 left.'
    : `Tap Bid to bid. Each item runs ${auctionSeconds && auctionSeconds !== 30 ? `${auctionSeconds >= 120 ? '2 minutes' : `${auctionSeconds} seconds`}` : '30 seconds'}, and a bid in the last 5 seconds adds 5 seconds. Highest bid wins.`,
  delivery: 'One delivery fee for everything you get from this show. Shipbubble prices it to your address: that amount is held with your first item, and the final fee is quoted after the show.',
  payment: 'Bids are held from your wallet and come back if someone outbids you.',
  sizes: "Sizes are in each item's title. Ask in chat before you bid if you're not sure.",
  fromSeller: hostName ? `Thanks for coming. I'm ${hostName}: ask me anything in chat.` : 'Thanks for coming. Ask me anything in chat.',
});

const NOTES_SCHEMA = {
  type: 'OBJECT',
  properties: Object.fromEntries(KEYS.map((k) => [k, { type: 'STRING' }])),
  required: KEYS,
};

// With the AI (Gemini): drafted from the plan, then checked like anything else.
const draft = async (plan = {}, { gemini } = {}) => {
  const fallback = () => ({ notes: templateDraft(plan), ai: false });
  const ai = gemini || require('./ai/listingDraftService');
  if (!ai.isConfigured || !ai.isConfigured()) return fallback();
  const items = (plan.items || []).slice(0, 12).map((i) => `- ${clean(i.name).slice(0, 60)}${i.price ? ` (₦${Number(i.price).toLocaleString('en-NG')})` : ''}`).join('\n');
  const prompt = `You write short show notes for a Nigerian live clothing sale. The seller pins them for buyers.
Write five short sections, plain and warm, no hype, no exclamation marks, no emojis:
- howToBuy: how to ${plan.type === 'drop' ? 'buy (fixed price, tap Buy now, stock is real)' : `bid (tap Bid; each item runs ${plan.auctionSeconds || 30} seconds; a bid in the last 5 seconds adds 5 seconds; highest bid wins)`}.
- delivery: one delivery fee for everything a buyer gets in this show. Shipbubble prices it to the buyer's address and that amount is held with their first item; the final fee is quoted after the show. Never state a naira amount for delivery.${plan.pickupArea ? ` Items ship from ${clean(plan.pickupArea)}.` : ''}
- payment: bids are held from the wallet and come back if outbid. Do not include phone numbers, account numbers or links.
- sizes: sizes are in each item's title or description, in the seller's words; ask in chat before bidding. Do not invent sizes or a returns policy the seller didn't give.
- fromSeller: one friendly line from the seller${plan.hostName ? ` (${clean(plan.hostName)})` : ''}.
All five together must be under 450 characters.
Show: ${clean(plan.title).slice(0, 80)}
Items:
${items || '- (not picked yet)'}`;
  try {
    const raw = await ai.callGemini([{ text: prompt }], NOTES_SCHEMA);
    return { notes: normalise(raw), ai: true };
  } catch (e) {
    console.warn('[show-notes] AI draft not used:', e.message);
    return fallback();
  }
};

// ---------- "4 people asked about delivery to Port Harcourt. Add it?" ----------

const QUESTION = /\?|\b(how much|how many|abeg|pls|please|do you|does it|is it|is this|e get|una|wetin|can i|can you)\b/i;
const TOPICS = [
  { topic: 'delivery', section: 'delivery', test: /\b(deliver\w*|ship\w*|waybill|dispatch|send (it )?to)\b/i },
  { topic: 'sizes', section: 'sizes', test: /\b(size|sizes|fit|fits|small|big|large|uk ?\d+|eu ?\d+)\b/i },
  { topic: 'returns', section: 'sizes', test: /\b(return|refund|exchange)\w*\b/i },
  { topic: 'original', section: 'fromSeller', test: /\b(original|fake|replica|authentic|orijin\w*)\b/i },
];
const PLACE = /\b(?:to|for|in)\s+((?:[A-Z][a-z]+|PH|FCT|Abuja)(?:\s(?:[A-Z][a-z]+))?)/;
const ALIASES = { PH: 'Port Harcourt' };
const WINDOW_MS = 15 * 60 * 1000;
const THRESHOLD = 3;

const LINES = {
  delivery: (place) => `We deliver to ${place || 'all states'}. One fee for everything you get, quoted after the show.`,
  sizes: () => "Sizes are in each item's title. Ask in chat before you bid if you're not sure.",
  returns: () => 'Check sizes before you bid. Message me in the app after delivery if something is wrong.',
  original: () => 'Each item says original or replica in its details.',
};

const createSuggester = ({ now = () => Date.now() } = {}) => {
  const asks = new Map(); // `${streamId}|${topic}|${place}` -> Map(askerId -> time)
  const offered = new Set();

  // Returns a suggestion for the host, or null
  const observe = (streamId, askerId, text) => {
    const s = String(text || '');
    if (!QUESTION.test(s)) return null;
    for (const t of TOPICS) {
      if (!t.test.test(s)) continue;
      let place = t.topic === 'delivery' ? (s.match(PLACE)?.[1] || '') : '';
      place = ALIASES[place] || place;
      const key = `${streamId}|${t.topic}|${place.toLowerCase()}`;
      if (offered.has(key)) return null;
      const who = asks.get(key) || new Map();
      who.set(String(askerId), now());
      [...who].forEach(([id, at]) => { if (now() - at > WINDOW_MS) who.delete(id); });
      asks.set(key, who);
      if (who.size >= THRESHOLD) {
        offered.add(key);
        const about = t.topic === 'delivery' ? `delivery${place ? ` to ${place}` : ''}` : t.topic === 'original' ? 'whether items are original' : t.topic;
        return { topic: t.topic, section: t.section, place: place || null, count: who.size, text: `${who.size} people asked about ${about}. Add it?`, line: LINES[t.topic](place) };
      }
      return null;
    }
    return null;
  };
  const reset = (streamId) => { [...offered].forEach((k) => k.startsWith(`${streamId}|`) && offered.delete(k)); };
  return { observe, reset };
};

const suggester = createSuggester();

module.exports = { SECTIONS, KEYS, MAX_CHARS, ALWAYS, NotesError, normalise, firstLine, isEmpty, templateDraft, draft, createSuggester, suggester };
