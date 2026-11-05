/**
 * Verify Wallet Top Up Service
 *
 * This service handles the business logic for verifying Paystack payments and
 * updating buyer wallets accordingly. It provides functionality to:
 * - Verify payments with Paystack API
 * - Handle both new and existing transactions
 * - Update wallet balances and transaction statuses
 * - Send confirmation emails
 * - Validate payment metadata and buyer information
 *
 * The service ensures that:
 * - Payments are properly verified with Paystack
 * - Transaction data is accurately processed
 * - Wallet balances are correctly updated
 * - Duplicate transactions are prevented
 * - Payment metadata is validated
 * - Buyer information is verified
 *
 * Payment Flow:
 * - Payment verification with Paystack API
 * - Metadata validation and buyer ID extraction
 * - Transaction status checking and processing
 * - Wallet balance updates
 * - Confirmation email sending
 *
 * @module verifyWalletTopUpService
 */

const buyerRepository = require('../repositories/buyer.repository');
const verifyWalletTopUpValidator = require('../validators/verifyWalletTopUp.validator');
const NotFoundException = require('../../../utils/errors/NotFoundException');
const ValidationError = require('../../../utils/errors/ValidationError');
const axios = require('axios');

// Paystack metadata tag that marks a payment as a wallet top-up. Payments for
// anything else (for example an order paid by card) are never credited to a wallet.
const WALLET_TOPUP_PURPOSE = 'wallet_topup';

// Paystack client; the secret key is read at call time
const paystack = () => axios.create({
  baseURL: 'https://api.paystack.co',
  headers: {
    'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json'
  }
});

/**
 * Verify payment with Paystack API.
 * 
 * This function makes a request to the Paystack API to verify a payment
 * using the provided reference. It returns the complete verification response.
 *
 * API Endpoint:
 * - GET /transaction/verify/{reference}
 * - Requires Paystack secret key for authentication
 *
 * @param {string} reference - The payment reference to verify
 * @returns {Promise<Object>} The verification response from Paystack
 * @throws {Error} If Paystack API request fails
 */
async function verifyPaymentWithPaystack(reference) {
  const response = await paystack().get(`/transaction/verify/${encodeURIComponent(reference)}`);
  return response;
}

/**
 * Send wallet top-up confirmation email to buyer.
 * 
 * This function is a placeholder for email notification functionality.
 * It would send confirmation emails to buyers when their wallet is topped up.
 * Currently not implemented as per project requirements.
 *
 * Email Content Would Include:
 * - Transaction amount and reference
 * - New wallet balance
 * - Transaction timestamp
 * - Security information
 *
 * @param {Object} buyer - The buyer object with email information
 * @param {Object} transaction - The transaction object with details
 */
async function sendWalletTopUpEmail(buyer, transaction) {
  // Not implemented as per requirements
  console.log('Wallet top-up email would be sent to:', buyer.email);
}

/**
 * Find existing transaction in buyer's wallet by payment reference.
 * 
 * This function searches through the buyer's wallet transactions to find
 * a transaction with the specified payment reference. This is used to
 * prevent duplicate transactions and handle payment verification.
 *
 * @param {Object} buyer - The buyer object with wallet transactions array
 * @param {string} reference - The payment reference to search for
 * @returns {Object|null} The existing transaction object or null if not found
 */
function findExistingTransaction(buyer, reference) {
  return buyer.wallet.transactions.find(
    transaction => transaction.paymentReference === reference
  );
}

/**
 * Create a new transaction object from payment data.
 * 
 * This function constructs a complete transaction object from Paystack
 * payment data. It handles currency conversion and sets appropriate defaults.
 *
 * Transaction Structure:
 * - type: 'credit' (money being added to wallet)
 * - amount: Payment amount (converted from kobo to naira)
 * - paymentReference: Payment reference from Paystack
 * - description: Transaction description
 * - status: 'completed' (payment verified)
 * - createdAt: Transaction timestamp
 *
 * Currency Conversion:
 * - Paystack amounts are in kobo (smallest currency unit)
 * - Converts to naira by dividing by 100
 *
 * @param {Object} paymentData - The payment data from Paystack
 * @param {number} paymentData.amount - Payment amount in kobo
 * @param {string} paymentData.reference - Payment reference
 * @param {Object} metadata - The payment metadata
 * @param {string} metadata.description - Optional transaction description
 * @returns {Object} Complete transaction object ready for storage
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
 * 
 * This function processes existing transactions based on their current status.
 * It handles both completed and pending transactions appropriately.
 *
 * Status Handling:
 * - 'completed': Return existing transaction (no duplicate processing)
 * - 'pending': Update to completed and process balance update
 * - Other statuses: Throw error for invalid status
 *
 * @param {Object} buyer - The buyer object with wallet information
 * @param {Object} existingTransaction - The existing transaction to handle
 * @returns {Promise<Object>} Response object with transaction details and balance
 * @throws {Error} If transaction status is invalid or update fails
 */
