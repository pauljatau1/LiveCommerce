const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Validate that address type is provided.
 * 
 * @param {string} addressType - The address type
 * @param {Array} errors - Array to collect errors
 */
async function validateAddressTypeRequired(addressType, errors) {
  if (!addressType) {
    errors.push({ field: 'addressType', message: 'Address type is required' });
  }
}

/**
 * Validate that address type has a valid value.
 * 
 * @param {string} addressType - The address type
 * @param {Array} errors - Array to collect errors
 */
async function validateAddressTypeValue(addressType, errors) {
  if (!addressType) return;

  const validAddressTypes = ['home', 'work', 'other'];
  if (!validAddressTypes.includes(addressType)) {
    errors.push({ 
      field: 'addressType', 
      message: 'Invalid address type',
      validTypes: validAddressTypes
    });
  }
}

/**
 * Validate address type.
 * 
 * @param {string} addressType - The address type
 * @param {string} buyerId - The buyer's ID
 * @param {Array} errors - Array to collect validation errors
 */
async function validateAddressType(addressType, buyerId, errors) {
  await validateAddressTypeRequired(addressType, errors);
  await validateAddressTypeValue(addressType, errors);
}

/**
 * Validate country field.
 * 
 * @param {string} country - The country
 * @param {Array} errors - Array to collect validation errors
 */
async function validateCountry(country, errors) {
  if (!country) {
    errors.push({ field: 'country', message: 'Country is required' });
  }
}

/**
 * Validate state field.
 * 
 * @param {string} state - The state
 * @param {Array} errors - Array to collect validation errors
 */
async function validateState(state, errors) {
  if (!state) {
    errors.push({ field: 'state', message: 'State is required' });
  }
}

/**
 * Validate city field.
 * 
 * @param {string} city - The city
 * @param {Array} errors - Array to collect validation errors
 */
async function validateCity(city, errors) {
  if (!city) {
    errors.push({ field: 'city', message: 'City is required' });
  }
}

/**
 * Validate address line 1 field.
 * 
 * @param {string} addressLine1 - The address line 1
 * @param {Array} errors - Array to collect validation errors
 */
async function validateAddressLine1(addressLine1, errors) {
  if (!addressLine1) {
    errors.push({ field: 'addressLine1', message: 'Address line 1 is required' });
  }
}

/**
 * Validate zip code field.
 * 
 * @param {string} zipCode - The zip code
 * @param {Array} errors - Array to collect validation errors
 */
async function validateZipCode(zipCode, errors) {
  if (!zipCode) {
    errors.push({ field: 'zipCode', message: 'Zip code is required' });
  }
}

/**
 * Validate address data before adding to buyer.
 * 
 * @param {Object} data - Address input data
 * @param {string} buyerId - The buyer's ID
 * @throws {ValidationError} If validation fails
 */
async function validateAddAddressData(data, buyerId) {
  const errors = [];

  await validateAddressType(data.addressType, buyerId, errors);
  await validateCountry(data.country, errors);
  await validateState(data.state, errors);
  await validateCity(data.city, errors);
  await validateAddressLine1(data.addressLine1, errors);
  await validateZipCode(data.zipCode, errors);

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateAddAddressData,
  validateAddressType,
  validateAddressTypeRequired,
  validateAddressTypeValue,
  validateCountry,
  validateState,
  validateCity,
  validateAddressLine1,
  validateZipCode
}; 