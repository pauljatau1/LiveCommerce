/**
 * Add Shipping Warehouse Validator
 *
 * This validator handles validation for shipping and warehouse information data.
 * It ensures that all required fields are present and valid before
 * processing shipping and warehouse information updates.
 *
 * Validation Rules:
 * - shippingOptions: Optional, must be a valid object if provided
 * - shippingOptions.shippingMethod: Optional, must be a string if provided
 * - shippingOptions.returnsAndExchangePolicy: Optional, must be a string if provided
 * - warehouseDetails: Optional, must be a valid object if provided
 * - warehouseDetails.name: Optional, must be a string if provided
 * - warehouseDetails.contactNumber: Optional, must be a string if provided
 * - warehouseDetails.address: Optional, must be a valid address object if provided
 * - warehouseDetails.address.country: Optional, must be a string if provided
 * - warehouseDetails.address.state: Optional, must be a string if provided
 * - warehouseDetails.address.city: Optional, must be a string if provided
 * - warehouseDetails.address.addressLine1: Optional, must be a string if provided
 * - warehouseDetails.address.addressLine2: Optional, must be a string if provided
 * - warehouseDetails.address.zipCode: Optional, must be a string if provided
 *
 * @module addShippingWarehouseValidator
 */

const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Validates shipping and warehouse information data.
 *
 * This function validates the shipping and warehouse information data structure
 * and ensures all provided fields are valid. Since all fields are optional,
 * this validator focuses on type validation and format checking.
 *
 * Validation Process:
 * - Validates shipping options structure and fields if provided
 * - Validates warehouse details structure and fields if provided
 * - Validates warehouse address structure and fields if provided
 * - Collects all validation errors
 * - Throws validation error if any issues found
 *
 * @param {Object} data - The shipping and warehouse information data to validate
 * @param {Object} [data.shippingOptions] - The shipping options object
 * @param {string} [data.shippingOptions.shippingMethod] - The shipping method
 * @param {string} [data.shippingOptions.returnsAndExchangePolicy] - The returns and exchange policy
 * @param {Object} [data.warehouseDetails] - The warehouse details object
 * @param {string} [data.warehouseDetails.name] - The warehouse name
 * @param {string} [data.warehouseDetails.contactNumber] - The warehouse contact number
 * @param {Object} [data.warehouseDetails.address] - The warehouse address details
 * @param {string} [data.warehouseDetails.address.country] - The country
 * @param {string} [data.warehouseDetails.address.state] - The state/province
 * @param {string} [data.warehouseDetails.address.city] - The city
 * @param {string} [data.warehouseDetails.address.addressLine1] - The primary address line
 * @param {string} [data.warehouseDetails.address.addressLine2] - The secondary address line
 * @param {string} [data.warehouseDetails.address.zipCode] - The postal/zip code
 * @throws {ValidationError} If validation fails with detailed error messages
 */
function validateAddShippingWarehouseData(data) {
  const errors = [];

  // Step 1: Check if data is provided
  if (!data) {
    // Since all fields are optional, we don't require any data
    return;
  }

  // Step 2: Validate shipping options if provided
  if (data.shippingOptions !== undefined && data.shippingOptions !== null) {
    validateShippingOptions(data.shippingOptions, errors);
  }

  // Step 3: Validate warehouse details if provided
  if (data.warehouseDetails !== undefined && data.warehouseDetails !== null) {
    validateWarehouseDetails(data.warehouseDetails, errors);
  }

  // Step 4: Throw validation error if any issues found
  throwValidationError(errors);
}

/**
 * Validates shipping options structure and fields.
 *
 * @param {Object} shippingOptions - The shipping options object to validate
 * @param {Array} errors - The errors array to append validation errors to
 */