async function handleExistingTransaction(buyer, existingTransaction) {
  if (existingTransaction.status === 'completed') {
    // Transaction already processed - return existing data
    return {
      message: 'Payment already processed',
      transaction: existingTransaction,
      currentBalance: buyer.wallet.balance
    };
  } else if (existingTransaction.status === 'pending') {
    // Complete it and credit the amount in one write; null means another
    // request completed it first
    const updatedBuyer = await buyerRepository.updateWalletTransactionStatus(
      buyer._id,
      existingTransaction.paymentReference,
      'completed',
      existingTransaction.amount
    );

    if (!updatedBuyer) {
      return alreadyProcessed(buyer._id, existingTransaction.paymentReference);
    }

    existingTransaction.status = 'completed';
    await sendWalletTopUpEmail(buyer, existingTransaction);

    return {
      message: 'Wallet topped up successfully',
      transaction: existingTransaction,
      newBalance: updatedBuyer.wallet.balance
    };
  }
  
  // Invalid transaction status
  throw new Error('Invalid transaction status');
}

// Response for a payment another request has already credited
async function alreadyProcessed(buyerId, reference) {
  const fresh = await buyerRepository.findByIdWithWallet(buyerId);
  return {
    message: 'Payment already processed',
    transaction: fresh ? findExistingTransaction(fresh, reference) : undefined,
    currentBalance: fresh ? fresh.wallet.balance : undefined
  };
}

/**
 * Handle new transaction creation.
 * 
 * This function processes new wallet top-up transactions by creating them
 * and updating the buyer's wallet balance. It handles the complete flow
 * for fresh transactions.
 *
 * Process Flow:
 * 1. Create new transaction object from payment data
 * 2. Calculate new wallet balance
 * 3. Update buyer record with new transaction and balance
 * 4. Send confirmation email
 * 5. Return transaction details and new balance
 *
 * @param {Object} buyer - The buyer object with wallet information
 * @param {Object} paymentData - The payment data from Paystack
 * @param {Object} metadata - The payment metadata
 * @returns {Promise<Object>} Response object with transaction details and new balance
 * @throws {Error} If database update fails
 */
async function handleNewTransaction(buyer, paymentData, metadata) {
  // Create new transaction object from payment data
  const newTransaction = createNewTransaction(paymentData, metadata);
  
  // Record and credit in one write; null means this payment was already credited
  const updatedBuyer = await buyerRepository.updateWalletWithTransaction(buyer._id, newTransaction);

  if (!updatedBuyer) {
    return alreadyProcessed(buyer._id, newTransaction.paymentReference);
  }

  await sendWalletTopUpEmail(buyer, newTransaction);

  return {
    message: 'Wallet topped up successfully',
    transaction: newTransaction,
    newBalance: updatedBuyer.wallet.balance
  };
}

/**
 * Validate the payment reference parameter.
 * 
 * This function ensures the payment reference is provided before
 * proceeding with payment verification.
 *
 * @param {string} reference - The payment reference to validate
 * @throws {ValidationError} When reference is missing or invalid
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
 * 
 * This function validates the response from Paystack to ensure the
 * payment verification was successful.
 *
 * Validation Checks:
 * - Response has data.status field
 * - Payment status is 'success'
 * - Throws ValidationError if verification failed
 *
 * @param {Object} verificationResponse - The response from Paystack
 * @throws {ValidationError} When payment verification failed
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
 * 
 * This function validates the payment metadata and extracts the buyer ID
 * that was included when the payment was initiated.
 *
 * Metadata Validation:
 * - Ensures metadata object exists
 * - Validates buyerId is present in metadata
 * - Returns buyerId for further processing
 *
 * @param {Object} paymentData - The payment data from Paystack
 * @param {Object} paymentData.metadata - Payment metadata object
 * @param {string} paymentData.metadata.buyerId - Buyer ID from metadata
 * @returns {string} The buyer ID from metadata
 * @throws {ValidationError} When metadata is invalid or missing buyerId
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
 * Ensure the payment was made as a wallet top-up, in naira.
 *
 * @param {Object} paymentData - The payment data from Paystack
 * @throws {ValidationError} When the payment is for something else
 */
function validateTopUpPayment(paymentData) {
  if (!paymentData.metadata || paymentData.metadata.purpose !== WALLET_TOPUP_PURPOSE) {
    throw new ValidationError([
      { field: 'reference', message: 'This payment is not a wallet top-up' }
    ]);
  }
  if (paymentData.currency && paymentData.currency !== 'NGN') {
    throw new ValidationError([
      { field: 'reference', message: 'Wallet top-ups must be paid in naira' }
    ]);
  }
}

