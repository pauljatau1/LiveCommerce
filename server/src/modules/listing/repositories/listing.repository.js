const Listing = require('../models/listing.model');

/**
 * Retrieves all listings that match the given filters.
 *
 * @param {Object} options
 * @param {Object} [options.filters={}] - MongoDB query filters
 * @returns {Promise<Array>} List of listings excluding sensitive fields
 */
async function findAll({ filters = {} }) {
  return await Listing.find(filters);
}

module.exports = {
  findAll
};