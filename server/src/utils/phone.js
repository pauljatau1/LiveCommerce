// Canonical storage: 0XXXXXXXXXX. International formats are transport-only.
const PHONE_HINT = '11 digits starting with 0, e.g. 0803 123 4567.';
const PHONE_ERROR = 'Enter an 11-digit phone number starting with 0, e.g. 0803 123 4567.';
const phoneDigits = value => String(value ?? '').replace(/\s/g, '');
const phoneProblem = value => /^0\d{10}$/.test(phoneDigits(value)) ? '' : PHONE_ERROR;
function normalisePhone(value) {
  const input = String(value ?? '').trim().replace(/[\s()\-]/g, '');
  if (/^0\d{10}$/.test(input)) return input;
  if (/^[1-9]\d{9}$/.test(input)) return `0${input}`;
  if (/^\+?234[1-9]\d{9}$/.test(input)) return `0${input.replace(/^\+?234/, '')}`;
  return null; // Never truncate an invalid number into a different person's number.
}
function storedPhone(value) {
  if (value == null || value === '') return value;
  const phone = normalisePhone(value);
  if (!phone) throw new Error(PHONE_ERROR);
  return phone;
}
const internationalPhone = value => {const phone=normalisePhone(value);return phone ? `+234${phone.slice(1)}` : '';};
module.exports = {PHONE_HINT, PHONE_ERROR, phoneDigits, phoneProblem, normalisePhone, storedPhone, internationalPhone};
