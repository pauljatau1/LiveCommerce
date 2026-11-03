const terminalAPI = require('../../../config/terminalAPI');

/**
 * Get shipments from Terminal Africa
 * @param {object} queryParams - Query parameters for filtering shipments
 * @returns {Promise<object>}
 */
const getShipments = async (queryParams) => {
  try {
    const response = await terminalAPI.v2.get('/shipments', {
      params: queryParams,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get a single shipment by ID from Terminal Africa
 * @param {string} shipmentId - The ID of the shipment to retrieve
 * @returns {Promise<object>}
 */
const getShipmentById = async (shipmentId) => {
  try {
    const response = await terminalAPI.get(`/shipments/${shipmentId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Update a shipment by ID in Terminal Africa
 * @param {string} shipmentId - The ID of the shipment to update
 * @param {object} updateData - The data to update the shipment with
 * @returns {Promise<object>}
 */
const updateShipment = async (shipmentId, updateData) => {
  try {
    const response = await terminalAPI.put(`/shipments/${shipmentId}`, updateData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Cancel a shipment in Terminal Africa
 * @param {string} shipmentId - The ID of the shipment to cancel
 * @returns {Promise<object>}
 */
const cancelShipment = async (shipmentId) => {
  try {
    const response = await terminalAPI.post('/shipments/cancel', { shipment_id: shipmentId });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete a shipment in Terminal Africa
 * @param {string} shipmentId - The ID of the shipment to delete
 * @returns {Promise<object>}
 */
const deleteShipment = async (shipmentId) => {
  try {
    const response = await terminalAPI.delete('/shipments', {
      data: { shipment_id: shipmentId },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Track a shipment in Terminal Africa
 * @param {string} shipmentId - The ID of the shipment to track
 * @returns {Promise<object>}
 */
const trackShipment = async (shipmentId) => {
  try {
    const response = await terminalAPI.get(`/shipments/track/${shipmentId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const createWebhook = async (webhookData) => {
    try {
        const response = await terminalAPI.post('/webhooks', webhookData);
        return response.data;
    } catch (error) {
        throw error;
    }
};

const getWebhooks = async (queryParams) => {
    try {
        const response = await terminalAPI.get('/webhooks', {
            params: queryParams,
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

const getWebhookById = async (webhookId) => {
    try {
        const response = await terminalAPI.get(`/webhooks/${webhookId}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

const deleteWebhook = async (webhookId) => {
    try {
        const response = await terminalAPI.delete(`/webhooks/${webhookId}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

const enableWebhook = async (webhookId) => {
    try {
        const response = await terminalAPI.post(`/webhooks/enable/${webhookId}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

const disableWebhook = async (webhookId) => {
    try {
        const response = await terminalAPI.post(`/webhooks/disable/${webhookId}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

module.exports = {
  getShipments,
  getShipmentById,
  updateShipment,
  cancelShipment,
  deleteShipment,
  trackShipment,
  createWebhook,
  getWebhooks,
  getWebhookById,
  deleteWebhook,
  enableWebhook,
  disableWebhook,
}; 