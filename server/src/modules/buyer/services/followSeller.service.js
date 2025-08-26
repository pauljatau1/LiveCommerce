/**
 * Follow Seller Service
 *
 * This service handles the business logic for buyers following sellers.
 * It provides functionality to:
 * - Validate follow requests and prevent duplicate follows
 * - Manage seller followers list with buyer information
 * - Update buyer activity feeds with follow activities
 * - Create notifications and send emails to sellers
 * - Handle address mapping and data synchronization
 *
 * The service ensures that:
 * - Buyers cannot follow the same seller multiple times
 * - Activity feeds are properly maintained
 * - Notifications are sent to sellers about new followers
 * - Data integrity is maintained across buyer and seller records
 *
 * @module followSellerService
 */

const buyerRepository = require('../repositories/buyer.repository');
const followSellerValidator = require('../validators/followSeller.validator');
const Seller = require('../../../models/Seller');
const notificationController = require('../../../controllers/notificationController');
const InternalErrorException = require('../../../utils/errors/InternalErrorException');

/**
 * Check if buyer is already following the seller.
 *
 * This function examines the seller's followers array to determine
 * if the buyer is already in the followers list. It performs a case-sensitive
 * comparison of buyer IDs to ensure accurate duplicate detection.
 *
 * @param {Object} seller - The seller object with followers array
 * @param {string} buyerId - The buyer's ID to check
 * @returns {boolean} True if buyer is already following the seller
 */
function isAlreadyFollowing(seller, buyerId) {
  return seller.followers.some(
    follower => follower.buyerId && follower.buyerId.toString() === buyerId
  );
}

/**
 * Check if buyer has existing follow activity for this seller.
 *
 * This function examines the buyer's activity feed to determine if there's
 * already a follow activity entry for the specified seller. This helps prevent
 * duplicate activity entries and ensures data consistency.
 *
 * @param {Object} buyer - The buyer object with activityFeed array
 * @param {string} sellerId - The seller's ID to check for existing activity
 * @returns {boolean} True if follow activity already exists for this seller
 */
function hasExistingFollowActivity(buyer, sellerId) {
  return buyer.activityFeed?.some(
    activity => 
      activity.type === 'follow' &&
      activity.referenceModel === 'Seller' &&
      activity.reference.toString() === sellerId
  );
}

/**
 * Remove existing follow activity from buyer's activity feed.
 *
 * This function filters out any existing follow activities for the specified
 * seller from the buyer's activity feed. This ensures clean activity data
 * and prevents duplicate entries when re-following a seller.
 *
 * @param {Object} buyer - The buyer object to update
 * @param {string} sellerId - The seller's ID to remove activities for
 */
function removeExistingFollowActivity(buyer, sellerId) {
  buyer.activityFeed = buyer.activityFeed.filter(
    activity => !(
      activity.type === 'follow' &&
      activity.referenceModel === 'Seller' &&
      activity.reference.toString() === sellerId
    )
  );
}

/**
 * Map buyer's shipping address to seller's expected format.
 *
 * This function extracts the buyer's primary shipping address and transforms
 * it into the format expected by the seller's followers list. It handles
 * cases where the buyer has no shipping addresses by returning null.
 *
 * Address Mapping:
 * - addressLine1 → address1
 * - addressLine2 → address2
 * - zipCode → zipCode (direct mapping)
 * - country and city (direct mapping)
 *
 * @param {Object} buyer - The buyer object with shippingAddresses array
 * @returns {Object|null} Mapped address object or null if no addresses exist
 */
function mapBuyerAddress(buyer) {
  // Check if buyer has any shipping addresses
  if (!buyer.shippingAddresses || buyer.shippingAddresses.length === 0) {
    return null;
  }

  // Use the first (primary) shipping address
  const address = buyer.shippingAddresses[0];
  return {
    country: address.country,
    city: address.city,
    address1: address.addressLine1,
    address2: address.addressLine2,
    zipCode: address.zipCode
  };
}

