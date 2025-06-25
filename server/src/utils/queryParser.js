// src/utils/queryParser.js

/**
 * Extracts pagination options from the request query parameters.
 */
function getPaginationOptions(req) {
    const paginated = (req.query.page !== undefined && req.query.limit !== undefined);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    return {
        enabled: paginated,
        page,
        limit
    };
}

/**
 * Extracts common user filters from the request query parameters.
 * Extend this or make separate filter functions per module if needed.
 */
function getFilters(req) {
    const filters = {};

    if (req.query.status !== undefined) {
        filters.status = req.query.status;
    }

    if (req.query.isAdmin !== undefined) {
        filters.isAdmin = req.query.isAdmin === 'true';
    }

    return filters;
}

module.exports = { getPaginationOptions, getFilters };