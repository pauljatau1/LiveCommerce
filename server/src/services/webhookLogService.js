const WebhookRequestLog = require('../models/WebhookRequestLog');

/**
 * Log a webhook request with its response
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} responseData - Response data to log
 * @param {number} startTime - Request start time for calculating response time
 * @param {Object} error - Error object if request failed
 */
exports.logWebhookRequest = async (req, res, responseData = null, startTime = null, error = null) => {
  try {
    const responseTime = startTime ? Date.now() - startTime : null;
    
    // Sanitize sensitive headers
    const sanitizedHeaders = { ...req.headers };
    if (sanitizedHeaders.authorization) {
      sanitizedHeaders.authorization = '[REDACTED]';
    }
    if (sanitizedHeaders['x-terminal-signature']) {
      sanitizedHeaders['x-terminal-signature'] = '[REDACTED]';
    }

    const logEntry = new WebhookRequestLog({
      endpoint: req.originalUrl || req.url,
      method: req.method,
      headers: sanitizedHeaders,
      body: req.body,
      query: req.query,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('User-Agent'),
      response: {
        statusCode: res.statusCode,
        headers: res.getHeaders ? res.getHeaders() : {},
        body: responseData,
        responseTime: responseTime
      },
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : null,
      success: !error && res.statusCode < 400
    });

    await logEntry.save();
    console.log(`Webhook request logged: ${req.method} ${req.originalUrl || req.url} - ${res.statusCode}`);
  } catch (logError) {
    console.error('Failed to log webhook request:', logError);
  }
};

/**
 * Get webhook request logs with pagination and filtering
 * @param {Object} options - Query options
 * @param {string} options.endpoint - Filter by endpoint
 * @param {boolean} options.success - Filter by success status
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Items per page (default: 20)
 * @param {Date} options.startDate - Filter from date
 * @param {Date} options.endDate - Filter to date
 */
exports.getWebhookLogs = async (options = {}) => {
  try {
    const {
      endpoint,
      success,
      page = 1,
      limit = 20,
      startDate,
      endDate
    } = options;

    const query = {};
    
    if (endpoint) {
      query.endpoint = { $regex: endpoint, $options: 'i' };
    }
    
    if (typeof success === 'boolean') {
      query.success = success;
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = startDate;
      if (endDate) query.createdAt.$lte = endDate;
    }

    const skip = (page - 1) * limit;
    
    const [logs, totalCount] = await Promise.all([
      WebhookRequestLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      WebhookRequestLog.countDocuments(query)
    ]);

    return {
      logs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      }
    };
  } catch (error) {
    console.error('Failed to get webhook logs:', error);
    throw error;
  }
};

/**
 * Get webhook request statistics
 * @param {Object} options - Query options
 * @param {string} options.endpoint - Filter by endpoint
 * @param {Date} options.startDate - Filter from date
 * @param {Date} options.endDate - Filter to date
 */
exports.getWebhookStats = async (options = {}) => {
  try {
    const { endpoint, startDate, endDate } = options;
    
    const matchQuery = {};
    
    if (endpoint) {
      matchQuery.endpoint = { $regex: endpoint, $options: 'i' };
    }
    
    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = startDate;
      if (endDate) matchQuery.createdAt.$lte = endDate;
    }

    const stats = await WebhookRequestLog.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          successfulRequests: {
            $sum: { $cond: [{ $eq: ['$success', true] }, 1, 0] }
          },
          failedRequests: {
            $sum: { $cond: [{ $eq: ['$success', false] }, 1, 0] }
          },
          averageResponseTime: { $avg: '$response.responseTime' },
          statusCodes: {
            $push: '$response.statusCode'
          }
        }
      }
    ]);

    if (!stats.length) {
      return {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        successRate: 0,
        averageResponseTime: 0,
        statusCodeDistribution: {}
      };
    }

    const result = stats[0];
    const statusCodeDistribution = {};
    
    result.statusCodes.forEach(code => {
      statusCodeDistribution[code] = (statusCodeDistribution[code] || 0) + 1;
    });

    return {
      totalRequests: result.totalRequests,
      successfulRequests: result.successfulRequests,
      failedRequests: result.failedRequests,
      successRate: result.totalRequests > 0 ? (result.successfulRequests / result.totalRequests * 100).toFixed(2) : 0,
      averageResponseTime: result.averageResponseTime ? Math.round(result.averageResponseTime) : 0,
      statusCodeDistribution
    };
  } catch (error) {
    console.error('Failed to get webhook stats:', error);
    throw error;
  }
}; 