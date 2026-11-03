const userRepository = require('../repositories/user.repository');

/**
 * List all users without pagination.
 * Useful for cases like exporting all users or simple dropdowns.
 *
 * @param {Object} params - Parameters for listing users
 * @param {Object} params.filters - MongoDB query filters
 * @returns {Object} - An object containing the user data and empty pagination info
 */
async function listUsers({ filters }) {
  const users = await userRepository.findAll({ filters });
  return {
    data: users,
    pagination: {} // No pagination info returned for full list
  };
}

/**
 * List users with pagination.
 * Returns user data along with pagination metadata.
 *
 * @param {Object} params - Parameters for pagination and filtering
 * @param {number} params.page - Page number
 * @param {number} params.limit - Number of users per page
 * @param {Object} params.filters - MongoDB query filters
 * @returns {Object} - Paginated user list and pagination metadata
 */
async function listPaginatedUsers({ page, limit, filters }) {
  const users = await userRepository.findAllPaginated({ page, limit, filters });
  const total = await userRepository.countUsers(filters);

  return {
    data: users,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

/**
 * Retrieves a single user by their unique identifier.
 *
 * @param {string} userId - The unique identifier of the user.
 * @returns {Promise<Object|null>} - Returns a Promise that resolves to the user object if found,
 *                                   or null if no user exists with the provided ID.
 * @throws {Error} - Throws an error if the database query fails or if the ID format is invalid.
 */
async function showUser(userId) {
  return await userRepository.findById(userId);
}

// Export service methods to be used in controllers or other services
module.exports = {
  listUsers,
  listPaginatedUsers,
  showUser
};