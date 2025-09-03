/**
 * Major Category Repository
 *
 * This repository contains all database operations related to the MajorCategory model.
 * It provides methods for finding and managing major category data.
 *
 * @module majorCategoryRepository
 */

const MajorCategory = require('../../../models/MajorCategory');

/**
 * Find active major categories by IDs.
 * 
 * This function retrieves major categories that are currently active.
 * It's used for category validation and selection.
 *
 * @param {Array} majorCategoryIds - Array of major category IDs
 * @returns {Promise<Array>} Array of active major categories
 */
async function findActiveMajorCategories(majorCategoryIds) {
  return MajorCategory.find({
    _id: { $in: majorCategoryIds },
    isActive: true
  });
}

/**
 * Find all active major categories.
 * 
 * This function retrieves all major categories that are currently active.
 * It's used for category listing and selection interfaces.
 *
 * @returns {Promise<Array>} Array of all active major categories
 */
async function findAllActiveMajorCategories() {
  return MajorCategory.find({ isActive: true });
}

module.exports = {
  findActiveMajorCategories,
  findAllActiveMajorCategories
};
