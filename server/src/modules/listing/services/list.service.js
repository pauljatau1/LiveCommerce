const listingRepository = require('../repositories/listing.repository');

/**
 * List all listings without pagination.
 * Useful for cases like exporting all listings or simple dropdowns.
 *
 * @param {Object} params - Parameters for listing listings
 * @param {Object} params.filters - MongoDB query filters
 * @returns {Object} - An object containing the user data and empty pagination info
 */
async function listListings({ filters }) {
  const users = await listingRepository.findAll({ filters });
  return {
    data: users,
    pagination: {} // No pagination info returned for full list
  };
}

// Export service methods to be used in controllers or other services
module.exports = {
  listListings,
};