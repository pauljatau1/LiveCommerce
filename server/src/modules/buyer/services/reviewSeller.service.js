/**
 * Review Seller Service
 *
 * This service handles the business logic for buyers reviewing sellers.
 * It provides functionality to:
 * - Validate review data (rating, comment, eligibility)
 * - Check buyer eligibility (follower or verified purchase)
 * - Create and store review objects
 * - Update seller rating statistics
 * - Calculate rating distributions and averages
 * - Prevent duplicate reviews
 *
 * The service ensures that:
 * - Only eligible buyers can write reviews
 * - Review data is properly validated
 * - Seller statistics are accurately updated
 * - No duplicate reviews are allowed
 * - Rating calculations are mathematically correct
 *
 * @module reviewSellerService
 */

const buyerRepository = require('../repositories/buyer.repository');
const ValidationError = require('../../../utils/errors/ValidationError');
const NotFoundException = require('../../../utils/errors/NotFoundException');

/**
 * Validates the rating value.
 *
 * This function ensures that the rating is within the acceptable range
 * of 1-5 stars. It throws a ValidationError if the rating is invalid.
 *
 * Rating Requirements:
 * - Must be a number between 1 and 5 (inclusive)
 * - 1 = Poor, 2 = Fair, 3 = Good, 4 = Very Good, 5 = Excellent
 *
 * @param {number} rating - The rating value to validate (1-5)
 * @throws {ValidationError} If rating is outside the valid range
 */
function validateRating(rating) {
  if (rating < 1 || rating > 5) {
    throw new ValidationError([{ field: 'rating', message: 'Rating must be between 1 and 5' }]);
  }
}

/**
 * Validates the comment length and content.
 *
 * This function ensures that the review comment meets minimum requirements
 * for meaningful feedback. It checks for minimum length and non-empty content.
 *
 * Comment Requirements:
 * - Must be at least 10 characters long
 * - Cannot be empty or only whitespace
 * - Should provide meaningful feedback
 *
 * @param {string} comment - The review comment to validate
 * @throws {ValidationError} If comment is too short or empty
 */
function validateComment(comment) {
  if (!comment || comment.trim().length < 10) {
    throw new ValidationError([{ field: 'comment', message: 'Comment must be at least 10 characters long' }]);
  }
}

/**
 * Checks if buyer has already reviewed the seller.
 *
 * This function examines the seller's reviews array to determine if the
 * buyer has already submitted a review. It prevents duplicate reviews
 * from the same buyer.
 *
 * @param {Object} seller - The seller object with reviews array
 * @param {string} buyerId - The buyer ID to check for existing review
 * @returns {boolean} True if buyer has already reviewed this seller
 */
function hasExistingReview(seller, buyerId) {
  return seller.reviews && seller.reviews.some(review => review.buyer.toString() === buyerId);
}

/**
 * Checks if buyer is a follower of the seller.
 *
 * This function examines the buyer's followers array to determine if they
 * are following the specified seller. This is used for review eligibility
 * validation.
 *
 * @param {Object} buyer - The buyer object with followers array
 * @param {string} sellerId - The seller ID to check following status
 * @returns {boolean} True if buyer is following this seller
 */
function isFollower(buyer, sellerId) {
  return buyer.followers && buyer.followers.some(follower => follower.sellerId.toString() === sellerId);
}

/**
 * Creates a new review object with all necessary data.
 *
 * This function constructs a complete review object with buyer information,
 * rating, comment, and metadata. It handles cases where buyer information
 * might be incomplete.
 *
 * Review Object Structure:
 * - buyer: Buyer ID reference
 * - rating: Numerical rating (1-5)
 * - comment: Review text
 * - buyerName: Formatted buyer name
 * - buyerImage: Buyer's profile image URL
 * - createdAt: Review timestamp
 * - isVerifiedPurchase: Whether buyer made a verified purchase
 *
 * @param {string} buyerId - The buyer ID creating the review
 * @param {Object} buyer - The buyer object with profile information
 * @param {number} rating - The rating value (1-5)
 * @param {string} comment - The review comment
 * @param {boolean} hasPurchase - Whether buyer has made a verified purchase
 * @returns {Object} Complete review object ready for storage
 */
