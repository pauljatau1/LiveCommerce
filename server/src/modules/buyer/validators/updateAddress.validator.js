/**
 * Update Address Validator
 *
 * This validator handles input validation for updating addresses in a buyer's profile.
 * It provides functionality to:
 * - Validate address existence and ownership
 * - Validate address type uniqueness and format
 * - Validate address field formats and content
 * - Ensure data integrity and security standards
 * - Maintain consistent validation patterns
 *
 * The validator ensures that address update requests are properly formatted
 * and contain valid data to prevent unauthorized modifications and maintain data integrity.
 *
 * @module updateAddressValidator
 */

const ValidationError = require('../../../utils/errors/ValidationError');
const buyerRepository = require('../repositories/buyer.repository');

/**
 * Validate address update data.
 *
 * This function orchestrates the complete validation process for address
 * update requests, ensuring all parameters meet validation requirements.
 *
 * Business Logic Flow:
 * 1. Initialize error collection array
 * 2. Validate address existence and ownership
 * 3. Validate address type update for uniqueness
 * 4. Validate address type value format
 * 5. Validate all address field formats and content
 * 6. Throw ValidationError if any validation fails
 *
 * Security Considerations:
 * - Address existence validation prevents unauthorized modifications
 * - Address type uniqueness validation maintains data integrity
 * - Field validation prevents injection attacks
 * - Error collection provides comprehensive feedback
 *
 * @param {Object} data - Address update data
 * @param {string} buyerId - The buyer's ID
 * @param {string} addressId - The address ID to update
 * @param {string} [data.addressType] - The address type (home, work, other)
 * @param {string} [data.country] - The country
 * @param {string} [data.state] - The state
 * @param {string} [data.city] - The city
 * @param {string} [data.addressLine1] - The address line 1
 * @param {string} [data.zipCode] - The zip code
 * @throws {ValidationError} If validation fails
 */
async function validateUpdateAddressData(data, buyerId, addressId) {
  const errors = [];

  await validateAddressExists(buyerId, addressId, errors);
  await validateAddressTypeUpdate(data.addressType, buyerId, addressId, errors);
  await validateAddressTypeValue(data.addressType, errors);
  await validateCountry(data.country, errors);
  await validateState(data.state, errors);
  await validateCity(data.city, errors);
  await validateAddressLine1(data.addressLine1, errors);
  await validateZipCode(data.zipCode, errors);

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

/**
 * Validate that the address exists for the buyer.
 * 
 * @param {string} buyerId - The buyer's ID
 * @param {string} addressId - The address ID
 * @param {Array} errors - Array to collect validation errors
 */
async function validateAddressExists(buyerId, addressId, errors) {
  const buyer = await buyerRepository.findByIdWithShippingAddresses(buyerId);
  if (!buyer) {
    errors.push({ field: 'buyer', message: 'Buyer not found' });
    return;
  }

  const addressIndex = buyer.shippingAddresses.findIndex(
    addr => addr._id.toString() === addressId
  );

  if (addressIndex === -1) {
    errors.push({ field: 'addressId', message: 'Address not found' });
  }
}

/**
 * Validate address type update for uniqueness.
 * 
 * @param {string} addressType - The new address type
 * @param {string} buyerId - The buyer's ID
 * @param {string} addressId - The address ID being updated
 * @param {Array} errors - Array to collect validation errors
 */
async function validateAddressTypeUpdate(addressType, buyerId, addressId, errors) {
  if (!addressType) return;

  const buyer = await buyerRepository.findByIdWithShippingAddresses(buyerId);
  if (!buyer || !buyer.shippingAddresses) return;

  const currentAddress = findCurrentAddress(buyer.shippingAddresses, addressId);
  if (!currentAddress) return;

  if (isAddressTypeChanged(addressType, currentAddress.addressType)) {
    validateAddressTypeUniqueness(buyer.shippingAddresses, addressType, addressId, errors);
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
 * @param {Array} errors - Array to collect validation errors
 */
function validateAddressTypeUniqueness(shippingAddresses, addressType, addressId, errors) {
  const existingAddressType = shippingAddresses.find(
    addr => addr.addressType === addressType && addr._id.toString() !== addressId
  );

  if (existingAddressType) {
    errors.push({ 
      field: 'addressType', 
      message: `Address type '${addressType}' already exists`
    });
  }
}

/**
 * Validate that address type has a valid value.
 * 
 * @param {string} addressType - The address type
 * @param {Array} errors - Array to collect validation errors
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
 * @param {Array} errors - Array to collect validation errors
 */
async function validateCountry(country, errors) {
  if (country === undefined || country === null) return;
  
  if (typeof country !== 'string' || country.trim().length === 0) {
    errors.push({ field: 'country', message: 'Country must be a valid string' });
  }
}

/**
 * Validate state field.
 * 
 * @param {string} state - The state
 * @param {Array} errors - Array to collect validation errors
 */
async function validateState(state, errors) {
  if (state === undefined || state === null) return;
  
  if (typeof state !== 'string' || state.trim().length === 0) {
    errors.push({ field: 'state', message: 'State must be a valid string' });
  }
}

/**
 * Validate city field.
 * 
 * @param {string} city - The city
 * @param {Array} errors - Array to collect validation errors
 */
async function validateCity(city, errors) {
  if (city === undefined || city === null) return;
  
  if (typeof city !== 'string' || city.trim().length === 0) {
    errors.push({ field: 'city', message: 'City must be a valid string' });
  }
}

/**
 * Validate address line 1 field.
 * 
 * @param {string} addressLine1 - The address line 1
 * @param {Array} errors - Array to collect validation errors
 */
async function validateAddressLine1(addressLine1, errors) {
  if (addressLine1 === undefined || addressLine1 === null) return;
  
  if (typeof addressLine1 !== 'string' || addressLine1.trim().length === 0) {
    errors.push({ field: 'addressLine1', message: 'Address line 1 must be a valid string' });
  }
}

/**
 * Validate zip code field.
 * 
 * @param {string} zipCode - The zip code
 * @param {Array} errors - Array to collect validation errors
 */
async function validateZipCode(zipCode, errors) {
  if (zipCode === undefined || zipCode === null) return;
  
  if (typeof zipCode !== 'string' || zipCode.trim().length === 0) {
    errors.push({ field: 'zipCode', message: 'Zip code must be a valid string' });
  }
}

module.exports = {
  validateUpdateAddressData
}; 