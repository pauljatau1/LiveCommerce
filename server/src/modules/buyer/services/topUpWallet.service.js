/**
 * Top Up Wallet Service
 *
 * This service handles the business logic for topping up buyer wallets.
 * It provides functionality to:
 * - Process wallet top-up transactions
 * - Handle both new and existing transactions
 * - Manage transaction status updates
 * - Update wallet balances
 * - Send confirmation emails
 * - Handle payment reference verification
 *
 * The service ensures that:
 * - Transaction data is properly validated
 * - Wallet balances are accurately updated
 * - Duplicate transactions are prevented
 * - Transaction statuses are properly managed
 * - Payment references are handled correctly
 *
 * Transaction Types:
 * - New transactions: Fresh wallet top-ups
 * - Existing transactions: Updates to pending transactions
 * - Direct top-ups: Bypass payment gateway transactions
 *
 * @module topUpWalletService
 */

const buyerRepository = require('../repositories/buyer.repository');
const topUpWalletValidator = require('../validators/topUpWallet.validator');
const NotFoundException = require('../../../utils/errors/NotFoundException');
const { generatePaymentReference } = require('../../../utils/helpers');

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
 * @param {string} paymentReference - The payment reference to search for
 * @returns {Object|null} The existing transaction object or null if not found
 */
function findExistingTransaction(buyer, paymentReference) {
  return buyer.wallet.transactions.find(
    transaction => transaction.paymentReference === paymentReference
  );
}

/**
 * Create a new transaction object for wallet top-up.
 *
 * This function constructs a complete transaction object with all necessary
 * fields for a wallet top-up. It handles payment reference generation and
 * transaction metadata.
 *
 * Transaction Structure:
 * - type: 'credit' (money being added to wallet)
 * - amount: Transaction amount
 * - paymentReference: Unique payment identifier
 * - description: Human-readable transaction description
 * - status: 'completed' (immediate completion for direct top-ups)
 * - createdAt: Transaction timestamp
 *
 * @param {number} amount - The amount to top up
 * @param {string} paymentReference - The payment reference (optional, will generate if not provided)
 * @param {string} description - The transaction description
 * @param {boolean} bypassPaystack - Whether this is a direct top-up (bypasses payment gateway)
 * @returns {Object} Complete transaction object ready for storage
 */
