const queryParser = require('../../../utils/queryParser');

/**
 * Extracts pagination options from the request query parameters.
 * 
 * @param {Object} req - Express request object
 * @returns {Object} - Contains pagination config: enabled (boolean), page (number), limit (number)
 */
function getPaginationOptions(req) {
  return queryParser.getPaginationOptions(req);
}

/**
 * Extracts filter parameters from the request query for user listing.
 * 
 * @param {Object} req - Express request object
 * @returns {Object} - Filters object to be passed to DB queries
 */
function getFilters(req) {
  return queryParser.getFilters(req);
}

module.exports = { getPaginationOptions, getFilters };