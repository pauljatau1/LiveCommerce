/**
 * Category Repository
 *
 * This repository contains all database operations related to the Category model.
 * It provides methods for finding and managing category data.
 *
 * @module categoryRepository
 */

const Category = require('../../../models/Category');

/**
 * Find categories by IDs.
 * 
 * This function retrieves categories based on their IDs.
 * It's used for category validation and data retrieval.
 *
 * @param {Array} categoryIds - Array of category IDs
 * @returns {Promise<Array>} Array of categories
 */
async function findCategoriesByIds(categoryIds) {
  return Category.find({ _id: { $in: categoryIds } });
}

module.exports = {
  findCategoriesByIds
};
