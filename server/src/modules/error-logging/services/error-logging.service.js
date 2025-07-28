const ErrorLog = require('../../../models/ErrorLog');
const emailService = require('../../../utils/emailService');

exports.logError = async (orderId, step, error) => {
  try {
    // Sanitize the error object to remove circular references
    const sanitizedError = {
      message: error.message,
      stack: error.stack,
      // Add other relevant properties from the error object
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
    const text = `An error occurred in the ${step} step for order ${orderId}.\n\nError details:\n${JSON.stringify(sanitizedError, null, 2)}`;
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