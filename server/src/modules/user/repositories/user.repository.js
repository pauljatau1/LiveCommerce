const User = require('../models/user.model');

/**
 * Retrieves all users that match the given filters.
 *
 * @param {Object} options
 * @param {Object} [options.filters={}] - MongoDB query filters
 * @returns {Promise<Array>} List of users excluding sensitive fields
 */
async function findAll({ filters = {} }) {
  return await User.find(filters).select('-__v -password'); // Exclude sensitive or unneeded fields
}

/**
 * Retrieves a paginated list of users that match the given filters.
 *
 * @param {Object} options
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=10] - Number of users per page
 * @param {Object} [options.filters={}] - MongoDB query filters
 * @returns {Promise<Array>} Paginated list of users excluding sensitive fields
 */
async function findAllPaginated({ page = 1, limit = 10, filters = {} }) {
  const skip = (page - 1) * limit;

  return await User.find(filters)
    .skip(skip)
    .limit(limit)
    .select('-__v -password'); // Exclude sensitive or unneeded fields
}

/**
 * Counts the number of users that match the given filters.
 *
 * @param {Object} [filters={}] - MongoDB query filters
 * @returns {Promise<number>} Count of matching users
 */
async function countUsers(filters = {}) {
  return await User.countDocuments(filters);
}

/**
 * Find a user by their unique ID.
 * Excludes sensitive fields such as password and version key from the result.
 *
 * @param {string} userId - The id of the user to retrieve.
 * @returns {Promise<Object|null>} - Returns the user object if found, otherwise null.
 */
async function findById(userId) {
  return await User.findById(userId).select('-password -__v');
}

/**
 * Creates and saves a new user in the database.
 * 
 * @param {Object} userData - User data to create.
 * @returns {Promise<Object>} The created user document.
 */
async function create(userData) {
  const user = new User(userData);
  return await user.save();
}

/**
 * Updates a user by ID in the database.
 *
 * @param {string} userId - The user ID
 * @param {Object} data - Fields to update
 * @returns {Promise<Object|null>} - Updated user document or null if not found
 */
async function updateById(userId, data) {
  return await User.findByIdAndUpdate(userId, data, {
    new: true,
    runValidators: true,
  });
}

/**
 * Deletes a user by ID.
 *
 * @param {string} userId - The ID of the user
 * @returns {Promise<Object|null>} - The deleted user object, or null if not found
 */
async function deleteById(userId) {
  return await User.findByIdAndDelete(userId);
}

module.exports = {
  findAll,
  findAllPaginated,
  countUsers,
  findById,
  create,
  updateById,
  deleteById
};