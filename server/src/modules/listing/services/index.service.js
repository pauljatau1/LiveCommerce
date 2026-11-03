const queryParser = require('../../../utils/queryParser');

/**
 * Extracts filter parameters from the request query for user listing.
 * 
 * @param {Object} req - Express request object
 * @returns {Object} - Filters object to be passed to DB queries
 */
function getFilters(req) {
  return queryParser.getFilters(req);
}

module.exports = { getFilters };