/**
 * Verify Wallet Top Up Validator
 *
 * This validator handles input validation for wallet top-up verification operations.
 * It provides functionality to:
 * - Validate payment reference format and presence
 * - Validate buyer ID format and structure
 * - Validate Paystack API response structure and status
 * - Validate payment metadata structure and content
 * - Ensure data integrity and security standards
 * - Maintain consistent validation patterns
 *
 * The validator ensures that wallet top-up verification requests are properly
 * formatted and contain valid data to prevent unauthorized operations and maintain
 * payment security.
 *
 * @module verifyWalletTopUpValidator
 */

const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Validate payment reference format and presence.
 * @param {string} reference - The payment reference to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validatePaymentReference(reference, errors) {
  if (reference === null || reference === undefined) {
    errors.push({ field: 'reference', message: 'Payment reference is required' });
  } else if (typeof reference !== 'string') {
    errors.push({ field: 'reference', message: 'Payment reference is required' });
  } else if (reference.trim().length === 0) {
    errors.push({ field: 'reference', message: 'Payment reference cannot be empty' });
  } else if (!/^[A-Za-z0-9_-]+$/.test(reference)) {
    errors.push({ field: 'reference', message: 'Invalid payment reference format' });
  }
}

/**
 * Validate buyer ID format and presence.
 * @param {string} buyerId - The buyer ID to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateBuyerId(buyerId, errors) {
  if (buyerId === null || buyerId === undefined) {
    errors.push({ field: 'buyerId', message: 'Buyer ID is required' });
  } else if (typeof buyerId !== 'string') {
    errors.push({ field: 'buyerId', message: 'Buyer ID is required' });
  } else if (buyerId.trim().length === 0) {
    errors.push({ field: 'buyerId', message: 'Buyer ID cannot be empty' });
  } else {
    // Validate MongoDB ObjectId format
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    if (!objectIdPattern.test(buyerId)) {
      errors.push({ field: 'buyerId', message: 'Invalid buyer ID format' });
    }
  }
}

/**
 * Validate Paystack API response structure and status.
 * @param {Object} verificationResponse - The response from Paystack API
 * @param {Array} errors - Array to collect validation errors
 */
function validatePaystackResponse(verificationResponse, errors) {
  if (!verificationResponse || typeof verificationResponse !== 'object') {
    errors.push({ field: 'verificationResponse', message: 'Invalid verification response' });
    return;
  }

  if (!verificationResponse.data) {
    errors.push({ field: 'verificationResponse', message: 'Missing response data' });
    return;
  }

  // Check if the response indicates success
  if (!verificationResponse.data.status) {
    errors.push({ field: 'verificationResponse', message: 'Payment verification failed' });
  }

  if (!verificationResponse.data.data) {
    errors.push({ field: 'verificationResponse', message: 'Missing payment data in response' });
    return;
  }

  const paymentData = verificationResponse.data.data;
  
  // Validate required payment data fields
  if (!paymentData.reference) {
    errors.push({ field: 'paymentData', message: 'Missing payment reference in response' });
  }

  if (paymentData.amount === null || paymentData.amount === undefined) {
    errors.push({ field: 'paymentData', message: 'Invalid payment amount in response' });
  } else if (typeof paymentData.amount !== 'number') {
    errors.push({ field: 'paymentData', message: 'Invalid payment amount in response' });
  } else if (paymentData.amount <= 0) {
    errors.push({ field: 'paymentData', message: 'Payment amount must be greater than zero' });
  }

  // Check payment status
  if (paymentData.status !== 'success') {
    errors.push({ field: 'paymentData', message: 'Payment verification failed - payment not successful' });
  }
}

/**
 * Validate payment metadata structure and content.
 * @param {Object} metadata - The payment metadata to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validatePaymentMetadata(metadata, errors) {
  if (!metadata || typeof metadata !== 'object') {
    errors.push({ field: 'metadata', message: 'Payment metadata is required' });
    return;
  }

  if (!metadata.buyerId) {
    errors.push({ field: 'metadata', message: 'Buyer ID is required in payment metadata' });
  } else {
    // Validate buyerId format
    validateBuyerId(metadata.buyerId, errors);
  }

  // Optional: validate description if present
  if (metadata.description && typeof metadata.description !== 'string') {
    errors.push({ field: 'metadata', message: 'Description must be a string' });
  }
}

/**
 * Validate the complete wallet top-up verification data.
 *
 * This function validates the payment reference and Paystack verification response
 * to ensure secure and accurate wallet top-up operations.
 *
 * Business Logic Flow:
 * 1. Initialize error collection array
 * 2. Validate payment reference format and presence
 * 3. Validate Paystack API response structure and status
 * 4. Validate payment metadata structure and content
 * 5. Validate reference consistency between request and response
 * 6. Throw ValidationError if any validation fails
 *
 * Security Considerations:
 * - Payment reference validation prevents unauthorized operations
 * - Paystack response validation ensures payment integrity
 * - Metadata validation maintains data consistency
 * - Reference consistency validation prevents payment mismatches
 * - Error collection provides comprehensive feedback
 *
 * @param {string} reference - The payment reference from the request
 * @param {Object} verificationResponse - The response from Paystack API
 * @throws {ValidationError} When validation fails
 */
async function validateVerifyWalletTopUpData(reference, verificationResponse) {
  const errors = [];

  // Validate payment reference
  validatePaymentReference(reference, errors);

  // Validate Paystack response
  validatePaystackResponse(verificationResponse, errors);

  if (verificationResponse && verificationResponse.data && verificationResponse.data.data) {
    const paymentData = verificationResponse.data.data;
    
    // Validate payment metadata
    validatePaymentMetadata(paymentData.metadata, errors);

    // Additional validation: ensure reference in response matches request
    if (paymentData.reference && paymentData.reference !== reference) {
      errors.push({ field: 'reference', message: 'Payment reference mismatch' });
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateVerifyWalletTopUpData,
  validatePaymentReference,
  validateBuyerId,
  validatePaystackResponse,
  validatePaymentMetadata
}; 