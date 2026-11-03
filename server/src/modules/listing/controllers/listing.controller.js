const listService = require('../services/list.service');
const indexService = require('../services/index.service');

/**
 * Controller: List Listings
 *
 * Handles requests to list listings, either paginated or unpaginated.
 * It uses `indexService` to extract pagination options and filters from the request,
 * and `listService` to fetch the corresponding listing records from the database.
 *
 * If pagination is enabled (`pagination.enabled`), it returns a paginated response.
 * Otherwise, it returns the full list of listings matching the filters.
 *
 * Success response:
 *   {
 *     success: true,
 *     data: [...],
 *     total: <number>, // if paginated
 *     page: <number>,  // if paginated
 *     limit: <number>  // if paginated
 *   }
 *
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next middleware function for error handling
 */
const index = async (req, res, next) => {
  try {
    const filters = indexService.getFilters(req);
    const listings = await listService.listListings(filters);

    return res.success(listings, 'Listing list retrieved successfully', 200);
  } catch (err) {
    next(err); // Use centralized error handler
  }
};

module.exports = {
  index
};