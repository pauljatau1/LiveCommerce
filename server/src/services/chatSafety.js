// Chat safety: hide messages that could move a sale outside the app.
// Phone numbers, bank account numbers (10-digit NUBAN) and links are hidden;
// buyers see "1 message with a phone number was hidden", and the host can
// see the message and undo it.

// Digits written with spaces, dashes or dots in between ("0803 123 4567")
const DIGIT_RUN = /\+?\d(?:[\s\-.()]*\d){9,}/g;
const LINK = /\b(?:https?:\/\/|www\.)\S+|\b[a-z0-9-]+\.(?:com|ng|net|org|io|co|me|ly|app|link|shop|store|xyz|info|biz|online)\b(?:\/\S*)?|\b(?:wa\.me|t\.me|bit\.ly)\/\S*/i;

const LABELS = {
  phone: { one: 'a phone number', many: 'phone numbers' },
  account: { one: 'an account number', many: 'account numbers' },
  link: { one: 'a link', many: 'links' },
};

// → { hide: false } or { hide: true, kind: 'phone' | 'account' | 'link' }
const check = (text) => {
  const s = String(text || '');
  for (const run of s.match(DIGIT_RUN) || []) {
    const digits = run.replace(/\D/g, '');
    if (/^(?:234|0)[789][01]\d{8}$/.test(digits) || /^[789][01]\d{8}$/.test(digits)) return { hide: true, kind: 'phone' };
    if (digits.length === 10) return { hide: true, kind: 'account' };
    if (digits.length >= 11) return { hide: true, kind: 'phone' };
  }
  if (LINK.test(s)) return { hide: true, kind: 'link' };
  return { hide: false };
};

// "1 message with a phone number was hidden"
const buyerNotice = (kind, count = 1) => `${count} message${count === 1 ? '' : 's'} with ${count === 1 ? LABELS[kind]?.one : LABELS[kind]?.many} ${count === 1 ? 'was' : 'were'} hidden`;
// "Hid 1 message with a phone number"
const sellerNotice = (kind, count = 1) => `Hid ${count} message${count === 1 ? '' : 's'} with ${count === 1 ? LABELS[kind]?.one : LABELS[kind]?.many}`;

module.exports = { check, buyerNotice, sellerNotice };
