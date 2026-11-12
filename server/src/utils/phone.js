// All entered phone numbers use the local 11-digit form. Spaces are display-only.
const PHONE_HINT = '11 digits starting with 0, e.g. 0803 123 4567.';
const PHONE_ERROR = 'Enter an 11-digit phone number starting with 0, e.g. 0803 123 4567.';
const phoneDigits = value => String(value ?? '').replace(/\s/g, '');
const phoneProblem = value => /^0\d{10}$/.test(phoneDigits(value)) ? '' : PHONE_ERROR;
module.exports = {PHONE_HINT, PHONE_ERROR, phoneDigits, phoneProblem};
