const buyerRepository = require('../repositories/buyer.repository');
const verifyWalletTopUpValidator = require('../validators/verifyWalletTopUp.validator');
const NotFoundException = require('../../../utils/errors/NotFoundException');
const ValidationError = require('../../../utils/errors/ValidationError');
const axios = require('axios');

// Initialize Paystack for payment verification
const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
const paystack = axios.create({
  baseURL: 'https://api.paystack.co',
  headers: {
    'Authorization': `Bearer ${paystackSecretKey}`,
    'Content-Type': 'application/json'
  }
});

/**
 * Verify payment with Paystack API.
 * @param {string} reference - The payment reference to verify
 * @returns {Promise<Object>} The verification response from Paystack
 */
async function verifyPaymentWithPaystack(reference) {
  const response = await paystack.get(`/transaction/verify/${reference}`);
  return response;
}

/**
 * Send wallet top-up confirmation email to buyer.
 * This function is not implemented as per requirements.
 * @param {Object} buyer - The buyer object
 * @param {Object} transaction - The transaction object
 */
async function sendWalletTopUpEmail(buyer, transaction) {
  // Not implemented as per requirements
  console.log('Wallet top-up email would be sent to:', buyer.email);
}

/**
 * Find existing transaction in buyer's wallet by payment reference.
 * @param {Object} buyer - The buyer object with wallet transactions
 * @param {string} reference - The payment reference to find
 * @returns {Object|null} The existing transaction or null if not found
 */
function findExistingTransaction(buyer, reference) {
  return buyer.wallet.transactions.find(
    transaction => transaction.paymentReference === reference
  );
}

/**
 * Create a new transaction object from payment data.
 * @param {Object} paymentData - The payment data from Paystack
 * @param {Object} metadata - The payment metadata
 * @returns {Object} The new transaction object
 */
function createNewTransaction(paymentData, metadata) {
  const amount = paymentData.amount / 100; // Convert from kobo to naira
  
  return {
    type: 'credit',
    amount,
    paymentReference: paymentData.reference,
    description: metadata.description || 'Wallet top up via Paystack',
    status: 'completed',
    createdAt: new Date()
  };
}

/**
 * Handle existing transaction based on its status.
 * @param {Object} buyer - The buyer object
 * @param {Object} existingTransaction - The existing transaction
 * @returns {Promise<Object>} The response object
 */
async function handleExistingTransaction(buyer, existingTransaction) {
  if (existingTransaction.status === 'completed') {
    return {
      message: 'Payment already processed',
      transaction: existingTransaction,
      currentBalance: buyer.wallet.balance
    };
  } else if (existingTransaction.status === 'pending') {
    // Update the existing transaction
    existingTransaction.status = 'completed';
    
    // Update wallet balance
    const newBalance = buyer.wallet.balance + existingTransaction.amount;
    
    // Update buyer in database
    const updatedBuyer = await buyerRepository.updateWalletTransactionStatus(
      buyer._id,
      existingTransaction.paymentReference,
      'completed',
      newBalance
    );
    
    if (!updatedBuyer) {
      throw new Error('Failed to update transaction status');
    }
    
    // Send confirmation email
    await sendWalletTopUpEmail(buyer, existingTransaction);
    
    return {
      message: 'Wallet topped up successfully',
      transaction: existingTransaction,
      newBalance: newBalance
    };
  }
  
  throw new Error('Invalid transaction status');
}

/**
 * Handle new transaction creation.
 * @param {Object} buyer - The buyer object
 * @param {Object} paymentData - The payment data from Paystack
 * @param {Object} metadata - The payment metadata
 * @returns {Promise<Object>} The response object
 */
