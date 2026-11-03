/**
 * Top Up Wallet Validator
 *
 * This validator handles input validation for wallet top-up operations.
 * It provides functionality to:
 * - Validate amount field format and value
 * - Validate optional description field
 * - Validate bypass Paystack flag for admin users
 * - Validate optional payment reference field
 * - Ensure data integrity and security standards
 * - Maintain consistent validation patterns
 *
 * The validator ensures that wallet top-up requests are properly formatted
 * and contain valid data to prevent unauthorized operations and data corruption.
 *
 * @module topUpWalletValidator
 */

const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Validate the amount field for wallet top-up.
 *
 * This function validates the amount to ensure it's a valid positive number
 * suitable for wallet top-up operations.
 *
 * Business Logic:
 * - Checks if amount is provided (required parameter)
 * - Validates amount is a number type
 * - Ensures amount is greater than 0
 * - Prevents negative or zero amounts
 * - Collects validation errors for reporting
 *
 * @param {number} amount - The amount to validate
 * @param {Array} errors - Array to collect validation errors
 * @example
 * const errors = [];
 * validateAmount(100, errors); // Valid
 * validateAmount(0, errors); // Invalid, adds error
 * validateAmount(-50, errors); // Invalid, adds error
 * validateAmount("abc", errors); // Invalid, adds error
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
 *
 * This function validates the optional description field to ensure it's
 * properly formatted when provided.
 *
 * Business Logic:
 * - Allows undefined/null values (optional field)
 * - Validates string type when provided
 * - Ensures non-empty string when provided
 * - Prevents whitespace-only strings
 * - Collects validation errors for reporting
 *
 * @param {string} description - The description to validate
 * @param {Array} errors - Array to collect validation errors
 * @example
 * const errors = [];
 * validateDescription("Payment for services", errors); // Valid
 * validateDescription("", errors); // Invalid, adds error
 * validateDescription("   ", errors); // Invalid, adds error
 * validateDescription(undefined, errors); // Valid (optional)
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
 *
 * This function validates the bypass Paystack flag to ensure it's only
 * used by admin users in development environments.
 *
 * Business Logic:
 * - Checks if bypass flag is provided
 * - Validates admin user permissions
 * - Restricts bypass to development environment only
 * - Prevents unauthorized direct wallet top-ups
 * - Collects validation errors for reporting
 *
 * Security Considerations:
 * - Only admin users can bypass Paystack in development
 * - Production environment blocks all bypass attempts
 * - Prevents unauthorized direct wallet modifications
 *
 * @param {boolean} bypassPaystack - The bypass flag to validate
 * @param {boolean} isAdmin - Whether the user is an admin
 * @param {string} nodeEnv - The current node environment
 * @param {Array} errors - Array to collect validation errors
 * @example
 * const errors = [];
 * validateBypassPaystack(true, true, 'development', errors); // Valid for admin in dev
 * validateBypassPaystack(true, false, 'development', errors); // Invalid, adds error
 * validateBypassPaystack(true, true, 'production', errors); // Invalid, adds error
 */
function validateBypassPaystack(bypassPaystack, isAdmin, nodeEnv, errors) {
  if (bypassPaystack && !isAdmin && nodeEnv !== 'development') {
    errors.push({ field: 'bypassPaystack', message: 'Direct wallet top-up is not allowed' });
  }
}

/**
 * Validate the paymentReference field for wallet top-up.
 *
 * This function validates the optional payment reference field to ensure
 * it's properly formatted when provided.
 *
 * Business Logic:
 * - Allows undefined/null values (optional field)
 * - Validates string type when provided
 * - Ensures non-empty string when provided
 * - Prevents whitespace-only strings
 * - Collects validation errors for reporting
 *
 * @param {string} paymentReference - The payment reference to validate
 * @param {Array} errors - Array to collect validation errors
 * @example
 * const errors = [];
 * validatePaymentReference("REF123456", errors); // Valid
 * validatePaymentReference("", errors); // Invalid, adds error
 * validatePaymentReference("   ", errors); // Invalid, adds error
 * validatePaymentReference(undefined, errors); // Valid (optional)
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
 *
 * This function orchestrates the complete validation process for wallet
 * top-up requests, ensuring all parameters meet validation requirements.
 *
 * Business Logic Flow:
 * 1. Initialize error collection array
 * 2. Validate amount field (required)
 * 3. Validate description field (optional)
 * 4. Validate bypass Paystack flag (optional)
 * 5. Validate payment reference field (optional)
 * 6. Throw ValidationError if any validation fails
 *
 * Security Considerations:
 * - Amount validation prevents invalid transactions
 * - Bypass validation prevents unauthorized direct top-ups
 * - String validation prevents injection attacks
 * - Error collection provides comprehensive feedback
 *
 * @param {Object} data - The top-up data to validate
 * @param {number} data.amount - The amount to top up (required)
 * @param {string} [data.description] - Optional description
 * @param {boolean} [data.bypassPaystack] - Whether to bypass Paystack
 * @param {string} [data.paymentReference] - Optional payment reference
 * @param {Object} user - The user object
 * @param {boolean} user.isAdmin - Whether the user is an admin
 * @param {string} nodeEnv - The current node environment
 * @throws {ValidationError} When validation fails
 * @example
 * // Valid request
 * await validateTopUpWalletData(
 *   { amount: 100, description: "Payment" },
 *   { isAdmin: false },
 *   'production'
 * );
 * 
 * // Invalid request - will throw ValidationError
 * await validateTopUpWalletData(
 *   { amount: -50 },
 *   { isAdmin: false },
 *   'production'
 * );
 */
async function validateTopUpWalletData(data, user, nodeEnv) {
  // Initialize error collection array
  const errors = [];

  // Step 1: Validate amount field (required)
  // This ensures the top-up amount is valid and positive
  validateAmount(data.amount, errors);

  // Step 2: Validate description field (optional)
  // This ensures description is properly formatted if provided
  validateDescription(data.description, errors);

  // Step 3: Validate bypass Paystack flag (optional)
  // This ensures bypass is only used by admins in development
  validateBypassPaystack(data.bypassPaystack, user.isAdmin, nodeEnv, errors);

  // Step 4: Validate payment reference field (optional)
  // This ensures payment reference is properly formatted if provided
  validatePaymentReference(data.paymentReference, errors);

  // If any validation errors were found, throw ValidationError
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
