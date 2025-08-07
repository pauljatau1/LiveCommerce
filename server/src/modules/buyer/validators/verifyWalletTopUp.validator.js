const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Validate the payment reference parameter.
 * 
 * @param {string} reference - Payment reference from Paystack
 */
function validatePaymentReference(reference) {
  const errors = [];
  
  if (!reference) {
    errors.push({ field: 'reference', message: 'Payment reference is required' });
  } else if (typeof reference !== 'string') {
    errors.push({ field: 'reference', message: 'Payment reference must be a string' });
  } else if (reference.trim().length === 0) {
    errors.push({ field: 'reference', message: 'Payment reference cannot be empty' });
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  return;
}

/**
 * Validate the buyer ID from payment metadata.
 * 
 * @param {string} buyerId - Buyer ID from payment metadata
 */
function validateBuyerId(buyerId) {
  const errors = [];
  
  if (!buyerId) {
    errors.push({ field: 'buyerId', message: 'Invalid payment metadata. Missing buyerId.' });
  } else if (typeof buyerId !== 'string') {
    errors.push({ field: 'buyerId', message: 'Buyer ID must be a string' });
  } else if (buyerId.trim().length === 0) {
    errors.push({ field: 'buyerId', message: 'Buyer ID cannot be empty' });
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  return;
}

/**
 * Validate the payment verification response from Paystack.
 * 
 * @param {Object} verificationResponse - Response from Paystack verification API
 */
function validatePaystackResponse(verificationResponse) {
  const errors = [];
  
  if (!verificationResponse || !verificationResponse.data) {
    errors.push({ field: 'verification', message: 'Invalid response from payment verification' });
  } else if (!verificationResponse.data.status) {
    errors.push({ field: 'verification', message: 'Payment verification failed' });
  } else if (verificationResponse.data.data.status !== 'success') {
    errors.push({ field: 'verification', message: 'Payment verification failed - transaction not successful' });
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  return;
}

/**
 * Validate the payment metadata structure.
 * 
 * @param {Object} metadata - Payment metadata from Paystack
 */
function validatePaymentMetadata(metadata) {
  const errors = [];
  
  if (!metadata) {
    errors.push({ field: 'metadata', message: 'Invalid payment metadata. Missing metadata.' });
  } else if (typeof metadata !== 'object') {
    errors.push({ field: 'metadata', message: 'Payment metadata must be an object' });
  } else if (!metadata.buyerId) {
    errors.push({ field: 'metadata', message: 'Invalid payment metadata. Missing buyerId.' });
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  return;
}

/**
 * Validate all data for wallet top-up verification.
 * 
 * @param {string} reference - Payment reference
 * @param {Object} verificationResponse - Paystack verification response
 * @throws {ValidationError} If validation fails
 */
async function validateVerifyWalletTopUpData(reference, verificationResponse) {
  // Validate payment reference
  validatePaymentReference(reference);
  
  // Validate Paystack response
  validatePaystackResponse(verificationResponse);
  
  // Validate payment metadata
  const paymentData = verificationResponse.data.data;
  validatePaymentMetadata(paymentData.metadata);
  
  // Validate buyer ID from metadata
  validateBuyerId(paymentData.metadata.buyerId);
}

module.exports = {
  validateVerifyWalletTopUpData,
  validatePaymentReference,
  validateBuyerId,
  validatePaystackResponse,
  validatePaymentMetadata
}; 