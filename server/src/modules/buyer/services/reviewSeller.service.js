/**
 * Service for reviewing a seller's store
 * @module reviewSeller.service
 */

const buyerRepository = require('../repositories/buyer.repository');
const ValidationError = require('../../../utils/errors/ValidationError');
const NotFoundException = require('../../../utils/errors/NotFoundException');


/**
 * Validates the rating value
 * @param {number} rating - The rating value to validate
 * @throws {ValidationError} If rating is invalid
 */
function validateRating(rating) {
  if (rating < 1 || rating > 5) {
    throw new ValidationError([{ field: 'rating', message: 'Rating must be between 1 and 5' }]);
  }
}

/**
 * Validates the comment length
 * @param {string} comment - The comment to validate
 * @throws {ValidationError} If comment is too short
 */
function validateComment(comment) {
  if (!comment || comment.trim().length < 10) {
    throw new ValidationError([{ field: 'comment', message: 'Comment must be at least 10 characters long' }]);
  }
}

/**
 * Checks if buyer has already reviewed the seller
 * @param {Object} seller - The seller object
 * @param {string} buyerId - The buyer ID
 * @returns {boolean} True if buyer has already reviewed
 */
function hasExistingReview(seller, buyerId) {
  return seller.reviews && seller.reviews.some(review => review.buyer.toString() === buyerId);
}

/**
 * Checks if buyer is a follower of the seller
 * @param {Object} buyer - The buyer object
 * @param {string} sellerId - The seller ID
 * @returns {boolean} True if buyer is a follower
 */
function isFollower(buyer, sellerId) {
  return buyer.followers && buyer.followers.some(follower => follower.sellerId.toString() === sellerId);
}

/**
 * Creates a new review object
 * @param {string} buyerId - The buyer ID
 * @param {Object} buyer - The buyer object
 * @param {number} rating - The rating value
 * @param {string} comment - The review comment
 * @param {boolean} hasPurchase - Whether buyer has made a purchase
 * @returns {Object} The review object
 */
function createReview(buyerId, buyer, rating, comment, hasPurchase) {
  const firstName = buyer.firstName || '';
  const lastName = buyer.lastName || '';
  const buyerName = `${firstName} ${lastName}`.trim() || 'Anonymous Buyer';
  
  return {
    buyer: buyerId,
    rating,
    comment,
    buyerName,
    buyerImage: buyer.profileImage?.url,
    createdAt: new Date(),
    isVerifiedPurchase: hasPurchase
  };
}

/**
 * Calculates the average rating from an array of ratings
 * @param {Array} ratings - Array of rating numbers
 * @returns {string} The average rating as a string
 */
function calculateAverageRating(ratings) {
  const totalRatings = ratings.length;
  if (totalRatings === 0) {
    return '0';
  }
  const sum = ratings.reduce((acc, rating) => acc + rating, 0);
  return (sum / totalRatings).toFixed(1);
}

/**
 * Calculates rating distribution for each rating level
 * @param {Array} ratings - Array of rating numbers
 * @returns {Object} Rating distribution object
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
 * Updates seller's rating statistics
 * @param {Object} seller - The seller object
 */
function updateSellerRatingStats(seller) {
  const ratings = seller.reviews.map(review => review.rating);
  const totalRatings = ratings.length;

  // Ensure stats object exists
  if (!seller.stats) {
    seller.stats = {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
  }

  seller.stats.averageRating = calculateAverageRating(ratings);
  seller.stats.totalReviews = totalRatings;
  seller.stats.ratingDistribution = calculateRatingDistribution(ratings);
}

/**
 * Validates that both seller and buyer exist
 * @param {Object} seller - The seller object
 * @param {Object} buyer - The buyer object
 * @throws {NotFoundException} If seller or buyer not found
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
 * Checks buyer's eligibility to review the seller
 * @param {Object} buyer - The buyer object
 * @param {string} sellerId - The seller ID
 * @param {boolean} hasPurchase - Whether buyer has made a purchase
 * @throws {ValidationError} If buyer is not eligible
 */
function validateReviewEligibility(buyer, sellerId, hasPurchase) {
  const isFollowerOfSeller = isFollower(buyer, sellerId);
  if (!hasPurchase && !isFollowerOfSeller) {
    throw new ValidationError([{ field: 'eligibility', message: 'You must be a follower of this seller or have made a purchase to write a review' }]);
  }
}

/**
 * Reviews a seller's store
 * @param {string} buyerId - The buyer ID
 * @param {string} sellerId - The seller ID
 * @param {Object} reviewData - The review data
 * @returns {Object} The created review
 */
async function reviewSeller(buyerId, sellerId, reviewData) {
  const { rating, comment } = reviewData;

  validateRating(rating);
  validateComment(comment);

  const [seller, buyer] = await Promise.all([
    buyerRepository.findSellerById(sellerId),
    buyerRepository.findById(buyerId)
  ]);

  validateSellerAndBuyer(seller, buyer);

  if (hasExistingReview(seller, buyerId)) {
    throw new ValidationError([{ field: 'review', message: 'You have already reviewed this seller' }]);
  }

  const hasPurchase = await buyerRepository.hasVerifiedPurchase(buyerId, sellerId);
  validateReviewEligibility(buyer, sellerId, hasPurchase);

  const review = createReview(buyerId, buyer, rating, comment, hasPurchase);
  seller.reviews.push(review);
  updateSellerRatingStats(seller);
  await buyerRepository.saveSeller(seller);

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