/**
 * Find and validate buyer exists.
 * 
 * This function retrieves the buyer from the database and validates
 * that they exist before proceeding with wallet updates.
 *
 * @param {string} buyerId - The buyer ID to find and validate
 * @returns {Promise<Object>} The buyer object with wallet information
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
 * 
 * This function determines whether to handle an existing transaction
 * or create a new one based on the payment reference.
 *
 * Processing Logic:
 * 1. Check if transaction with reference already exists
 * 2. If exists: Handle based on current status
 * 3. If not exists: Create new transaction
 *
 * @param {Object} buyer - The buyer object with wallet information
 * @param {string} reference - The payment reference
 * @param {Object} paymentData - The payment data from Paystack
 * @param {Object} metadata - The payment metadata
 * @returns {Promise<Object>} Response object with transaction details
 */
async function processWalletTopUp(buyer, reference, paymentData, metadata) {
  // Check if transaction with this reference already exists
  const existingTransaction = findExistingTransaction(buyer, reference);
  
  if (existingTransaction) {
    // Handle existing transaction based on its status
    return await handleExistingTransaction(buyer, existingTransaction);
  }

  // Create new transaction if none exists
  return await handleNewTransaction(buyer, paymentData, metadata);
}

/**
 * Verify wallet top-up payment - Main business logic function.
 * 
 * This is the primary service function that orchestrates the complete
 * payment verification and wallet top-up process. It verifies payments
 * with Paystack, validates data, and updates buyer wallets accordingly.
 *
 * Business Logic Flow:
 * 1. Validates payment reference parameter
 * 2. Verifies payment with Paystack API
 * 3. Validates Paystack response
 * 4. Validates payment metadata and extracts buyer ID
 * 5. Finds and validates buyer exists
 * 6. Processes wallet top-up based on transaction status
 * 7. Returns verification result with transaction details
 *
 * Payment Verification Process:
 * - Makes API call to Paystack for payment verification
 * - Validates payment status and metadata
 * - Handles both new and existing transactions
 * - Updates wallet balances and transaction statuses
 * - Sends confirmation emails
 *
 * Security Features:
 * - Validates payment reference before API calls
 * - Verifies payment status with Paystack
 * - Validates buyer ID from payment metadata
 * - Prevents duplicate transaction processing
 * - Handles various transaction statuses safely
 *
 * @param {string} reference - The payment reference from Paystack
 * @returns {Promise<Object>} The verification result with transaction details
 *   - message: {string} - Success/status message
 *   - transaction: {Object} - Transaction details
 *   - newBalance: {number} - Updated wallet balance (for new/pending transactions)
 *   - currentBalance: {number} - Current wallet balance (for completed transactions)
 * @throws {ValidationError} When payment reference is invalid or verification fails
 * @throws {NotFoundException} When buyer is not found
 * @throws {Error} When database operations fail
 *
 * @example
 * // Verify a Paystack payment
 * const result = await verifyWalletTopUp('PAY_REF_123456');
 * // Returns: {
 * //   message: 'Wallet topped up successfully',
 * //   transaction: { type: 'credit', amount: 1000, ... },
 * //   newBalance: 2500
 * // }
 */
async function verifyWalletTopUp(reference, { expectedBuyerId } = {}) {
  // Step 1: Validate reference parameter
  // This ensures payment reference is provided before API calls
  validateReference(reference);

  // Step 2: Verify payment with Paystack
  // Make API call to Paystack for payment verification
  const verificationResponse = await verifyPaymentWithPaystack(reference);
  
  // Step 3: Validate Paystack response
  // Ensure payment verification was successful
  validatePaystackResponse(verificationResponse);

  // Step 4: Validate the verification response data
  // Additional validation using the validator
  await verifyWalletTopUpValidator.validateVerifyWalletTopUpData(reference, verificationResponse);

  const paymentData = verificationResponse.data.data;
  
  // Step 5: Validate metadata and extract buyer ID
  // Extract and validate buyer ID from payment metadata
  const buyerId = validateMetadataAndExtractBuyerId(paymentData);

  // Only payments made as wallet top-ups, in naira, can be credited
  validateTopUpPayment(paymentData);

  // When a buyer submits a reference, it must be their own payment
  if (expectedBuyerId && String(expectedBuyerId) !== String(buyerId)) {
    throw new ValidationError([
      { field: 'reference', message: 'This payment does not belong to your account' }
    ]);
  }

  // Step 6: Find and validate buyer exists
  // Retrieve buyer from database and ensure they exist
  const buyer = await findAndValidateBuyer(buyerId);

  // Step 7: Process wallet top-up
  // Handle transaction creation or updates based on existing status
  return await processWalletTopUp(buyer, reference, paymentData, paymentData.metadata);
}

module.exports = {
  verifyWalletTopUp,
  WALLET_TOPUP_PURPOSE
};