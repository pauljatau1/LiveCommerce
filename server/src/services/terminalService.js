const axios = require('axios');

class TerminalService {
  constructor() {
    this.api = axios.create({
      baseURL: process.env.TERMINAL_API_URL + '/v1',
      headers: {
        'Authorization': `Bearer ${process.env.TERMINAL_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    this.publicKey = process.env.TERMINAL_PUBLIC_KEY;
  }

  async calculateShipping(parcel, pickup, delivery) {
    try {
      const response = await this.api.post('/shipments/rates', {
        parcel_id: parcel.id,
        pickup_address: pickup,
        delivery_address: delivery
      });
      return response.data;
    } catch (error) {
      throw new Error(`Terminal API Error: ${error.message}`);
    }
  }

  async createParcel(productData) {
    try {
      const response = await this.api.post('/parcels', {
        name: productData.name,
        description: productData.description,
        weight: productData.shipping.weight,
        dimension: {
          length: productData.shipping.dimensions.length,
          width: productData.shipping.dimensions.width,
          height: productData.shipping.dimensions.height
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Terminal API Error: ${error.message}`);
    }
  }

  async createShipment(orderData) {
    try {
      const response = await this.api.post('/shipments', {
        pickup_address: orderData.pickup_address,
        delivery_address: orderData.delivery_address,
        parcel_id: orderData.parcel_id,
        carrier_id: orderData.carrier_id
      });
      return response.data;
    } catch (error) {
      throw new Error(`Terminal API Error: ${error.message}`);
    }
  }

  async getCarriers(countryCode) {
    try {
      const response = await this.api.get(`/carriers?country=${countryCode}`);
      return response.data;
    } catch (error) {
      throw new Error(`Terminal API Error: ${error.message}`);
    }
  }

  // Carrier Management
  async getCarrierDetails(carrierId) {
    try {
      const response = await this.api.get(`/carriers/${carrierId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Terminal API Error: ${error.message}`);
    }
  }

  async getCarrierRates(carrierId, parcelId, pickup, delivery) {
    try {
      const response = await this.api.post(`/carriers/${carrierId}/rates`, {
        parcel_id: parcelId,
        pickup_address: pickup,
        delivery_address: delivery
      });
      return response.data;
    } catch (error) {
      throw new Error(`Terminal API Error: ${error.message}`);
    }
  }

  // Tracking Management
  async getShipmentTracking(shipmentId) {
    try {
      const response = await this.api.get(`/shipments/${shipmentId}/tracking`);
      return response.data;
    } catch (error) {
      throw new Error(`Terminal API Error: ${error.message}`);
    }
  }

  // Insurance Management
  async insureShipment(shipmentId, value) {
    try {
      const response = await this.api.post(`/insurance`, {
        shipment_id: shipmentId,
        value: value
      });
      return response.data;
    } catch (error) {
      throw new Error(`Terminal API Error: ${error.message}`);
    }
  }

  // Claims Management
  async createClaim(shipmentId, reason, description) {
    try {
      const response = await this.api.post(`/claims`, {
        shipment_id: shipmentId,
        reason: reason,
        description: description
      });
      return response.data;
    } catch (error) {
      throw new Error(`Terminal API Error: ${error.message}`);
    }
  }

  // Webhook Management
  async createWebhook(url, events) {
    try {
      const response = await this.api.post('/webhooks', {
        url: url,
        events: events,
        active: true
      });
      return response.data;
    } catch (error) {
      throw new Error(`Terminal API Error: ${error.message}`);
    }
  }
}

module.exports = new TerminalService(); 