function createNewTransaction(amount, paymentReference, description, bypassPaystack) {
  return {
    type: 'credit', // Credit transaction (money added to wallet)
    amount,
    paymentReference: paymentReference || generatePaymentReference(), // Generate if not provided
    description: description + (bypassPaystack ? ' (Direct)' : ''), // Mark direct top-ups
    status: 'completed', // Immediate completion for direct top-ups
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
 * @returns {Promise<Object>} Response object with transaction details and new balance
 * @throws {Error} If transaction status is invalid or update fails
 */
async function handleExistingTransaction(buyer, existingTransaction) {
  if (existingTransaction.status === 'completed') {
    // Transaction already processed - return existing data
    return {
      message: 'Payment already processed',
      transaction: existingTransaction,
      newBalance: buyer.wallet.balance
    };
  } else if (existingTransaction.status === 'pending') {
    // Update pending transaction to completed
    existingTransaction.status = 'completed';
    
    // Calculate new wallet balance
    const newBalance = buyer.wallet.balance + existingTransaction.amount;
    
    // Update buyer in database with new transaction status and balance
    const updatedBuyer = await buyerRepository.updateWalletTransactionStatus(
      buyer._id,
      existingTransaction.paymentReference,
      'completed',
      newBalance
    );
    
    if (!updatedBuyer) {
      throw new Error('Failed to update transaction status');
    }
    
    // Send confirmation email for successful top-up
    await sendWalletTopUpEmail(buyer, existingTransaction);
    
    return {
      message: 'Wallet topped up successfully',
      transaction: existingTransaction,
      newBalance: newBalance
    };
  }
  
  // Invalid transaction status
  throw new Error('Invalid transaction status');
}

/**
 * Handle new transaction creation.
 *
 * This function processes new wallet top-up transactions by adding them
 * to the buyer's wallet and updating the balance. It handles the complete
 * flow for fresh transactions.
 *
 * Process Flow:
 * 1. Calculate new wallet balance
 * 2. Update buyer record with new transaction and balance
 * 3. Send confirmation email
 * 4. Return transaction details and new balance
 *
 * @param {Object} buyer - The buyer object with wallet information
 * @param {Object} transaction - The new transaction object to add
 * @returns {Promise<Object>} Response object with transaction details and new balance
 * @throws {Error} If database update fails
 */
async function handleNewTransaction(buyer, transaction) {
  // Calculate new wallet balance
  const newBalance = buyer.wallet.balance + transaction.amount;
  
  // Update buyer in database with new transaction and balance
  const updatedBuyer = await buyerRepository.updateWalletWithTransaction(
    buyer._id,
    transaction,
    newBalance
  );
  
  if (!updatedBuyer) {
    throw new Error('Failed to update wallet with new transaction');
  }
  
  // Send confirmation email for successful top-up
  await sendWalletTopUpEmail(buyer, transaction);
  
  return {
    message: 'Wallet topped up successfully',
    transaction: transaction,
    newBalance: newBalance
  };
}

/**
 * Process wallet top-up based on transaction status.
 *
 * This function orchestrates the wallet top-up process by determining
 * whether to handle an existing transaction or create a new one. It
 * checks for existing transactions using payment references and routes
 * to appropriate handlers.
 *
 * Processing Logic:
 * 1. Check if payment reference exists (fallback verification)
 * 2. If existing transaction found, handle based on status
 * 3. If no existing transaction, create new transaction
 * 4. Return appropriate response with transaction details
 *
 * @param {Object} buyer - The buyer object with wallet information
 * @param {Object} topUpData - The top-up data object
 * @param {number} topUpData.amount - Amount to top up
 * @param {string} topUpData.description - Transaction description
 * @param {boolean} topUpData.bypassPaystack - Whether to bypass payment gateway
 * @param {string} topUpData.paymentReference - Optional payment reference
 * @returns {Promise<Object>} Response object with transaction details and new balance
 */
async function processWalletTopUp(buyer, topUpData) {
  const { amount, description, bypassPaystack, paymentReference } = topUpData;
  
  // Step 1: Check if this is a fallback verification with an existing payment reference
  // This handles cases where payment verification is retried
  if (paymentReference) {
    const existingTransaction = findExistingTransaction(buyer, paymentReference);
    
    if (existingTransaction) {
      // Handle existing transaction based on its status
      return await handleExistingTransaction(buyer, existingTransaction);
    }
  }
  
  // Step 2: Handle new transaction creation
  // Create new transaction and process it
  const transaction = createNewTransaction(amount, paymentReference, description, bypassPaystack);
  return await handleNewTransaction(buyer, transaction);
}

/**
 * Top up buyer's wallet with specified amount - Main business logic function.
 *
 * This is the primary service function that orchestrates the complete
 * wallet top-up process. It handles both new transactions and updates
 * to existing pending transactions with comprehensive validation and
 * error handling.
 *
 * Business Logic Flow:
 * 1. Validates input data (amount, user permissions, environment)
 * 2. Fetches buyer with wallet information
 * 3. Checks for existing transactions using payment reference
 * 4. Handles existing transactions based on status
 * 5. Creates new transactions if needed
 * 6. Updates wallet balances and transaction records
 * 7. Sends confirmation emails
 * 8. Returns comprehensive transaction details
 *
 * Validation Features:
 * - Amount validation (minimum/maximum limits)
 * - User permission validation
 * - Environment-specific validation
 * - Payment reference validation
 *
 * Transaction Handling:
 * - New transactions: Fresh wallet top-ups
 * - Existing completed: Return existing data (no duplicates)
 * - Existing pending: Update to completed and process
 * - Direct top-ups: Bypass payment gateway processing
 *
 * @param {string} buyerId - The buyer ID to top up wallet for
 * @param {Object} topUpData - The top-up data object
 * @param {number} topUpData.amount - The amount to top up
 * @param {string} [topUpData.description] - Optional transaction description
 * @param {boolean} [topUpData.bypassPaystack] - Whether to bypass payment gateway
 * @param {string} [topUpData.paymentReference] - Optional payment reference for verification
 * @param {Object} user - The user object with permissions
 * @param {string} nodeEnv - The current node environment (development/production)
 * @returns {Promise<Object>} Top-up result with transaction details
 *   - message: {string} - Success/status message
 *   - transaction: {Object} - Transaction details
 *   - newBalance: {number} - Updated wallet balance
 * @throws {ValidationError} When input validation fails
 * @throws {NotFoundException} When buyer is not found
 * @throws {Error} When database operations fail
 *
 * @example
 * // Top up wallet with new transaction
 * const result = await topUpWallet('507f1f77bcf86cd799439011', {
 *   amount: 1000,
 *   description: 'Wallet top-up via card',
 *   bypassPaystack: false
 * }, user, 'production');
 * // Returns: { message: 'Wallet topped up successfully', transaction: {...}, newBalance: 1500 }
 *
 * @example
 * // Verify existing payment reference
 * const result = await topUpWallet('507f1f77bcf86cd799439011', {
 *   amount: 1000,
 *   paymentReference: 'PAY_REF_123456'
 * }, user, 'production');
 * // Returns existing transaction if found, or creates new one
 */
async function topUpWallet(buyerId, topUpData, user, nodeEnv) {
  // Step 1: Validate input data
  // This ensures amount, permissions, and environment are valid
  await topUpWalletValidator.validateTopUpWalletData(topUpData, user, nodeEnv);
  
  // Step 2: Find buyer with wallet information
  // Fetch buyer record with populated wallet data
  const buyer = await buyerRepository.findByIdWithWallet(buyerId);
  
  if (!buyer) {
    throw new NotFoundException('Buyer not found');
  }
  
  // Step 3: Process wallet top-up
  // Handle transaction creation or existing transaction updates
  return await processWalletTopUp(buyer, topUpData);
}

module.exports = {
  topUpWallet
};
