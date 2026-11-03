/**
 * Get Wallet Transactions Service
 *
 * This service handles the business logic for retrieving and managing buyer wallet transactions.
 * It provides functionality to:
 * - Retrieve wallet transactions with pagination support
 * - Filter transactions by type, date range, and other criteria
 * - Sort transactions by creation date (newest first)
 * - Handle both paginated and non-paginated requests
 * - Process embedded transaction data from buyer documents
 *
 * The service ensures that:
 * - Transactions are properly filtered and sorted
 * - Pagination works correctly for large transaction sets
 * - Data transformation is consistent across all responses
 * - Performance is optimized for embedded data structures
 * - Error handling is graceful for missing wallet data
 *
 * Transaction Features:
 * - Multiple filter types (transaction type, date range)
 * - Sorting by creation date (newest first)
 * - Pagination support for large datasets
 * - Embedded data processing (transactions stored in buyer document)
 * - Flexible filtering options
 *
 * @module getWalletTransactionsService
 */

const buyerRepository = require('../repositories/buyer.repository');
const queryParser = require('../../../utils/queryParser');

/**
 * Extracts pagination options from the request query parameters.
 * 
 * This function delegates to the queryParser utility for consistent
 * pagination handling across the application.
 *
 * @param {Object} req - Express request object containing query parameters
 * @returns {Object} - Pagination configuration object
 *   - enabled: {boolean} - Whether pagination is enabled
 *   - page: {number} - Current page number
 *   - limit: {number} - Number of items per page
 */
function getPaginationOptions(req) {
  return queryParser.getPaginationOptions(req);
}

/**
 * Extracts filter parameters from the request query for wallet transactions listing.
 * 
 * This function processes the HTTP request query parameters and extracts
 * relevant filter values for transaction retrieval. It handles multiple filter types
 * and provides sensible defaults.
 *
 * Filter Types:
 * - type: Transaction type filter (credit, debit, etc.)
 * - startDate: Start date for date range filtering
 * - endDate: End date for date range filtering
 *
 * @param {Object} req - Express request object containing query parameters
 * @returns {Object} - Filters object to be passed to processing functions
 *   - type: {string} - Transaction type filter
 *   - startDate: {string} - Start date for filtering
 *   - endDate: {string} - End date for filtering
 */
function getFilters(req) {
  const filters = {};
  
  // Extract transaction type filter if provided
  if (req.query.type !== undefined) {
    filters.type = req.query.type;
  }
  
  // Extract start date filter if provided
  if (req.query.startDate !== undefined) {
    filters.startDate = req.query.startDate;
  }
  
  // Extract end date filter if provided
  if (req.query.endDate !== undefined) {
    filters.endDate = req.query.endDate;
  }
  
  return filters;
}

/**
 * Filter transactions based on provided filters.
 * 
 * This function applies multiple filter criteria to an array of transactions.
 * It handles type filtering and date range filtering with flexible options.
 *
 * Filter Logic:
 * - Type filter: Exact match on transaction type
 * - Date range filter: Inclusive range filtering with start/end dates
 * - Combined filters: All filters are applied together (AND logic)
 *
 * Date Filtering:
 * - Supports start date only, end date only, or both
 * - Uses inclusive date ranges (>= start, <= end)
 * - Handles date parsing and comparison
 *
 * @param {Array} transactions - Array of transaction objects to filter
 * @param {Object} filters - Filter criteria object
 * @param {string} filters.type - Optional transaction type filter
 * @param {string} filters.startDate - Optional start date filter
 * @param {string} filters.endDate - Optional end date filter
 * @returns {Array} Filtered transactions array
 */
function filterTransactions(transactions, filters) {
  // Create a copy of transactions array to avoid mutating the original
  let filteredTransactions = [...transactions];
  
  // Step 1: Filter by transaction type
  // Apply type filter if provided
  if (filters.type) {
    filteredTransactions = filteredTransactions.filter(
      transaction => transaction.type === filters.type
    );
  }
  
  // Step 2: Filter by date range
  // Apply date range filtering if start or end date is provided
  if (filters.startDate || filters.endDate) {
    filteredTransactions = filteredTransactions.filter(transaction => {
      const transactionDate = new Date(transaction.createdAt);
      
      // Handle both start and end date
      if (filters.startDate && filters.endDate) {
        const start = new Date(filters.startDate);
        const end = new Date(filters.endDate);
        return transactionDate >= start && transactionDate <= end;
      } 
      // Handle start date only
      else if (filters.startDate) {
        const start = new Date(filters.startDate);
        return transactionDate >= start;
      } 
      // Handle end date only
      else if (filters.endDate) {
        const end = new Date(filters.endDate);
        return transactionDate <= end;
      }
      
      return true; // No date filters applied
    });
  }
  
  return filteredTransactions;
}

/**
 * Sort transactions by creation date (most recent first).
 * 
 * This function sorts transactions in descending order by creation date,
 * ensuring the most recent transactions appear first.
 *
 * Sorting Logic:
 * - Uses JavaScript Date comparison
 * - Sorts in descending order (newest first)
 * - Handles date parsing from transaction.createdAt
 *
 * @param {Array} transactions - Array of transaction objects to sort
 * @returns {Array} Sorted transactions array (newest first)
 */