function createReview(buyerId, buyer, rating, comment, hasPurchase) {
  // Format buyer name, fallback to 'Anonymous Buyer' if no name available
  const firstName = buyer.firstName || '';
  const lastName = buyer.lastName || '';
  const buyerName = `${firstName} ${lastName}`.trim() || 'Anonymous Buyer';
  
  return {
    buyer: buyerId,
    rating,
    comment,
    buyerName,
    buyerImage: buyer.profileImage?.url, // Optional profile image
    createdAt: new Date(),
    isVerifiedPurchase: hasPurchase // Flag for verified purchase reviews
  };
}

/**
 * Calculates the average rating from an array of ratings.
 *
 * This function computes the arithmetic mean of all ratings and returns
 * it as a formatted string with one decimal place. It handles edge cases
 * like empty arrays.
 *
 * Calculation Method:
 * - Sum all ratings and divide by total count
 * - Return '0' for empty arrays
 * - Format to one decimal place for consistency
 *
 * @param {Array} ratings - Array of rating numbers (1-5)
 * @returns {string} The average rating as a string with one decimal place
 */
function calculateAverageRating(ratings) {
  const totalRatings = ratings.length;
  if (totalRatings === 0) {
    return '0'; // Return '0' for sellers with no reviews
  }
  const sum = ratings.reduce((acc, rating) => acc + rating, 0);
  return (sum / totalRatings).toFixed(1); // Format to one decimal place
}

/**
 * Calculates rating distribution for each rating level.
 *
 * This function counts the number of reviews for each rating level (1-5)
 * and returns a distribution object. This is useful for displaying
 * rating breakdowns and statistics.
 *
 * Distribution Structure:
 * - 1: Count of 1-star reviews
 * - 2: Count of 2-star reviews
 * - 3: Count of 3-star reviews
 * - 4: Count of 4-star reviews
 * - 5: Count of 5-star reviews
 *
 * @param {Array} ratings - Array of rating numbers (1-5)
 * @returns {Object} Rating distribution object with counts for each level
 */
function calculateRatingDistribution(ratings) {
  return {
    1: ratings.filter(r => r === 1).length,
    2: ratings.filter(r => r === 2).length,
    3: ratings.filter(r => r === 3).length,
    4: ratings.filter(r => r === 4).length,
    5: ratings.filter(r => r === 5).length
  };
}

/**
 * Updates seller's rating statistics.
 *
 * This function recalculates and updates all rating-related statistics
 * for the seller based on their current reviews. It ensures the stats
 * object exists and updates all relevant metrics.
 *
 * Statistics Updated:
 * - averageRating: Mean rating across all reviews
 * - totalReviews: Total number of reviews
 * - ratingDistribution: Breakdown of ratings by level
 *
 * @param {Object} seller - The seller object to update statistics for
 */
