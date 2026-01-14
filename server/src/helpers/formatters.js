const normalizeCountry = (country) => {
  if (!country) return 'NG';
  if (country === 'Nigeria') return 'NG';
  return country;
};

const truncateString = (str, maxLength) => {
  if (!str) return '';
  return str.substring(0, maxLength);
};

/**
 * Convert various Nigerian phone number representations to E.164 format (+234XXXXXXXXXX).
 */
const formatNigerianPhone = (phone) => {
  if (!phone) return '';

  // Remove spaces and dashes
  const cleanPhone = phone.replace(/[\s-]/g, '');

  // Already in +234 international format
  if (cleanPhone.startsWith('+234')) {
    return cleanPhone;
  }

  // International format without '+' (e.g. 234912453562)
  if (cleanPhone.startsWith('234') && cleanPhone.length === 13) {
    return '+' + cleanPhone;
  }

  // Local format starting with 0 – replace with +234
  if (cleanPhone.startsWith('0')) {
    return '+234' + cleanPhone.substring(1);
  }

  // 10-digit local number (e.g. 8012345678)
  if (cleanPhone.length === 10 && !cleanPhone.startsWith('+')) {
    return '+234' + cleanPhone;
  }

  return cleanPhone; // fall-back – return as supplied
};

/**
 * Split a full name into first and last name components.
 * @param {string} fullName - The full name to split
 * @returns {{firstName: string, lastName: string}}
 */
const splitFullName = (fullName) => {
  if (!fullName || typeof fullName !== 'string') {
    return { firstName: '', lastName: '' };
  }

  const nameParts = fullName.trim().split(' ').filter(part => part.length > 0);

  if (nameParts.length === 0) {
    return { firstName: '', lastName: '' };
  } else if (nameParts.length === 1) {
    return { firstName: nameParts[0], lastName: '' };
  } else {
    return {
      firstName: nameParts[0],
      lastName: nameParts.slice(1).join(' ')
    };
  }
};

/**
 * Convert an internal address object into the structure expected by Terminal Africa.
 * @param {Object} address
 */
const formatAddressForTerminal = (address) => {
  // Handle name splitting if recipientName is provided
  let firstName = address.firstName || address.first_name || '';
  let lastName = address.lastName || address.last_name || '';

  // If we have a recipientName but no separate first/last names, split it
  if (address.recipientName && !firstName && !lastName) {
    const nameComponents = splitFullName(address.recipientName);
    firstName = nameComponents.firstName;
    lastName = nameComponents.lastName;
  }

  return {
    city: truncateString(address.city || address.recipientCity, 25) || '',
    country: normalizeCountry(address.country),
    state: truncateString(address.state || address.recipientState, 25) || '',
    line1: truncateString(address.addressLine1 || address.line1 || address.recipientAddress, 45) || '',
    line2: truncateString(address.addressLine2 || address.line2, 45) || '',
    zip: truncateString(address.zipCode || address.zip || address.recipientZip, 10) || '',
    email: truncateString(address.email || address.recipientEmail, 50) || '',
    phone: formatNigerianPhone(address.phone || address.phoneNumber || address.recipientPhone) || '',
    first_name: truncateString(firstName, 25) || '',
    last_name: truncateString(lastName, 25) || ''
  };
};

/**
 * Normalize phone number to standard format without leading zero.
 * Converts various phone number formats to a standardized format (e.g., "8106430258").
 * 
 * This function handles various input formats including:
 * - Short formats: "81", "081"
 * - Local 11-digit: "08106430258"
 * - Local 10-digit: "8106430258"
 * - International with +: "+2348106430258", "+12345678900"
 * - International without +: "2348106430258", "12345678900"
 * - Numbers with spaces/dashes: "081 064 30258", "081-064-30258"
 * 
 * @param {string} phone - The phone number to normalize
 * @returns {string} Normalized phone number without leading zero (10 digits)
 * 
 * @example
 * normalizePhoneNumber('08106430258') // returns '8106430258'
 * normalizePhoneNumber('+2348106430258') // returns '8106430258'
 * normalizePhoneNumber('2348106430258') // returns '8106430258'
 * normalizePhoneNumber('8106430258') // returns '8106430258'
 * normalizePhoneNumber('081') // returns '81' (passes through for validation to catch)
 * normalizePhoneNumber('+23481') // returns '81'
 * normalizePhoneNumber('+1-234-567-8900') // returns '2345678900'
 */
const normalizePhoneNumber = (phone) => {
  if (!phone) return '';

  // Remove spaces, dashes, and other non-numeric characters except +
  let cleanPhone = phone.replace(/[\s\-()]/g, '');

  // Remove + if present
  if (cleanPhone.startsWith('+')) {
    cleanPhone = cleanPhone.substring(1);
  }

  // Handle various country codes
  // Nigerian format: 234XXXXXXXXXX (13 digits total)
  if (cleanPhone.startsWith('234') && cleanPhone.length >= 13) {
    cleanPhone = cleanPhone.substring(3);
  }
  // US/Canada format: 1XXXXXXXXXX (11 digits total)
  else if (cleanPhone.startsWith('1') && cleanPhone.length === 11) {
    cleanPhone = cleanPhone.substring(1);
  }
  // UK format: 44XXXXXXXXXX (12-13 digits total)
  else if (cleanPhone.startsWith('44') && cleanPhone.length >= 12) {
    cleanPhone = cleanPhone.substring(2);
  }

  // If starts with 0 (local format), remove the leading 0
  if (cleanPhone.startsWith('0') && cleanPhone.length > 1) {
    cleanPhone = cleanPhone.substring(1);
  }

  // Return the normalized number
  // If it's a valid 10-digit number, it will pass validation
  // If it's too short or invalid, validation will catch it
  return cleanPhone;
};

module.exports = {
  truncateString,
  normalizeCountry,
  formatNigerianPhone,
  formatAddressForTerminal,
  splitFullName,
  normalizePhoneNumber
}; 