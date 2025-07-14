const terminalAPI = require('../../../config/terminalAPI');

exports.deleteTerminalWebhook = async (webhookId) => {
  try {
    // Validate webhook ID
    if (!webhookId) {
      return {
        status: 400,
        data: {
          status: false,
          message: 'Webhook ID is required'
        }
      };
    }
    
    // Check if Terminal API is configured
    if (!process.env.TERMINAL_SECRET_KEY) {
      return {
        status: 500,
        data: {
          status: false,
          message: 'Terminal Africa API key not configured'
        }
      };
    }
    
    // Delete webhook via Terminal API
    const response = await terminalAPI.delete(`/webhooks/${webhookId}`);
    
    console.log('Terminal webhook deleted successfully:', webhookId);
    
    return {
      status: 200,
      data: {
        status: true,
        message: 'Webhook deleted successfully'
      }
    };
    
  } catch (error) {
    console.error('Error deleting Terminal webhook:', error);
    
    if (error.response) {
      // Terminal Africa API error
      return {
        status: error.response.status,
        data: {
          status: false,
          message: error.response.data.message || 'Failed to delete webhook',
          error: error.response.data
        }
      };
    }
    
    return {
      status: 500,
      data: {
        status: false,
        message: 'Failed to delete webhook',
        error: error.message
      }
    };
  }
}; 