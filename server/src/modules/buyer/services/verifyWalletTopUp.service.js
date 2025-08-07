const buyerRepository = require('../repositories/buyer.repository');
const verifyWalletTopUpValidator = require('../validators/verifyWalletTopUp.validator');
const NotFoundException = require('../../../utils/errors/NotFoundException');
const axios = require('axios');

// Initialize Paystack for payment verification
const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
const paystack = axios.create({
  baseURL: 'https://api.paystack.co',
  headers: {
    Authorization: `Bearer ${paystackSecretKey}`,
    'Content-Type': 'application/json'
  }
});

/**
 * Verify payment with Paystack API.
 * 
 * @param {string} reference - Payment reference from Paystack
 * @returns {Promise<Object>} Paystack verification response
 */
async function verifyPaymentWithPaystack(reference) {
  const response = await paystack.get(`/transaction/verify/${reference}`);
  return response;
}

/**
 * Send wallet top-up confirmation email.
 * 
 * @param {Object} buyer - Buyer object with email and name
 * @param {Object} transaction - Transaction object
 * @returns {Promise<boolean>} Success status of email sending
 */
async function sendWalletTopUpEmail(buyer, transaction) {
  // This function is not implemented in the current scope
  // It would typically use a service like SendGrid to send emails
  console.log('Wallet top-up confirmation email would be sent to:', buyer.email);
  return true;
}

/**
 * Check if transaction already exists in buyer's wallet.
 * 
 * @param {Object} buyer - Buyer object with wallet transactions
 * @param {string} reference - Payment reference to check
 * @returns {Object|null} Existing transaction or null if not found
 */
function findExistingTransaction(buyer, reference) {
  return buyer.wallet.transactions.find(
    t => t.paymentReference === reference
  );
}

/**
 * Create a new wallet transaction object.
 * 
 * @param {Object} paymentData - Payment data from Paystack
 * @param {Object} metadata - Payment metadata
 * @returns {Object} New transaction object
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
 * Handle existing transaction update.
 * 
 * @param {Object} buyer - Buyer object
 * @param {Object} existingTransaction - Existing transaction to update
 * @returns {Promise<Object>} Updated buyer and transaction info
 */
async function handleExistingTransaction(buyer, existingTransaction) {
  if (existingTransaction.status === 'completed') {
    return {
      message: 'Payment already processed',
      transaction: existingTransaction,
      currentBalance: buyer.wallet.balance
    };
  }
  
  if (existingTransaction.status === 'pending') {
    // Update the existing transaction
    existingTransaction.status = 'completed';
    const newBalance = buyer.wallet.balance + existingTransaction.amount;
    
    // Update buyer's wallet
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
    await sendWalletTopUpEmail(updatedBuyer, existingTransaction);
    
    return {
      message: 'Wallet topped up successfully',
      transaction: existingTransaction,
      newBalance: updatedBuyer.wallet.balance
    };
  }
  
  throw new Error('Invalid transaction status');
}

/**
 * Handle new transaction creation.
 * 
 * @param {Object} buyer - Buyer object
 * @param {Object} paymentData - Payment data from Paystack
 * @param {Object} metadata - Payment metadata
 * @returns {Promise<Object>} Created transaction and updated buyer info
 */
async function handleNewTransaction(buyer, paymentData, metadata) {
  const newTransaction = createNewTransaction(paymentData, metadata);
  const newBalance = buyer.wallet.balance + newTransaction.amount;
  
  // Update buyer's wallet with new transaction
  const updatedBuyer = await buyerRepository.updateWalletWithTransaction(
    buyer._id,
    newTransaction,
    newBalance
  );
  
  if (!updatedBuyer) {
    throw new Error('Failed to create new transaction');
  }
  
  // Send confirmation email
  await sendWalletTopUpEmail(updatedBuyer, newTransaction);
  
  return {
    message: 'Wallet topped up successfully',
    transaction: newTransaction,
    newBalance: updatedBuyer.wallet.balance
  };
}

/**
 * Verify and complete wallet top-up.
 * 
 * This service verifies a Paystack payment, validates the transaction,
 * and updates the buyer's wallet with the top-up amount. It handles
 * both new transactions and updates to existing pending transactions.
 * 
 * @param {string} reference - Payment reference from Paystack
 * @returns {Promise<Object>} Transaction result with wallet information
 * @throws {Error} If verification fails or buyer not found
 */
async function verifyWalletTopUp(reference) {
  // Verify payment with Paystack
  const verificationResponse = await verifyPaymentWithPaystack(reference);
  
  // Validate the verification data
  await verifyWalletTopUpValidator.validateVerifyWalletTopUpData(reference, verificationResponse);
  
  const paymentData = verificationResponse.data.data;
  const metadata = paymentData.metadata;
  const buyerId = metadata.buyerId;
  
  // Find buyer with wallet information
  const buyer = await buyerRepository.findByIdWithWallet(buyerId);
  
  if (!buyer) {
    throw new NotFoundException('Buyer not found');
  }
  
  // Check if transaction already exists
  const existingTransaction = findExistingTransaction(buyer, reference);
  
  if (existingTransaction) {
    return await handleExistingTransaction(buyer, existingTransaction);
  }
  
  // Create new transaction
  return await handleNewTransaction(buyer, paymentData, metadata);
}

module.exports = {
  verifyWalletTopUp
}; 