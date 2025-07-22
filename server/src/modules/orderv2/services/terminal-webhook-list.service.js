const terminalAPI = require('../../../config/terminalAPI');

exports.getTerminalWebhooks = async (queryParams) => {
  try {
    const { page = 1, perPage = 10 } = queryParams;
    
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
    
    // Get webhooks from Terminal API
    const response = await terminalAPI.get('/webhooks', {
      params: {
        page: parseInt(page),
        perPage: parseInt(perPage)
      }
    });
    
    console.log('Terminal webhooks retrieved successfully');
    
    return {
      status: 200,
      data: {
        status: true,
        message: 'Webhooks retrieved successfully',
        data: response.data.data
      }
    };
    
  } catch (error) {
    console.error('Error retrieving Terminal webhooks:', error);
    
    if (error.response) {
      // Terminal Africa API error
      return {
        status: error.response.status,
        data: {
          status: false,
          message: error.response.data.message || 'Failed to retrieve webhooks',
          error: error.response.data
        }
      };
    }
    
    return {
      status: 500,
      data: {
        status: false,
        message: 'Failed to retrieve webhooks',
        error: error.message
      }
    };
  }
}; 