/**
 * Add buyer to seller's followers list.
 *
 * This function adds a new follower entry to the seller's followers array.
 * It includes essential buyer information and metadata about the follow
 * relationship for future reference and analytics.
 *
 * Follower Data Structure:
 * - buyerId: Reference to the buyer
 * - firstName, lastName: Buyer's name for display
 * - email: Buyer's email for communication
 * - followDate: When the follow relationship was established
 * - totalOrders: Initial order count (0 for new followers)
 * - mainAddress: Buyer's primary shipping address
 *
 * @param {Object} seller - The seller object to add follower to
 * @param {Object} buyer - The buyer object with follower information
 * @param {Object} mainAddress - The buyer's mapped shipping address
 */
function addBuyerToFollowers(seller, buyer, mainAddress) {
  seller.followers.push({
    buyerId: buyer._id,
    firstName: buyer.firstName,
    lastName: buyer.lastName,
    email: buyer.email,
    followDate: new Date(),
    totalOrders: 0, // Initialize with 0 orders
    mainAddress: mainAddress
  });
}

/**
 * Add follow activity to buyer's activity feed.
 *
 * This function creates a new activity entry in the buyer's activity feed
 * to record the follow action. It ensures the activity feed exists and
 * adds a properly formatted activity entry.
 *
 * Activity Structure:
 * - type: 'follow' (activity type)
 * - content: Human-readable description of the action
 * - reference: ID of the followed seller
 * - referenceModel: 'Seller' (type of referenced entity)
 * - createdAt: Timestamp of the activity
 *
 * @param {Object} buyer - The buyer object to add activity to
 * @param {Object} seller - The seller object being followed
 */
function addFollowActivity(buyer, seller) {
  // Initialize activity feed if it doesn't exist
  if (!buyer.activityFeed) {
    buyer.activityFeed = [];
  }

  // Add the follow activity to the feed
  buyer.activityFeed.push({
    type: 'follow',
    content: `Started following ${seller.storeName || seller.businessName}`,
    reference: seller._id,
    referenceModel: 'Seller',
    createdAt: new Date()
  });
}

/**
 * Create notification for the seller about new follower.
 *
 * This function creates an in-app notification for the seller to inform
 * them about the new follower. The notification includes relevant buyer
 * information for context.
 *
 * Notification Data:
 * - buyerId: ID of the new follower
 * - buyerName: Full name of the buyer
 * - followDate: When the follow occurred
 *
 * @param {string} sellerId - The seller's ID to create notification for
 * @param {Object} buyer - The buyer object with follower information
 */
async function createSellerNotification(sellerId, buyer) {
  await notificationController.createNotification(sellerId, 'new_follower', {
    buyerId: buyer._id.toString(),
    buyerName: `${buyer.firstName} ${buyer.lastName}`,
    followDate: new Date()
  });
}

/**
 * Send email notification to seller about new follower.
 *
 * This function sends an email notification to the seller about the new
 * follower. It uses a try-catch block to ensure that email failures don't
 * interrupt the main follow process.
 *
 * Error Handling:
 * - Email failures are logged but don't stop the follow process
 * - This ensures the follow action completes even if email delivery fails
 *
 * @param {Object} seller - The seller object with email information
 * @param {Object} buyer - The buyer object with name information
 */
async function sendFollowerEmail(seller, buyer) {
  try {
    await notificationController.sendNewFollowerEmail(seller, `${buyer.firstName} ${buyer.lastName}`);
  } catch (emailError) {
    console.error('Failed to send new follower email:', emailError);
    // Continue execution even if email fails
  }
}

