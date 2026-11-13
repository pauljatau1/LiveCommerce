/**
 * Get Wallet Balance Service
 *
 * This service handles the business logic for retrieving a buyer's wallet balance
 * and managing on-hold items from auctions. It provides functionality to:
 * - Retrieve buyer's wallet information with on-hold items
 * - Filter out ended auctions from on-hold items
 * - Recalculate on-hold amounts based on valid items
 * - Format wallet data for frontend display
 * - Update wallet when ended auctions are detected
 * - Maintain data consistency and accuracy
 *
 * The service ensures that wallet balances are accurate by automatically
 * releasing holds on ended auctions and providing real-time balance information.
 *
 * @module getWalletBalanceService
 */

const buyerRepository = require('../repositories/buyer.repository');

/**
 * Filter out ended auctions and non-existent products from on-hold items.
 *
 * This function processes the buyer's on-hold items and removes any items
 * associated with ended auctions or non-existent products to maintain
 * accurate wallet balance calculations.
 *
 * Business Logic:
 * - Validates product existence in on-hold items
 * - Checks auction status for each product
 * - Filters out items with ended auctions
 * - Removes items with non-existent products
 * - Maintains data integrity for balance calculations
 *
 * @param {Array} onHoldItems - Array of on-hold item objects
 * @param {Object} onHoldItems[].productId - Product object with auction information
 * @param {Object} onHoldItems[].productId.auction - Auction object with status
 * @param {string} onHoldItems[].productId.auction.status - Auction status
 * @returns {Array} Filtered on-hold items with only valid, active auctions
 * @example
 * const items = [
 *   { productId: { auction: { status: 'active' } } },
 *   { productId: { auction: { status: 'ended' } } }
 * ];
 * const filtered = filterValidOnHoldItems(items); // Returns only active auction items
 */
function filterValidOnHoldItems(onHoldItems) {
  return onHoldItems.filter(item => 
    item.productId && item.productId.auction?.status !== 'ended'
  );
}

/**
 * Calculate total amount from on-hold items.
 *
 * This function calculates the total amount currently on hold by summing
 * the amounts of all valid on-hold items.
 *
 * Business Logic:
 * - Iterates through on-hold items array
 * - Sums up individual item amounts
 * - Returns total on-hold amount
 * - Handles empty arrays gracefully
 *
 * @param {Array} onHoldItems - Array of on-hold item objects
 * @param {number} onHoldItems[].amount - Amount on hold for each item
 * @returns {number} Total amount currently on hold
 * @example
 * const items = [{ amount: 100 }, { amount: 200 }];
 * const total = calculateOnHoldAmount(items); // Returns 300
 */
function calculateOnHoldAmount(onHoldItems) {
  return onHoldItems.reduce((total, item) => total + item.amount, 0);
}

/**
 * Format on-hold items for frontend display.
 *
 * This function transforms on-hold items from database format into a
 * clean, consistent format suitable for frontend consumption.
 *
 * Business Logic:
 * - Extracts essential product information
 * - Provides fallback values for missing data
 * - Formats auction information for display
 * - Maintains consistent response structure
 * - Handles missing or invalid data gracefully
 *
 * @param {Array} onHoldItems - Array of on-hold item objects
 * @param {Object} onHoldItems[].productId - Product object with details
 * @param {string} onHoldItems[].productId._id - Product unique identifier
 * @param {string} onHoldItems[].productId.name - Product name
 * @param {Array} onHoldItems[].productId.images - Product images array
 * @param {number} onHoldItems[].amount - Amount on hold
 * @param {Date} onHoldItems[].bidDate - When the bid was placed
 * @param {Object} onHoldItems[].productId.auction - Auction information
 * @param {string} onHoldItems[].productId.auction.status - Auction status
 * @param {Date} onHoldItems[].productId.auction.endDate - Auction end date
 * @returns {Array} Formatted on-hold items for frontend display
 * @example
 * // Input: Database on-hold items with populated products
 * // Output: [{ productId: "123", productName: "Phone", amount: 100, ... }]
 */