function sortTransactions(transactions) {
  return transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Retrieves all wallet transactions for a buyer without pagination.
 * 
 * This function is useful for cases like exporting all transactions or simple listings
 * where pagination is not required. It processes transactions with filtering and sorting.
 *
 * Business Logic Flow:
 * 1. Retrieve buyer document with wallet transactions
 * 2. Handle cases where buyer or wallet doesn't exist
 * 3. Apply filters to transactions
 * 4. Sort transactions by creation date
 * 5. Return all filtered and sorted transactions
 *
 * Use Cases:
 * - Exporting all transactions
 * - Small datasets where pagination isn't needed
 * - Admin interfaces requiring full data access
 *
 * @param {string} buyerId - The buyer's ID to get transactions for
 * @param {Object} filters - Query filters object
 * @param {string} filters.type - Optional transaction type filter
 * @param {string} filters.startDate - Optional start date filter
 * @param {string} filters.endDate - Optional end date filter
 * @returns {Promise<Object>} Formatted transactions data without pagination
 *   - data: {Array} - Array of transaction objects
 *   - pagination: {Object} - Empty pagination object
 */
async function getWalletTransactions(buyerId, filters = {}) {
  // Step 1: Retrieve buyer with wallet transactions
  const buyer = await buyerRepository.findById(buyerId);
  
  // Step 2: Handle cases where buyer or wallet doesn't exist
  if (!buyer || !buyer.wallet || !buyer.wallet.transactions) {
    return {
      data: [],
      pagination: {} // No pagination info returned for full list
    };
  }
  
  // Step 3: Filter and sort transactions
  let transactions = filterTransactions(buyer.wallet.transactions, filters);
  transactions = sortTransactions(transactions);
  
  // Step 4: Return formatted response
  return {
    data: transactions,
    pagination: {} // No pagination info returned for full list
  };
}

/**
 * Retrieves wallet transactions for a buyer with pagination - Main business logic function.
 * 
 * This function handles the complete process of retrieving paginated wallet transactions.
 * Since transactions are stored as embedded arrays within the buyer document, it retrieves
 * the entire buyer document first, then applies filtering and pagination in memory.
 *
 * Business Logic Flow:
 * 1. Retrieve buyer document with embedded wallet transactions
 * 2. Handle cases where buyer or wallet doesn't exist
 * 3. Filter all transactions based on provided criteria
 * 4. Sort transactions by creation date (newest first)
 * 5. Calculate pagination metadata
 * 6. Apply pagination to get requested page
 * 7. Return formatted response with transactions and pagination info
 *
 * Pagination Strategy:
 * - Filters all transactions first to get accurate total count
 * - Sorts transactions before applying pagination
 * - Calculates pagination metadata from filtered results
 * - Uses array slicing for pagination (since data is embedded)
 *
 * Performance Considerations:
 * - Retrieves entire buyer document (transactions are embedded)
 * - Applies filtering and sorting in memory
 * - Suitable for moderate transaction volumes
 * - For large transaction volumes, consider separate collection
 *
 * @param {string} buyerId - The buyer's ID to get transactions for
 * @param {Object} params - Parameters for pagination and filtering
 * @param {number} params.page - Page number (1-based)
 * @param {number} params.limit - Number of transactions per page
 * @param {Object} params.filters - Query filters object
 * @param {string} params.filters.type - Optional transaction type filter
 * @param {string} params.filters.startDate - Optional start date filter
 * @param {string} params.filters.endDate - Optional end date filter
 * @returns {Promise<Object>} Formatted transactions data with pagination
 *   - data: {Array} - Array of transaction objects for current page
 *   - pagination: {Object} - Pagination metadata
 *     - currentPage: {number} - Current page number
 *     - totalPages: {number} - Total number of pages
 *     - totalTransactions: {number} - Total number of transactions
 *     - hasMore: {boolean} - Whether there are more pages
 *     - hasPrevious: {boolean} - Whether there are previous pages
 *
 * @example
 * // Get paginated transactions with filters
 * const result = await getPaginatedWalletTransactions('507f1f77bcf86cd799439011', {
 *   page: 1,
 *   limit: 10,
 *   filters: {
 *     type: 'credit',
 *     startDate: '2023-01-01',
 *     endDate: '2023-12-31'
 *   }
 * });
 * // Returns: { data: [...], pagination: { currentPage: 1, totalPages: 5, ... } }
 */
async function getPaginatedWalletTransactions(buyerId, { page, limit, filters }) {
  // Step 1: Retrieve buyer with wallet transactions
  const buyer = await buyerRepository.findById(buyerId);
  
  // Step 2: Handle cases where buyer or wallet doesn't exist
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
  
  // Step 3: Filter all transactions first to get total count
  // This is equivalent to building a query in database-based pagination
  let allTransactions = filterTransactions(buyer.wallet.transactions, filters);
  
  // Step 4: Sort transactions by creation date (newest first)
  // This ensures consistent ordering across all pages
  allTransactions = sortTransactions(allTransactions);
  
  // Step 5: Calculate pagination based on filtered results
  const totalTransactions = allTransactions.length;
  const totalPages = Math.ceil(totalTransactions / limit);
  const skip = (page - 1) * limit;
  
  // Step 6: Apply pagination to get the requested page
  // This is equivalent to using skip/limit in database queries
  const paginatedTransactions = allTransactions.slice(skip, skip + limit);
  
  // Step 7: Return formatted response with pagination metadata
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
