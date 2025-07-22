const { handleWebhook } = require('../../../webhooks/terminalWebhook');

exports.handleTerminalWebhook = async (req, res) => {
  try {
    // Use the existing webhook handler
    await handleWebhook(req, res);
  } catch (error) {
    console.error('Error handling Terminal webhook:', error);
    throw error;
  }
}; 