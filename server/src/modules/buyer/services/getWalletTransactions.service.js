const buyerRepository = require('../repositories/buyer.repository');
const queryParser = require('../../../utils/queryParser');

/**
 * Extracts pagination options from the request query parameters.
 * @param {Object} req - Express request object
 * @returns {Object} - Contains pagination config: enabled (boolean), page (number), limit (number)
 */
function getPaginationOptions(req) {
  return queryParser.getPaginationOptions(req);
}

/**
 * Extracts filter parameters from the request query for wallet transactions listing.
 * @param {Object} req - Express request object
 * @returns {Object} - Filters object to be passed to processing functions
 */
function getFilters(req) {
  const filters = {};
  
  if (req.query.type !== undefined) {
    filters.type = req.query.type;
  }
  
  if (req.query.startDate !== undefined) {
    filters.startDate = req.query.startDate;
  }
  
  if (req.query.endDate !== undefined) {
    filters.endDate = req.query.endDate;
  }
  
  return filters;
}

/**
 * Filter transactions based on provided filters.
 * 
 * @param {Array} transactions - Array of transactions to filter
 * @param {Object} filters - Filter criteria
 * @returns {Array} Filtered transactions
 */
function filterTransactions(transactions, filters) {
  let filteredTransactions = [...transactions];
  
  // Filter by type
  if (filters.type) {
    filteredTransactions = filteredTransactions.filter(
      transaction => transaction.type === filters.type
    );
  }
  
  // Filter by date range
  if (filters.startDate || filters.endDate) {
    filteredTransactions = filteredTransactions.filter(transaction => {
      const transactionDate = new Date(transaction.createdAt);
      
      if (filters.startDate && filters.endDate) {
        const start = new Date(filters.startDate);
        const end = new Date(filters.endDate);
        return transactionDate >= start && transactionDate <= end;
      } else if (filters.startDate) {
        const start = new Date(filters.startDate);
        return transactionDate >= start;
      } else if (filters.endDate) {
        const end = new Date(filters.endDate);
        return transactionDate <= end;
      }
      
      return true;
    });
  }
  
  return filteredTransactions;
}

/**
 * Sort transactions by creation date (most recent first).
 * 
 * @param {Array} transactions - Array of transactions to sort
 * @returns {Array} Sorted transactions
 */
function sortTransactions(transactions) {
  return transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Retrieves all wallet transactions for a buyer without pagination.
 * Useful for cases like exporting all transactions or simple listings.
 *
 * @param {string} buyerId - The buyer's ID
 * @param {Object} filters - Query filters
 * @returns {Promise<Object>} Formatted transactions data without pagination
 */
async function getWalletTransactions(buyerId, filters = {}) {
  // Retrieve buyer with wallet transactions
  const buyer = await buyerRepository.findById(buyerId);
  
  if (!buyer || !buyer.wallet || !buyer.wallet.transactions) {
    return {
      data: [],
      pagination: {} // No pagination info returned for full list
    };
  }
  
  // Filter and sort transactions
  let transactions = filterTransactions(buyer.wallet.transactions, filters);
  transactions = sortTransactions(transactions);
  
  return {
    data: transactions,
    pagination: {} // No pagination info returned for full list
  };
}

/**
 * Retrieves wallet transactions for a buyer with pagination.
 * Returns transaction data along with pagination metadata.
 * 
 * This function follows the same pattern as getPaginatedOrders but adapted
 * for embedded wallet transactions. Since transactions are stored as embedded
 * arrays within the buyer document, we retrieve the entire buyer document
 * first, then apply filtering and pagination in memory.
 *
 * @param {string} buyerId - The buyer's ID
 * @param {Object} params - Parameters for pagination and filtering
 * @param {number} params.page - Page number
 * @param {number} params.limit - Number of transactions per page
 * @param {Object} params.filters - Query filters
 * @returns {Promise<Object>} Formatted transactions data with pagination
 */
async function getPaginatedWalletTransactions(buyerId, { page, limit, filters }) {
  // Retrieve buyer with wallet transactions
  const buyer = await buyerRepository.findById(buyerId);
  
  if (!buyer || !buyer.wallet || !buyer.wallet.transactions) {
    return {
      data: [],
      pagination: {
        currentPage: page,
        totalPages: 0,
        totalTransactions: 0,
        hasMore: false,
        hasPrevious: false
      }
    };
  }
  
  // Filter all transactions first to get total count
  // This is equivalent to building a query in getPaginatedOrders
  let allTransactions = filterTransactions(buyer.wallet.transactions, filters);
  
  // Sort transactions by creation date (newest first)
  // This is equivalent to the sort parameter in getPaginatedOrders
  allTransactions = sortTransactions(allTransactions);
  
  // Calculate pagination based on filtered results
  const totalTransactions = allTransactions.length;
  const totalPages = Math.ceil(totalTransactions / limit);
  const skip = (page - 1) * limit;
  
  // Apply pagination to get the requested page
  // This is equivalent to using skip/limit in database queries
  const paginatedTransactions = allTransactions.slice(skip, skip + limit);
  
  return {
    data: paginatedTransactions,
    pagination: {
      currentPage: page,
      totalPages,
      totalTransactions,
      hasMore: page < totalPages,
      hasPrevious: page > 1
    }
  };
}

module.exports = {
  getWalletTransactions,
  getPaginatedWalletTransactions,
  getPaginationOptions,
  getFilters,
  filterTransactions,
  sortTransactions
};