function updateSellerRatingStats(seller) {
  // Extract all ratings from seller's reviews
  const ratings = seller.reviews.map(review => review.rating);
  const totalRatings = ratings.length;

  // Ensure stats object exists with default structure
  if (!seller.stats) {
    seller.stats = {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
  }

  // Update all statistics with recalculated values
  seller.stats.averageRating = calculateAverageRating(ratings);
  seller.stats.totalReviews = totalRatings;
  seller.stats.ratingDistribution = calculateRatingDistribution(ratings);
}

/**
 * Validates that both seller and buyer exist.
 *
 * This function checks that both the seller and buyer objects exist
 * before proceeding with the review process. It throws appropriate
 * exceptions if either is missing.
 *
 * @param {Object} seller - The seller object to validate
 * @param {Object} buyer - The buyer object to validate
 * @throws {NotFoundException} If seller or buyer is not found
 */
function validateSellerAndBuyer(seller, buyer) {
  if (!seller) {
    throw new NotFoundException('Seller not found');
  }
  if (!buyer) {
    throw new NotFoundException('Buyer not found');
  }
}

/**
 * Checks buyer's eligibility to review the seller.
 *
 * This function validates that the buyer meets the requirements to
 * write a review. Buyers must either be followers of the seller or
 * have made a verified purchase from the seller.
 *
 * Eligibility Requirements:
 * - Must be a follower of the seller, OR
 * - Must have made a verified purchase from the seller
 *
 * @param {Object} buyer - The buyer object to check eligibility
 * @param {string} sellerId - The seller ID to check against
 * @param {boolean} hasPurchase - Whether buyer has made a verified purchase
 * @throws {ValidationError} If buyer is not eligible to review
 */
function validateReviewEligibility(buyer, sellerId, hasPurchase) {
  const isFollowerOfSeller = isFollower(buyer, sellerId);
  if (!hasPurchase && !isFollowerOfSeller) {
    throw new ValidationError([{ 
      field: 'eligibility', 
      message: 'You must be a follower of this seller or have made a purchase to write a review' 
    }]);
  }
}

/**
 * Reviews a seller's store - Main business logic function.
 *
 * This is the primary service function that orchestrates the complete
 * review submission process. It performs comprehensive validation,
 * creates the review, and updates seller statistics.
 *
 * Business Logic Flow:
 * 1. Validates rating and comment data
 * 2. Fetches seller and buyer data concurrently
 * 3. Validates that both seller and buyer exist
 * 4. Checks for existing review to prevent duplicates
 * 5. Verifies buyer's purchase history with the seller
 * 6. Validates buyer's eligibility to review
 * 7. Creates the review object with all necessary data
 * 8. Adds review to seller's reviews array
 * 9. Updates seller's rating statistics
 * 10. Saves the updated seller data
 * 11. Returns the created review
 *
 * Validation Features:
 * - Rating must be 1-5 stars
 * - Comment must be at least 10 characters
 * - No duplicate reviews from same buyer
 * - Buyer must be follower or have verified purchase
 * - Both seller and buyer must exist
 *
 * @param {string} buyerId - The buyer ID submitting the review
 * @param {string} sellerId - The seller ID being reviewed
 * @param {Object} reviewData - The review data object
 * @param {number} reviewData.rating - The rating value (1-5)
 * @param {string} reviewData.comment - The review comment
 * @returns {Promise<Object>} The created review object
 * @throws {ValidationError} If review data is invalid or buyer is not eligible
 * @throws {NotFoundException} If seller or buyer is not found
 * @throws {Error} If database operations fail
 *
 * @example
 * // Submit a review
 * const review = await reviewSeller('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012', {
 *   rating: 5,
 *   comment: 'Excellent service and fast delivery!'
 * });
 * // Returns the created review object
 */
async function reviewSeller(buyerId, sellerId, reviewData) {
  const { rating, comment } = reviewData;

  // Step 1: Validate rating and comment data
  validateRating(rating);
  validateComment(comment);

  // Step 2: Fetch seller and buyer data concurrently
  // Using Promise.all for better performance
  const [seller, buyer] = await Promise.all([
    buyerRepository.findSellerById(sellerId),
    buyerRepository.findById(buyerId)
  ]);

  // Step 3: Validate that both seller and buyer exist
  validateSellerAndBuyer(seller, buyer);

  // Step 4: Check for existing review to prevent duplicates
  if (hasExistingReview(seller, buyerId)) {
    throw new ValidationError([{ field: 'review', message: 'You have already reviewed this seller' }]);
  }

  // Step 5: Verify buyer's purchase history with the seller
  const hasPurchase = await buyerRepository.hasVerifiedPurchase(buyerId, sellerId);
  
  // Step 6: Validate buyer's eligibility to review
  validateReviewEligibility(buyer, sellerId, hasPurchase);

  // Step 7: Create the review object with all necessary data
  const review = createReview(buyerId, buyer, rating, comment, hasPurchase);
  
  // Step 8: Add review to seller's reviews array
  seller.reviews.push(review);
  
  // Step 9: Update seller's rating statistics
  updateSellerRatingStats(seller);
  
  // Step 10: Save the updated seller data
  await buyerRepository.saveSeller(seller);

  // Step 11: Return the created review
  return review;
}

module.exports = {
  reviewSeller,
  validateRating,
  validateComment,
  hasExistingReview,
  isFollower,
  createReview,
  updateSellerRatingStats,
  calculateAverageRating,
  calculateRatingDistribution,
  validateSellerAndBuyer,
  validateReviewEligibility
}; 