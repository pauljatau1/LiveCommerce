/**
 * Response Formatter Middleware
 *
 * Adds `res.success` and `res.error` helper methods to standardize API responses.
 *
 * Usage:
 *   - res.success(data, message, statusCode)
 *   - res.error(message, statusCode, errors)
 *
 * @param {Request} req - Express request object (unused, but included for middleware signature)
 * @param {Response} res - Express response object
 * @param {Function} next - Callback to pass control to the next middleware
 */
function responseFormatter(req, res, next) {
    res.success = function (data = {}, message = 'OK', status = 200) {
        if ((typeof data.pagination === 'object' && Object.keys(data.pagination).length === 0)) {
            data.pagination = null;
        }

        return res.status(status).json({
            success: true,
            message,
            data: data.data ?? data,
            pagination: data.pagination ?? null,
        });
    };

    res.error = function (message = 'Error', status = 500, errors = null) {
        return res.status(status).json({
            success: false,
            message,
            errors,
        });
    };

    next();
}

module.exports = responseFormatter;