async function handleNewTransaction(buyer, paymentData, metadata) {
  const newTransaction = createNewTransaction(paymentData, metadata);
  const newBalance = buyer.wallet.balance + newTransaction.amount;
  
  // Update buyer in database
  const updatedBuyer = await buyerRepository.updateWalletWithTransaction(
    buyer._id,
    newTransaction,
    newBalance
  );
  
  if (!updatedBuyer) {
    throw new Error('Failed to update wallet with new transaction');
  }
  
  // Send confirmation email
  await sendWalletTopUpEmail(buyer, newTransaction);
  
  return {
    message: 'Wallet topped up successfully',
    transaction: newTransaction,
    newBalance: newBalance
  };
}

/**
 * Validate the payment reference parameter.
 * @param {string} reference - The payment reference to validate
 * @throws {ValidationError} When reference is invalid
 */
function validateReference(reference) {
  if (!reference) {
    throw new ValidationError([
      { field: 'reference', message: 'Payment reference is required' }
    ]);
  }
}

/**
 * Validate Paystack verification response.
 * @param {Object} verificationResponse - The response from Paystack
 * @throws {ValidationError} When response is invalid
 */
function validatePaystackResponse(verificationResponse) {
  if (!verificationResponse.data.status || verificationResponse.data.data.status !== 'success') {
    throw new ValidationError([
      { field: 'reference', message: 'Payment verification failed' }
    ]);
  }
}

/**
 * Validate payment metadata and extract buyer ID.
 * @param {Object} paymentData - The payment data from Paystack
 * @returns {string} The buyer ID
 * @throws {ValidationError} When metadata is invalid
 */
function validateMetadataAndExtractBuyerId(paymentData) {
  const metadata = paymentData.metadata;
  
  if (!metadata || !metadata.buyerId) {
    throw new ValidationError([
      { field: 'metadata', message: 'Invalid payment metadata. Missing buyerId.' }
    ]);
  }

  return metadata.buyerId;
}

/**
 * Find and validate buyer exists.
 * @param {string} buyerId - The buyer ID to find
 * @returns {Promise<Object>} The buyer object
 * @throws {NotFoundException} When buyer is not found
 */
async function findAndValidateBuyer(buyerId) {
  const buyer = await buyerRepository.findByIdWithWallet(buyerId);
  if (!buyer) {
    throw new NotFoundException('Buyer not found');
  }
  return buyer;
}

/**
 * Process wallet top-up based on transaction status.
 * @param {Object} buyer - The buyer object
 * @param {string} reference - The payment reference
 * @param {Object} paymentData - The payment data from Paystack
 * @param {Object} metadata - The payment metadata
 * @returns {Promise<Object>} The response object
 */
async function processWalletTopUp(buyer, reference, paymentData, metadata) {
  const existingTransaction = findExistingTransaction(buyer, reference);
  
  if (existingTransaction) {
    return await handleExistingTransaction(buyer, existingTransaction);
  }

  return await handleNewTransaction(buyer, paymentData, metadata);
}

/**
 * Verify wallet top-up payment.
 * This function verifies a Paystack payment and updates the buyer's wallet.
 * It handles both new transactions and updates to existing pending transactions.
 * 
 * @param {string} reference - The payment reference from Paystack
 * @returns {Promise<Object>} The verification result with transaction details
 * @throws {ValidationError} When validation fails
 * @throws {NotFoundException} When buyer is not found
 */
async function verifyWalletTopUp(reference) {
  // Validate reference parameter
  validateReference(reference);

  // Verify payment with Paystack
  const verificationResponse = await verifyPaymentWithPaystack(reference);
  
  // Validate Paystack response
  validatePaystackResponse(verificationResponse);

  // Validate the verification response data
  await verifyWalletTopUpValidator.validateVerifyWalletTopUpData(reference, verificationResponse);

  const paymentData = verificationResponse.data.data;
  
  // Validate metadata and extract buyer ID
  const buyerId = validateMetadataAndExtractBuyerId(paymentData);

  // Find and validate buyer exists
  const buyer = await findAndValidateBuyer(buyerId);

  // Process wallet top-up
  return await processWalletTopUp(buyer, reference, paymentData, paymentData.metadata);
}

module.exports = {
  verifyWalletTopUp
}; 