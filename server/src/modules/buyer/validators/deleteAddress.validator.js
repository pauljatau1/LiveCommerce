const ValidationError = require('../../../utils/errors/ValidationError');
const NotFoundException = require('../../../utils/errors/NotFoundException');
const buyerRepository = require('../repositories/buyer.repository');

/**
 * Validate address deletion data.
 * 
 * @param {string} addressId - The address ID to delete
 * @param {string} buyerId - The buyer's ID
 * @throws {ValidationError} If validation fails
 * @throws {NotFoundException} If buyer or address not found
 */
async function validateDeleteAddressData(addressId, buyerId) {
  await validateAddressId(addressId);
  await validateBuyerExists(buyerId);
  await validateAddressExists(addressId, buyerId);
}

/**
 * Validate that address ID is provided and is a valid ObjectId.
 * 
 * @param {string} addressId - The address ID
 */
async function validateAddressId(addressId) {
  const errors = [];
  
  await validateAddressIdRequired(addressId, errors);
  await validateAddressIdType(addressId, errors);
  await validateAddressIdFormat(addressId, errors);

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  return;
}

/**
 * Validate that address ID is required.
 * 
 * @param {string} addressId - The address ID
 * @param {Array} errors - Array to collect errors
 */
async function validateAddressIdRequired(addressId, errors) {
  if (!addressId) {
    errors.push({ field: 'addressId', message: 'Address ID is required' });
  }
}

/**
 * Validate that address ID is a string.
 * 
 * @param {string} addressId - The address ID
 * @param {Array} errors - Array to collect errors
 */
async function validateAddressIdType(addressId, errors) {
  if (addressId && typeof addressId !== 'string') {
    errors.push({ field: 'addressId', message: 'Address ID must be a string' });
  }
}

/**
 * Validate that address ID has valid ObjectId format.
 * 
 * @param {string} addressId - The address ID
 * @param {Array} errors - Array to collect errors
 */
async function validateAddressIdFormat(addressId, errors) {
  if (addressId && typeof addressId === 'string' && !require('mongoose').Types.ObjectId.isValid(addressId)) {
    errors.push({ field: 'addressId', message: 'Invalid address ID format' });
  }
}

/**
 * Validate that buyer exists.
 * 
 * @param {string} buyerId - The buyer's ID
 */
async function validateBuyerExists(buyerId) {
  try {
    const buyer = await buyerRepository.findById(buyerId);
    await validateBuyerFound(buyer);
    return;
  } catch (error) {
    await handleBuyerValidationError(error);
  }
}

/**
 * Validate that buyer was found.
 * 
 * @param {Object} buyer - The buyer object
 */
async function validateBuyerFound(buyer) {
  if (!buyer) {
    throw new NotFoundException('Buyer not found');
  }
}

/**
 * Handle buyer validation errors.
 * 
 * @param {Error} error - The error object
 */
async function handleBuyerValidationError(error) {
  if (error.name === 'CastError') {
    throw new NotFoundException('Buyer not found');
  }
  throw error;
}

/**
 * Validate that address exists for the buyer.
 * 
 * @param {string} addressId - The address ID
 * @param {string} buyerId - The buyer's ID
 */
async function validateAddressExists(addressId, buyerId) {
  const buyer = await buyerRepository.findByIdWithShippingAddresses(buyerId);
  
  await validateBuyerWithAddresses(buyer);
  await validateAddressFound(buyer, addressId);

  return;
}

/**
 * Validate that buyer has shipping addresses.
 * 
 * @param {Object} buyer - The buyer object
 */
async function validateBuyerWithAddresses(buyer) {
  if (!buyer || !buyer.shippingAddresses) {
    throw new NotFoundException('Buyer not found');
  }
}

/**
 * Validate that address exists in buyer's addresses.
 * 
 * @param {Object} buyer - The buyer object
 * @param {string} addressId - The address ID
 */
async function validateAddressFound(buyer, addressId) {
  const addressExists = buyer.shippingAddresses.some(
    addr => addr._id.toString() === addressId
  );

  if (!addressExists) {
    throw new NotFoundException('Address not found');
  }
}

module.exports = {
  validateDeleteAddressData,
  validateAddressId,
  validateAddressIdRequired,
  validateAddressIdType,
  validateAddressIdFormat,
  validateBuyerExists,
  validateBuyerFound,
  handleBuyerValidationError,
  validateAddressExists,
  validateBuyerWithAddresses,
  validateAddressFound
}; 