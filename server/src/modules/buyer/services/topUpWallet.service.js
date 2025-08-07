const buyerRepository = require('../repositories/buyer.repository');
const topUpWalletValidator = require('../validators/topUpWallet.validator');
const NotFoundException = require('../../../utils/errors/NotFoundException');
const { generatePaymentReference } = require('../../../utils/helpers');

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
 * @param {string} paymentReference - The payment reference to find
 * @returns {Object|null} The existing transaction or null if not found
 */
function findExistingTransaction(buyer, paymentReference) {
  return buyer.wallet.transactions.find(
    transaction => transaction.paymentReference === paymentReference
  );
}

/**
 * Create a new transaction object for wallet top-up.
 * @param {number} amount - The amount to top up
 * @param {string} paymentReference - The payment reference
 * @param {string} description - The transaction description
 * @param {boolean} bypassPaystack - Whether this is a direct top-up
 * @returns {Object} The new transaction object
 */
function createNewTransaction(amount, paymentReference, description, bypassPaystack) {
  return {
    type: 'credit',
    amount,
    paymentReference: paymentReference || generatePaymentReference(),
    description: description + (bypassPaystack ? ' (Direct)' : ''),
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
      newBalance: buyer.wallet.balance
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
 * @param {Object} transaction - The transaction object
 * @returns {Promise<Object>} The response object
 */
async function handleNewTransaction(buyer, transaction) {
  const newBalance = buyer.wallet.balance + transaction.amount;
  
  // Update buyer in database
  const updatedBuyer = await buyerRepository.updateWalletWithTransaction(
    buyer._id,
    transaction,
    newBalance
  );
  
  if (!updatedBuyer) {
    throw new Error('Failed to update wallet with new transaction');
  }
  
  // Send confirmation email
  await sendWalletTopUpEmail(buyer, transaction);
  
  return {
    message: 'Wallet topped up successfully',
    transaction: transaction,
    newBalance: newBalance
  };
}

/**
 * Process wallet top-up based on transaction status.
 * @param {Object} buyer - The buyer object
 * @param {Object} topUpData - The top-up data
 * @returns {Promise<Object>} The response object
 */
async function processWalletTopUp(buyer, topUpData) {
  const { amount, description, bypassPaystack, paymentReference } = topUpData;
  
  // Check if this is a fallback verification with an existing payment reference
  if (paymentReference) {
    const existingTransaction = findExistingTransaction(buyer, paymentReference);
    
    if (existingTransaction) {
      return await handleExistingTransaction(buyer, existingTransaction);
    }
  }
  
  // Handle new transaction
  const transaction = createNewTransaction(amount, paymentReference, description, bypassPaystack);
  return await handleNewTransaction(buyer, transaction);
}

/**
 * Top up buyer's wallet with specified amount.
 * This function handles both new transactions and updates to existing pending transactions.
 * 
 * @param {string} buyerId - The buyer ID
 * @param {Object} topUpData - The top-up data
 * @param {number} topUpData.amount - The amount to top up
 * @param {string} [topUpData.description] - Optional description
 * @param {boolean} [topUpData.bypassPaystack] - Whether to bypass Paystack
 * @param {string} [topUpData.paymentReference] - Optional payment reference
 * @param {Object} user - The user object
 * @param {string} nodeEnv - The current node environment
 * @returns {Promise<Object>} The top-up result with transaction details
 * @throws {ValidationError} When validation fails
 * @throws {NotFoundException} When buyer is not found
 */
async function topUpWallet(buyerId, topUpData, user, nodeEnv) {
  // Validate input data
  await topUpWalletValidator.validateTopUpWalletData(topUpData, user, nodeEnv);
  
  // Find buyer with wallet information
  const buyer = await buyerRepository.findByIdWithWallet(buyerId);
  
  if (!buyer) {
    throw new NotFoundException('Buyer not found');
  }
  
  // Process wallet top-up
  return await processWalletTopUp(buyer, topUpData);
}

module.exports = {
  topUpWallet
};
