/**
 * Post Repository
 *
 * This repository contains all database operations related to the Post model.
 * It provides methods for finding, updating, and managing post data.
 *
 * @module postRepository
 */

const Post = require('../../../models/Post');

/**
 * Get the count of posts by a buyer.
 * 
 * This function counts the total number of posts created by a specific buyer.
 * It's used for buyer profile statistics and activity tracking.
 *
 * @param {string} buyerId - The buyer's ID
 * @returns {Promise<number>} Number of posts created by the buyer
 */
async function getPostsCount(buyerId) {
  return Post.countDocuments({ 
    'author.userId': buyerId, 
    'author.userModel': 'Buyer' 
  });
}

/**
 * Count public posts for a buyer.
 * 
 * This function counts the number of public posts created by a buyer.
 * It's used for public profile statistics and visibility calculations.
 *
 * @param {string} buyerId - The buyer's ID
 * @returns {Promise<number>} Number of public posts
 */
async function countPublicPosts(buyerId) {
  return Post.countDocuments({
    'author.userId': buyerId,
    'author.userModel': 'Buyer',
    visibility: 'public'
  });
}

module.exports = {
  getPostsCount,
  countPublicPosts
};
