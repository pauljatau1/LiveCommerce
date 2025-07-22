const terminalAPI = require('../../../config/terminalAPI');

const VALID_EVENTS = [
  'packaging.created',
  'packaging.updated',
  'shipment.cancelled',
  'shipment.created',
  'shipment.in-transit',
  'shipment.updated',
  'shipment.delivered'
];

exports.createTerminalWebhook = async (webhookData) => {
  try {
    const { name, active, events, live, url } = webhookData;
    
    // Validate required fields
    const validation = validateWebhookData(webhookData);
    if (!validation.isValid) {
      return { status: 400, data: { status: false, message: validation.message } };
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
    
    // Create webhook via Terminal API
    const response = await terminalAPI.post('/webhooks', {
      name,
      active,
      events,
      live,
      url
    });
    
    console.log('Terminal webhook created successfully:', response.data);
    
    return {
      status: 201,
      data: {
        status: true,
        message: 'Webhook created successfully',
        data: response.data.data
      }
    };
    
  } catch (error) {
    console.error('Error creating Terminal webhook:', error);
    
    if (error.response) {
      // Terminal Africa API error
      return {
        status: error.response.status,
        data: {
          status: false,
          message: error.response.data.message || 'Failed to create webhook',
          error: error.response.data
        }
      };
    }
    
    return {
      status: 500,
      data: {
        status: false,
        message: 'Failed to create webhook',
        error: error.message
      }
    };
  }
};

function validateWebhookData(webhookData) {
  const { name, active, events, live, url } = webhookData;
  
  // Validate required fields
  if (!name || typeof active !== 'boolean' || !events || !Array.isArray(events) || typeof live !== 'boolean' || !url) {
    return {
      isValid: false,
      message: 'Missing required fields: name, active, events, live, and url are required'
    };
  }
  
  // Validate events
  const invalidEvents = events.filter(event => !VALID_EVENTS.includes(event));
  if (invalidEvents.length > 0) {
    return {
      isValid: false,
      message: `Invalid event types: ${invalidEvents.join(', ')}. Valid events: ${VALID_EVENTS.join(', ')}`
    };
  }
  
  // Validate URL format
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return {
      isValid: false,
      message: 'URL must start with http:// or https://'
    };
  }
  
  // If live is true, URL must be HTTPS
  if (live && !url.startsWith('https://')) {
    return {
      isValid: false,
      message: 'Live webhooks must use HTTPS URLs'
    };
  }
  
  return { isValid: true };
} 