function validateShippingOptions(shippingOptions, errors) {
  // Step 1: Check if shippingOptions is an object
  if (typeof shippingOptions !== 'object' || shippingOptions === null) {
    errors.push({ field: 'shippingOptions', message: 'Shipping options must be an object' });
    return;
  }

  // Step 2: Validate shipping method if provided
  if (shippingOptions.shippingMethod !== undefined && shippingOptions.shippingMethod !== null && typeof shippingOptions.shippingMethod !== 'string') {
    errors.push({ field: 'shippingOptions.shippingMethod', message: 'Shipping method must be a string' });
  }

  // Step 3: Validate returns and exchange policy if provided
  if (shippingOptions.returnsAndExchangePolicy !== undefined && shippingOptions.returnsAndExchangePolicy !== null && typeof shippingOptions.returnsAndExchangePolicy !== 'string') {
    errors.push({ field: 'shippingOptions.returnsAndExchangePolicy', message: 'Returns and exchange policy must be a string' });
  }
}

/**
 * Validates warehouse details structure and fields.
 *
 * @param {Object} warehouseDetails - The warehouse details object to validate
 * @param {Array} errors - The errors array to append validation errors to
 */
function validateWarehouseDetails(warehouseDetails, errors) {
  // Step 1: Check if warehouseDetails is an object
  if (typeof warehouseDetails !== 'object' || warehouseDetails === null) {
    errors.push({ field: 'warehouseDetails', message: 'Warehouse details must be an object' });
    return;
  }

  // Step 2: Validate warehouse name if provided
  if (warehouseDetails.name !== undefined && warehouseDetails.name !== null && typeof warehouseDetails.name !== 'string') {
    errors.push({ field: 'warehouseDetails.name', message: 'Warehouse name must be a string' });
  }

  // Step 3: Validate contact number if provided
  if (warehouseDetails.contactNumber !== undefined && warehouseDetails.contactNumber !== null && typeof warehouseDetails.contactNumber !== 'string') {
    errors.push({ field: 'warehouseDetails.contactNumber', message: 'Contact number must be a string' });
  }

  // Step 4: Validate warehouse address if provided
  if (warehouseDetails.address !== undefined && warehouseDetails.address !== null) {
    validateWarehouseAddress(warehouseDetails.address, errors);
  }
}

/**
 * Validates warehouse address structure and fields.
 *
 * @param {Object} address - The warehouse address object to validate
 * @param {Array} errors - The errors array to append validation errors to
 */
function validateWarehouseAddress(address, errors) {
  // Step 1: Check if address is an object
  if (typeof address !== 'object' || address === null) {
    errors.push({ field: 'warehouseDetails.address', message: 'Warehouse address must be an object' });
    return;
  }

  // Step 2: Validate all address fields if provided
  validateOptionalStringField(address.country, 'warehouseDetails.address.country', 'Country must be a string', errors);
  validateOptionalStringField(address.state, 'warehouseDetails.address.state', 'State must be a string', errors);
  validateOptionalStringField(address.city, 'warehouseDetails.address.city', 'City must be a string', errors);
  validateOptionalStringField(address.addressLine1, 'warehouseDetails.address.addressLine1', 'Address line 1 must be a string', errors);
  validateOptionalStringField(address.addressLine2, 'warehouseDetails.address.addressLine2', 'Address line 2 must be a string', errors);
  validateOptionalStringField(address.zipCode, 'warehouseDetails.address.zipCode', 'Zip code must be a string', errors);
}

/**
 * Validates an optional string field.
 *
 * @param {string} value - The value to validate
 * @param {string} fieldName - The field name for error reporting
 * @param {string} errorMessage - The error message to use
 * @param {Array} errors - The errors array to append validation errors to
 */
function validateOptionalStringField(value, fieldName, errorMessage, errors) {
  if (value !== undefined && value !== null && typeof value !== 'string') {
    errors.push({ field: fieldName, message: errorMessage });
  }
}

/**
 * Throws validation error if any errors are found.
 *
 * @param {Array} errors - The errors array to check
 * @throws {ValidationError} If validation fails with detailed error messages
 */
function throwValidationError(errors) {
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateAddShippingWarehouseData
};
