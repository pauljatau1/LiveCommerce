const buyerRepository = require('../repositories/buyer.repository');

/**
 * Filter out ended auctions and non-existent products from on-hold items
 * @param {Array} onHoldItems - Array of on-hold items
 * @returns {Array} Filtered on-hold items
 */
function filterValidOnHoldItems(onHoldItems) {
  return onHoldItems.filter(item => 
    item.productId && item.productId.auction?.status !== 'ended'
  );
}

/**
 * Calculate total amount from on-hold items
 * @param {Array} onHoldItems - Array of on-hold items
 * @returns {number} Total amount on hold
 */
function calculateOnHoldAmount(onHoldItems) {
  return onHoldItems.reduce((total, item) => total + item.amount, 0);
}

/**
 * Format on-hold items for frontend display
 * @param {Array} onHoldItems - Array of on-hold items
 * @returns {Array} Formatted on-hold items
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
 * This service retrieves the buyer's wallet information, filters out ended auctions
 * from on-hold items, recalculates the on-hold amount, and formats the response
 * for frontend display. It also updates the buyer's wallet if there are ended auctions
 * that need to be released from hold.
 * 
 * @param {string} buyerId - The buyer's ID
 * @returns {Promise<Object>} Wallet balance information with formatted data
 * @throws {Error} If buyer is not found or database operation fails
 */
async function getWalletBalance(buyerId) {
  // Get buyer with populated wallet on-hold items
  const buyer = await buyerRepository.findByIdWithWalletOnHoldItems(buyerId);
  
  if (!buyer) {
    throw new Error('Buyer not found');
  }

  // Filter out ended auctions and non-existent products from on-hold items
  const filteredOnHoldItems = filterValidOnHoldItems(buyer.wallet.onHoldItems);

  // Calculate the total amount still on hold
  const recalculatedOnHoldAmount = calculateOnHoldAmount(filteredOnHoldItems);

  // If we have on-hold items for ended auctions, update the buyer's wallet
  if (filteredOnHoldItems.length !== buyer.wallet.onHoldItems.length) {
    // Update the buyer's wallet with filtered items and recalculated amount
    await buyerRepository.updateWalletOnHoldItems(buyerId, filteredOnHoldItems, recalculatedOnHoldAmount);
    console.log(`Released holds for ended auctions for buyer ${buyerId}`);
  }

  // Format on-hold items for better frontend display
  const formattedOnHoldItems = formatOnHoldItems(filteredOnHoldItems);

  // Return formatted wallet balance information
  return {
    balance: buyer.wallet.balance,
    onHoldAmount: recalculatedOnHoldAmount,
    availableBalance: buyer.wallet.balance - recalculatedOnHoldAmount,
    onHoldItems: formattedOnHoldItems,
    currency: buyer.wallet.currency
  };
}

module.exports = {
  getWalletBalance
}; 