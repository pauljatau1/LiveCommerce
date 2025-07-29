const ValidationError = require('../../../utils/errors/ValidationError');
const buyerRepository = require('../repositories/buyer.repository');

/**
 * Validate address data before adding to buyer.
 * 
 * @param {Object} data - Address input data
 * @param {string} buyerId - The buyer's ID
 * @throws {ValidationError} If validation fails
 */
async function validateAddAddressData(data, buyerId) {
  await validateAddressType(data.addressType, buyerId);
  await validateCountry(data.country);
  await validateState(data.state);
  await validateCity(data.city);
  await validateAddressLine1(data.addressLine1);
  await validateZipCode(data.zipCode);
}

/**
 * Validate address type.
 * 
 * @param {string} addressType - The address type
 * @param {string} buyerId - The buyer's ID
 */
async function validateAddressType(addressType, buyerId) {
  const errors = [];
  
  await validateAddressTypeRequired(addressType, errors);
  await validateAddressTypeValue(addressType, errors);

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  return;
}

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
 * Validate country field.
 * 
 * @param {string} country - The country
 */
async function validateCountry(country) {
  const errors = [];
  
  if (!country) {
    errors.push({ field: 'country', message: 'Country is required' });
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  return;
}

/**
 * Validate state field.
 * 
 * @param {string} state - The state
 */
async function validateState(state) {
  const errors = [];
  
  if (!state) {
    errors.push({ field: 'state', message: 'State is required' });
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  return;
}

/**
 * Validate city field.
 * 
 * @param {string} city - The city
 */
async function validateCity(city) {
  const errors = [];
  
  if (!city) {
    errors.push({ field: 'city', message: 'City is required' });
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  return;
}

/**
 * Validate address line 1 field.
 * 
 * @param {string} addressLine1 - The address line 1
 */
async function validateAddressLine1(addressLine1) {
  const errors = [];
  
  if (!addressLine1) {
    errors.push({ field: 'addressLine1', message: 'Address line 1 is required' });
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  return;
}

/**
 * Validate zip code field.
 * 
 * @param {string} zipCode - The zip code
 */
async function validateZipCode(zipCode) {
  const errors = [];
  
  if (!zipCode) {
    errors.push({ field: 'zipCode', message: 'Zip code is required' });
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  return;
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