function formatOnHoldItems(onHoldItems) {
  return onHoldItems.map(item => ({
    productId: item.productId?._id || item.productId,
    productName: item.productId?.name,
    productImage: item.productId?.images && item.productId.images.length > 0 ? 
      item.productId.images[0].url : null,
    amount: item.amount,
    bidDate: item.bidDate,
    auctionStatus: item.productId?.auction?.status,
    auctionEndDate: item.productId?.auction?.endDate
  }));
}

/**
 * Get buyer's wallet balance with on-hold items and formatted data.
 * 
 * This function orchestrates the complete process of retrieving and processing
 * a buyer's wallet information, including automatic cleanup of ended auctions
 * and formatting of data for frontend consumption.
 *
 * Business Logic Flow:
 * 1. Retrieve buyer with populated wallet on-hold items
 * 2. Filter out ended auctions and invalid items
 * 3. Recalculate on-hold amount based on valid items
 * 4. Update buyer's wallet if cleanup was needed
 * 5. Format on-hold items for frontend display
 * 6. Return comprehensive wallet balance information
 *
 * Security Considerations:
 * - Buyer existence validation prevents unauthorized access
 * - Data filtering prevents exposure of invalid information
 * - Automatic cleanup maintains data accuracy
 * - Proper error handling for edge cases
 *
 * @param {string} buyerId - The buyer's unique identifier
 * @returns {Promise<Object>} Wallet balance information with formatted data
 * @throws {Error} If buyer is not found or database operation fails
 * @example
 * const walletInfo = await getWalletBalance("507f1f77bcf86cd799439011");
 * // Returns: { balance: 1000, onHoldAmount: 300, availableBalance: 700, ... }
 */
async function getWalletBalance(buyerId) {
  // Step 1: Get buyer with populated wallet on-hold items
  // This retrieves the complete wallet information including product details
  const buyer = await buyerRepository.findByIdWithWalletOnHoldItems(buyerId);
  
  if (!buyer) {
    throw new Error('Buyer not found');
  }

  // Step 2: Filter out ended auctions and non-existent products
  // This ensures only valid, active auction items are considered
  const filteredOnHoldItems = filterValidOnHoldItems(buyer.wallet.onHoldItems);

  // Step 3: Calculate the total amount still on hold
  // This provides the accurate on-hold amount for balance calculations
  const recalculatedOnHoldAmount = calculateOnHoldAmount(filteredOnHoldItems);

  // Step 4: Update buyer's wallet if cleanup was needed
  // This automatically releases holds for ended auctions
  // wallet.onHoldAmount also holds live-show bid holds, which are not in
  // onHoldItems. Release only what the ended items held; never overwrite it.
  const releasedAmount = calculateOnHoldAmount(buyer.wallet.onHoldItems) - recalculatedOnHoldAmount;
  if (filteredOnHoldItems.length !== buyer.wallet.onHoldItems.length) {
    await buyerRepository.updateWalletOnHoldItems(buyerId, filteredOnHoldItems, releasedAmount);
    console.log(`Released holds for ended auctions for buyer ${buyerId}`);
  }
  const deliveries=await require('../../../models/ShowDelivery').find({buyer:buyerId,depositHeld:{$gt:0}}).select('depositHeld').lean();
  const deliveryHeld=deliveries.reduce((sum,d)=>sum+d.depositHeld,0);
  const onHoldAmount = Math.max(recalculatedOnHoldAmount, (buyer.wallet.onHoldAmount || 0) - releasedAmount);

  // Step 5: Format on-hold items for better frontend display
  // This transforms the data into a user-friendly format
  const formattedOnHoldItems = formatOnHoldItems(filteredOnHoldItems);

  // Step 6: Return formatted wallet balance information
  return {
    ...(Object.values(require('../../../services/wallet/paystackClient').methods()).some(Boolean) ? { topUpMethods: require('../../../services/wallet/paystackClient').methods() } : {}),
    balance: buyer.wallet.balance,
    onHoldAmount,deliveryHeld,bidHeld:Math.max(0,onHoldAmount-deliveryHeld),
    availableBalance: buyer.wallet.balance - onHoldAmount,
    onHoldItems: formattedOnHoldItems,
    currency: buyer.wallet.currency
  };
}

module.exports = {
  getWalletBalance
}; 