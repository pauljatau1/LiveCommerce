/**
 * Seller Repository
 *
 * This repository contains all database operations related to the Seller model.
 * It provides methods for finding, updating, and managing seller data.
 *
 * @module sellerRepository
 */

const Seller = require('../../../models/Seller');

/**
 * Find a seller by ID with comprehensive field selection.
 * 
 * This function retrieves a seller with all relevant fields for buyer operations.
 * It includes business information, verification status, store details, and social data.
 *
 * Selected Fields Include:
 * - Business: firstName, lastName, email, businessName, businessType, taxInformation
 * - Store: storeName, aboutStore, storeAvatar, storeBanner, categories
 * - Verification: isVerified, verificationDocuments, smileIdVerification
 * - Social: followers, reviews, stats
 * - Settings: vacationMode, shippingOptions, warehouseDetails
 * - Categories: categories (for store categorization)
 * - Social: socialMedia, followers
 * - Stats: reviews, stats (for store performance metrics)
 * - Settings: vacationMode, shippingOptions, warehouseDetails
 *
 * @param {string} sellerId - The seller's ID to retrieve
 * @returns {Promise<Seller|null>} Seller document with selected fields or null if not found
 */
async function findById(sellerId) {
  return Seller.findById(sellerId)
    .select('firstName lastName email businessName businessType taxInformation businessEmail businessNumber accountPending businessAddress accountType isVerified isInternational verificationDocuments smileIdVerification cancelledStreamCount lastStreamCancellation categories shippingOptions warehouseDetails storeName aboutStore storeAvatar storeBanner socialMedia vacationMode isFeatured createdAt updatedAt followers reviews stats')
    .populate('reviews'); // Populate reviews for immediate access to review data
}

/**
 * Count buyers following a seller.
 * 
 * This function counts the number of buyers who are following a specific seller.
 * It retrieves only the followers field to optimize performance and then
 * returns the length of the followers array.
 *
 * @param {string} sellerId - The seller's ID to count followers for
 * @returns {Promise<number>} Number of buyers following the seller
 */
async function countBuyersFollowingSeller(sellerId) {
  const seller = await Seller.findById(sellerId).select('followers'); // Only retrieve followers field
  return seller.followers.length; // Return the count of followers
}

/**
 * Increment store visits for a seller.
 * 
 * This function increments the store visits count for a seller.
 * It uses MongoDB's atomic $inc operator to safely increment the counter
 * without race conditions.
 *
 * @param {string} sellerId - The seller's ID to increment visits for
 * @returns {Promise<Object|null>} Updated seller document or null if not found
 */
async function incrementStoreVisits(sellerId) {
  return Seller.findByIdAndUpdate(
    sellerId,
    { $inc: { 'storeVisits': 1 } }, // Atomically increment store visits
    { new: true } // Return the updated document
  );
}

/**
 * Save a seller instance.
 * 
 * This function saves a seller instance to the database.
 * It's used when seller data has been modified and needs to be persisted.
 *
 * @param {Object} seller - The seller instance to save
 * @returns {Promise<Seller>} The saved seller document
 */
async function save(seller) {
  return seller.save();
}

/**
 * Find seller with reviews and stats.
 * 
 * This function retrieves a seller with their review statistics and
 * rating information. It's optimized to only fetch the fields needed
 * for review-related functionality.
 *
 * Selected Fields:
 * - reviews: Array of review objects
 * - stats.averageRating: Average rating across all reviews
 * - stats.totalReviews: Total number of reviews
 * - stats.ratingDistribution: Breakdown of ratings by level
 *
 * @param {string} sellerId - The seller's ID to retrieve reviews for
 * @returns {Promise<Seller|null>} Seller with reviews and stats or null if not found
 */
async function findWithReviews(sellerId) {
  // Query seller by ID and select only the fields needed for reviews functionality
  return Seller.findById(sellerId)
    .select('reviews stats.averageRating stats.totalReviews stats.ratingDistribution');
}

/**
 * Find sellers that match the given query with pagination and sorting.
 * 
 * This function retrieves sellers based on query filters with support for
 * pagination and sorting. It's optimized for the "sellers to follow" functionality.
 *
 * Selected Fields:
 * - storeName, businessName: Store identification
 * - aboutStore, storeAvatar: Store presentation
 * - categories: Store categorization
 * - stats, followers: Store metrics
 * - isVerified, isFeatured: Store status
 * - createdAt: Store creation date
 *
 * @param {Object} options - Query options
 * @param {Object} options.query - MongoDB query filters
 * @param {Object} options.sortOptions - Sorting options
 * @param {number} options.skip - Number of documents to skip
 * @param {number} options.limit - Number of documents to return
 * @returns {Promise<Array>} Array of sellers that can be followed
 */
async function findSellersToFollow({ query, sortOptions, skip, limit }) {
  return await Seller.find(query)
    .select(`
      storeName businessName aboutStore storeAvatar 
      categories stats followers isVerified isFeatured 
      createdAt
    `)
    .sort(sortOptions)
    .skip(skip)
    .limit(limit)
    .lean();
}

/**
 * Count sellers that match the given query.
 * 
 * @param {Object} query - MongoDB query filters
 * @returns {Promise<number>} Count of matching sellers
 */
async function countSellersToFollow(query) {
  return await Seller.countDocuments(query);
}

/**
 * Find sellers with randomization.
 * 
 * @param {Object} query - MongoDB query filters
 * @param {number} limit - Number of documents to return
 * @param {number} randomSkip - Random skip value for randomization
 * @returns {Promise<Array>} Array of sellers that can be followed
 */
async function findSellersToFollowRandomized(query, limit, randomSkip) {
  return await Seller.find(query)
    .select(`
      storeName businessName aboutStore storeAvatar 
      categories stats followers isVerified isFeatured 
      createdAt
    `)
    .skip(randomSkip)
    .limit(limit)
    .lean();
}

/**
 * Find seller IDs that a buyer is already following.
 * 
 * @param {string} buyerId - The buyer's ID
 * @returns {Promise<Array>} Array of seller IDs that the buyer follows
 */
async function findFollowedSellerIds(buyerId) {
  return await Seller.find({
    'followers.buyerId': buyerId
  }).distinct('_id');
}

module.exports = {
  findById,
  countBuyersFollowingSeller,
  incrementStoreVisits,
  save,
  findWithReviews,
  findSellersToFollow,
  countSellersToFollow,
  findSellersToFollowRandomized,
  findFollowedSellerIds
};