/**
 * Follow a seller by a buyer - Main business logic function.
 *
 * This is the primary service function that orchestrates the entire
 * follow process. It performs comprehensive validation, data updates,
 * and notification creation to establish a follow relationship.
 *
 * Business Logic Flow:
 * 1. Validates the follow request (buyer and seller existence, permissions)
 * 2. Checks for existing follow relationship to prevent duplicates
 * 3. Removes any existing follow activities to maintain clean data
 * 4. Maps buyer's shipping address to seller's expected format
 * 5. Adds buyer to seller's followers list with complete information
 * 6. Updates seller's verification documents structure if needed
 * 7. Saves seller data to persist follower information
 * 8. Adds follow activity to buyer's activity feed
 * 9. Saves buyer data to persist activity information
 * 10. Creates in-app notification for the seller
 * 11. Sends email notification to the seller
 * 12. Returns comprehensive follow data and counts
 *
 * Data Integrity Features:
 * - Prevents duplicate follows through comprehensive checking
 * - Maintains clean activity feeds by removing old entries
 * - Ensures proper data structure for verification documents
 * - Handles address mapping for shipping information
 *
 * @param {string} buyerId - The buyer's ID who wants to follow the seller
 * @param {string} sellerId - The seller's ID to be followed
 * @returns {Promise<Object>} Object containing follow data and counts
 *   - followData: {Object} - The created follower entry
 *   - sellerFollowCount: {number} - Total number of seller's followers
 *   - buyerFollowingCount: {number} - Total number of sellers the buyer follows
 * @throws {ValidationError} If follow request validation fails
 * @throws {InternalErrorException} If buyer is already following the seller
 * @throws {Error} If database operations fail
 *
 * @example
 * // Follow a seller
 * const result = await followSeller('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012');
 * // Returns: {
 * //   followData: { buyerId: '...', firstName: 'John', ... },
 * //   sellerFollowCount: 150,
 * //   buyerFollowingCount: 25
 * // }
 */
async function followSeller(buyerId, sellerId) {
  // Step 1: Validate the follow request
  // This ensures buyer and seller exist and have proper permissions
  await followSellerValidator.validateFollowSellerData(buyerId, sellerId);

  // Step 2: Get buyer and seller data concurrently
  // Using Promise.all for better performance
  const [buyer, seller] = await Promise.all([
    buyerRepository.findById(buyerId),
    Seller.findById(sellerId)
  ]);

  // Step 3: Check if already following to prevent duplicates
  if (isAlreadyFollowing(seller, buyerId)) {
    throw new InternalErrorException('Already following this seller');
  }

  // Step 4: Remove existing follow activity if present
  // This ensures clean activity feed data
  if (hasExistingFollowActivity(buyer, sellerId)) {
    removeExistingFollowActivity(buyer, sellerId);
  }

  // Step 5: Map buyer's address to seller's expected format
  const mainAddress = mapBuyerAddress(buyer);

  // Step 6: Add buyer to seller's followers list
  addBuyerToFollowers(seller, buyer, mainAddress);
  
  // Step 7: Ensure verificationDocuments is properly structured before saving
  // This prevents schema validation errors during save operation
  if (Array.isArray(seller.verificationDocuments)) {
    seller.verificationDocuments = {
      type: null,
      documents: []
    };
  } else if (!seller.verificationDocuments || typeof seller.verificationDocuments !== 'object') {
    seller.verificationDocuments = {
      type: null,
      documents: []
    };
  }
  
  // Step 8: Save seller data to persist follower information
  await seller.save();

  // Step 9: Add follow activity to buyer's activity feed
  addFollowActivity(buyer, seller);
  
  // Step 10: Save buyer data to persist activity information
  await buyer.save();

  // Step 11: Get following count for response
  const followingCount = await buyerRepository.getFollowingCount(buyerId).catch(() => 0);

  // Step 12: Create notifications (in-app and email)
  await createSellerNotification(sellerId, buyer);
  await sendFollowerEmail(seller, buyer);

  // Step 13: Return comprehensive follow data and counts
  return {
    followData: seller.followers[seller.followers.length - 1], // Return the newly added follower
    sellerFollowCount: seller.followers.length, // Total followers count
    buyerFollowingCount: followingCount // Buyer's following count
  };
}

module.exports = {
  followSeller
}; 