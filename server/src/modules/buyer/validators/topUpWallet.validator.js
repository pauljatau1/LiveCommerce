const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Validate the amount field for wallet top-up.
 * @param {number} amount - The amount to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateAmount(amount, errors) {
  // For null/undefined, only check if it's falsy or <= 0
  if (amount === null || amount === undefined) {
    errors.push({ field: 'amount', message: 'Invalid amount. Amount must be greater than 0.' });
    return;
  }
  
  // For non-number types, check both value and type
  if (typeof amount !== 'number') {
    errors.push({ field: 'amount', message: 'Invalid amount. Amount must be greater than 0.' });
    errors.push({ field: 'amount', message: 'Amount must be a number' });
    return;
  }
  
  // For numbers, only check if it's <= 0
  if (amount <= 0) {
    errors.push({ field: 'amount', message: 'Invalid amount. Amount must be greater than 0.' });
  }
}

/**
 * Validate the description field for wallet top-up.
 * @param {string} description - The description to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateDescription(description, errors) {
  if (description !== undefined && description !== null) {
    if (typeof description !== 'string') {
      errors.push({ field: 'description', message: 'Description must be a string' });
    } else if (description.trim().length === 0) {
      errors.push({ field: 'description', message: 'Description cannot be empty' });
    }
  }
}

/**
 * Validate the bypassPaystack field for wallet top-up.
 * @param {boolean} bypassPaystack - The bypass flag to validate
 * @param {boolean} isAdmin - Whether the user is an admin
 * @param {string} nodeEnv - The current node environment
 * @param {Array} errors - Array to collect validation errors
 */
function validateBypassPaystack(bypassPaystack, isAdmin, nodeEnv, errors) {
  if (bypassPaystack && !isAdmin && nodeEnv !== 'development') {
    errors.push({ field: 'bypassPaystack', message: 'Direct wallet top-up is not allowed' });
  }
}

/**
 * Validate the paymentReference field for wallet top-up.
 * @param {string} paymentReference - The payment reference to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validatePaymentReference(paymentReference, errors) {
  if (paymentReference !== undefined && paymentReference !== null) {
    if (typeof paymentReference !== 'string') {
      errors.push({ field: 'paymentReference', message: 'Payment reference must be a string' });
    } else if (paymentReference.trim().length === 0) {
      errors.push({ field: 'paymentReference', message: 'Payment reference cannot be empty' });
    }
  }
}

/**
 * Validate all top-up wallet data.
 * @param {Object} data - The top-up data to validate
 * @param {number} data.amount - The amount to top up
 * @param {string} [data.description] - Optional description
 * @param {boolean} [data.bypassPaystack] - Whether to bypass Paystack
 * @param {string} [data.paymentReference] - Optional payment reference
 * @param {Object} user - The user object
 * @param {boolean} user.isAdmin - Whether the user is an admin
 * @param {string} nodeEnv - The current node environment
 * @throws {ValidationError} When validation fails
 */
async function validateTopUpWalletData(data, user, nodeEnv) {
  const errors = [];

  validateAmount(data.amount, errors);
  validateDescription(data.description, errors);
  validateBypassPaystack(data.bypassPaystack, user.isAdmin, nodeEnv, errors);
  validatePaymentReference(data.paymentReference, errors);

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateTopUpWalletData,
  validateAmount,
  validateDescription,
  validateBypassPaystack,
  validatePaymentReference
};
