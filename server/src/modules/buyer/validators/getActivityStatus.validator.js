const { ObjectId } = require('mongodb');

/**
 * Check if buyer ID is provided (not null or undefined)
 * @param {string} buyerId - The buyer ID to check
 * @returns {string|null} Error message or null if valid
 */
function checkBuyerIdProvided(buyerId) {
  if (buyerId === null || buyerId === undefined) {
    return 'Buyer ID is required';
  }
  return null;
}

/**
 * Check if buyer ID is a string
 * @param {string} buyerId - The buyer ID to check
 * @returns {string|null} Error message or null if valid
 */
function checkBuyerIdIsString(buyerId) {
  if (typeof buyerId !== 'string') {
    return 'Buyer ID must be a string';
  }
  return null;
}

/**
 * Check if buyer ID is not empty
 * @param {string} buyerId - The buyer ID to check
 * @returns {string|null} Error message or null if valid
 */
function checkBuyerIdNotEmpty(buyerId) {
  if (buyerId.trim() === '') {
    return 'Buyer ID cannot be empty';
  }
  return null;
}

/**
 * Check if buyer ID is a valid ObjectId
 * @param {string} buyerId - The buyer ID to check
 * @returns {string|null} Error message or null if valid
 */
function checkBuyerIdIsValidObjectId(buyerId) {
  if (!ObjectId.isValid(buyerId)) {
    return 'Buyer ID must be a valid ObjectId';
  }
  return null;
}

/**
 * Validate buyer ID for activity status operations
 * @param {string} buyerId - The buyer ID to validate
 * @returns {Object} Validation result with errors array
 */
function validateBuyerId(buyerId) {
  const errors = [];

  // Check if buyerId is provided
  const providedError = checkBuyerIdProvided(buyerId);
  if (providedError) {
    errors.push(providedError);
    return { errors };
  }

  // Check if buyerId is a string
  const stringError = checkBuyerIdIsString(buyerId);
  if (stringError) {
    errors.push(stringError);
    return { errors };
  }

  // Check if buyerId is not empty
  const emptyError = checkBuyerIdNotEmpty(buyerId);
  if (emptyError) {
    errors.push(emptyError);
    return { errors };
  }

  // Check if buyerId is a valid ObjectId
  const objectIdError = checkBuyerIdIsValidObjectId(buyerId);
  if (objectIdError) {
    errors.push(objectIdError);
    return { errors };
  }

  return { errors };
}

/**
 * Validate get activity status data
 * @param {Object} data - The data to validate
 * @param {string} data.buyerId - The buyer ID to validate
 * @returns {Object} Validation result with errors array
 */
function validateGetActivityStatusData(data) {
  const errors = [];

  // Validate buyerId
  const buyerIdValidation = validateBuyerId(data.buyerId);
  errors.push(...buyerIdValidation.errors);

  return { errors };
}

module.exports = {
  validateBuyerId,
  validateGetActivityStatusData
};
