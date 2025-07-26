const ValidationError = require('../../../utils/errors/ValidationError');
const buyerRepository = require('../repositories/buyer.repository');

/**
 * Validate address update data.
 * 
 * @param {Object} data - Address update data
 * @param {string} buyerId - The buyer's ID
 * @param {string} addressId - The address ID to update
 * @throws {ValidationError} If validation fails
 */
async function validateUpdateAddressData(data, buyerId, addressId) {
  await validateAddressExists(buyerId, addressId);
  await validateAddressTypeUpdate(data.addressType, buyerId, addressId);
  await validateAddressTypeValue(data.addressType);
  await validateCountry(data.country);
  await validateState(data.state);
  await validateCity(data.city);
  await validateAddressLine1(data.addressLine1);
  await validateZipCode(data.zipCode);
}

/**
 * Validate that the address exists for the buyer.
 * 
 * @param {string} buyerId - The buyer's ID
 * @param {string} addressId - The address ID
 */
async function validateAddressExists(buyerId, addressId) {
  const buyer = await buyerRepository.findByIdWithShippingAddresses(buyerId);
  if (!buyer) {
    throw new ValidationError([{ field: 'buyer', message: 'Buyer not found' }]);
  }

  const addressIndex = buyer.shippingAddresses.findIndex(
    addr => addr._id.toString() === addressId
  );

  if (addressIndex === -1) {
    throw new ValidationError([{ field: 'addressId', message: 'Address not found' }]);
  }
}

/**
 * Validate address type update for uniqueness.
 * 
 * @param {string} addressType - The new address type
 * @param {string} buyerId - The buyer's ID
 * @param {string} addressId - The address ID being updated
 */
async function validateAddressTypeUpdate(addressType, buyerId, addressId) {
  if (!addressType) return;

  const buyer = await buyerRepository.findByIdWithShippingAddresses(buyerId);
  if (!buyer || !buyer.shippingAddresses) return;

  const currentAddress = findCurrentAddress(buyer.shippingAddresses, addressId);
  if (!currentAddress) return;

  if (isAddressTypeChanged(addressType, currentAddress.addressType)) {
    validateAddressTypeUniqueness(buyer.shippingAddresses, addressType, addressId);
  }
}

/**
 * Find the current address by ID.
 * 
 * @param {Array} shippingAddresses - Array of shipping addresses
 * @param {string} addressId - The address ID to find
 * @returns {Object|null} The current address or null if not found
 */
function findCurrentAddress(shippingAddresses, addressId) {
  return shippingAddresses.find(addr => addr._id.toString() === addressId);
}

/**
 * Check if the address type is being changed.
 * 
 * @param {string} newAddressType - The new address type
 * @param {string} currentAddressType - The current address type
 * @returns {boolean} True if the address type is being changed
 */
function isAddressTypeChanged(newAddressType, currentAddressType) {
  return newAddressType !== currentAddressType;
}

/**
 * Validate that the address type is unique among other addresses.
 * 
 * @param {Array} shippingAddresses - Array of shipping addresses
 * @param {string} addressType - The address type to validate
 * @param {string} addressId - The address ID being updated
 */
function validateAddressTypeUniqueness(shippingAddresses, addressType, addressId) {
  const existingAddressType = shippingAddresses.find(
    addr => addr.addressType === addressType && addr._id.toString() !== addressId
  );

  if (existingAddressType) {
    throw new ValidationError([{ 
      field: 'addressType', 
      message: `Address type '${addressType}' already exists`
    }]);
  }
}

/**
 * Validate that address type has a valid value.
 * 
 * @param {string} addressType - The address type
 */
async function validateAddressTypeValue(addressType) {
  if (!addressType) return;

  const validAddressTypes = ['home', 'work', 'other'];
  if (!validAddressTypes.includes(addressType)) {
    throw new ValidationError([{ 
      field: 'addressType', 
      message: 'Invalid address type',
      validTypes: validAddressTypes
    }]);
  }
}

/**
 * Validate country field.
 * 
 * @param {string} country - The country
 */
async function validateCountry(country) {
  if (country === undefined || country === null) return;
  
  if (typeof country !== 'string' || country.trim().length === 0) {
    throw new ValidationError([{ field: 'country', message: 'Country must be a valid string' }]);
  }
}

/**
 * Validate state field.
 * 
 * @param {string} state - The state
 */
async function validateState(state) {
  if (state === undefined || state === null) return;
  
  if (typeof state !== 'string' || state.trim().length === 0) {
    throw new ValidationError([{ field: 'state', message: 'State must be a valid string' }]);
  }
}

/**
 * Validate city field.
 * 
 * @param {string} city - The city
 */
async function validateCity(city) {
  if (city === undefined || city === null) return;
  
  if (typeof city !== 'string' || city.trim().length === 0) {
    throw new ValidationError([{ field: 'city', message: 'City must be a valid string' }]);
  }
}

/**
 * Validate address line 1 field.
 * 
 * @param {string} addressLine1 - The address line 1
 */
async function validateAddressLine1(addressLine1) {
  if (addressLine1 === undefined || addressLine1 === null) return;
  
  if (typeof addressLine1 !== 'string' || addressLine1.trim().length === 0) {
    throw new ValidationError([{ field: 'addressLine1', message: 'Address line 1 must be a valid string' }]);
  }
}

/**
 * Validate zip code field.
 * 
 * @param {string} zipCode - The zip code
 */
async function validateZipCode(zipCode) {
  if (zipCode === undefined || zipCode === null) return;
  
  if (typeof zipCode !== 'string' || zipCode.trim().length === 0) {
    throw new ValidationError([{ field: 'zipCode', message: 'Zip code must be a valid string' }]);
  }
}

module.exports = {
  validateUpdateAddressData,
  validateAddressExists,
  validateAddressTypeUpdate,
  validateAddressTypeValue,
  validateCountry,
  validateState,
  validateCity,
  validateAddressLine1,
  validateZipCode
}; 