const ErrorLog = require('../../../models/ErrorLog');
const emailService = require('../../../utils/emailService');
const os = require('os');

exports.logError = async (orderId, step, error) => {
  try {
    // Sanitize the error object to remove circular references
    const sanitizedError = {
      message: error.message,
      stack: error.stack,
   
      // For example, if it's an Axios error, you might want to include:
      config: error.config ? {
        url: error.config.url,
        method: error.config.method,
        headers: error.config.headers,
        data: error.config.data,
      } : undefined,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      } : undefined,
    };

    const errorLog = new ErrorLog({
      orderId,
      step,
      error: sanitizedError,
    });
    await errorLog.save();

    // Send email notification
    const subject = `Error in ${step} for order ${orderId}`;

    const stringifySafe = (value, max = 8000) => {
      try {
        const str = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
        return str.length > max ? str.slice(0, max) + `\n... [truncated ${str.length - max} chars]` : str;
      } catch (_) {
        return String(value);
      }
    };

    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      host: os.hostname(),
      pid: process.pid,
      platform: process.platform,
      nodeVersion: process.version,
      uptimeSeconds: Math.round(process.uptime()),
      memory: (() => {
        const m = process.memoryUsage();
        const toMB = (n) => Math.round(n / 1024 / 1024);
        return {
          rssMB: toMB(m.rss),
          heapUsedMB: toMB(m.heapUsed),
          heapTotalMB: toMB(m.heapTotal),
          externalMB: toMB(m.external || 0),
        };
      })(),
    };

    const maskedHeaders = (() => {
      const headers = sanitizedError.config?.headers || {};
      const result = {};
      for (const [key, val] of Object.entries(headers)) {
        const lower = key.toLowerCase();
        if (['authorization', 'x-api-key', 'proxy-authorization'].includes(lower)) {
          result[key] = typeof val === 'string' && val.length > 8 ? `${val.slice(0, 4)}***${val.slice(-2)}` : '***';
        } else {
          result[key] = val;
        }
      }
      return result;
    })();

    const axiosSection = sanitizedError.config || sanitizedError.response
      ? `\nAxios Request:\n- Method: ${sanitizedError.config?.method || 'n/a'}\n- URL: ${sanitizedError.config?.url || 'n/a'}\n- Headers: ${stringifySafe(maskedHeaders, 2000)}\n- Body: ${stringifySafe(sanitizedError.config?.data, 2000)}\n\nAxios Response:\n- Status: ${sanitizedError.response?.status ?? 'n/a'}\n- StatusText: ${sanitizedError.response?.statusText ?? 'n/a'}\n- Data: ${stringifySafe(sanitizedError.response?.data, 4000)}\n`
      : '';

    const causeSection = typeof (/** @type {any} */(Error).cause) !== 'undefined' && (/** @type {any} */(sanitizedError)).cause
      ? `\nCause:\n${stringifySafe((/** @type {any} */(sanitizedError)).cause, 2000)}\n`
      : '';

    const text = [
      `An error occurred in the ${step} step for order ${orderId}.`,
      '',
      'Context:',
      stringifySafe(diagnostics, 1500),
      '',
      'Error summary:',
      stringifySafe({ name: (/** @type {any} */(sanitizedError)).name, message: sanitizedError.message, code: (/** @type {any} */(sanitizedError)).code }, 500),
      '',
      'Stack trace:',
      stringifySafe(sanitizedError.stack, 6000),
      axiosSection,
      causeSection,
      'Raw error JSON:',
      stringifySafe(sanitizedError, 8000),
    ].join('\n');
    const recipients = [
      'support@auqli.com',
      'bolu@auqli.com',
      'todimu@auqli.com',
      'dan@auqli.com'
    ];
    for (const to of recipients) {
      await emailService.sendEmail(to, subject, text);
    }
  } catch (err) {
    console.error('Failed to log error or send email notification:', err);
  }
};