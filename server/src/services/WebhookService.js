const axios = require('axios');
const crypto = require('crypto');
const Webhook = require('../models/WebHook')

class WebhookService {
  static async sendWebhookEvent(event, data, { sellerId, buyerId }) {
    try {
      // Find all active webhooks for both seller and buyer that are subscribed to this event
      const webhooks = await Webhook.find({
        $or: [
          { 'owner.id': sellerId, 'owner.type': 'Seller' },
          { 'owner.id': buyerId, 'owner.type': 'Buyer' }
        ],
        active: true,
        events: event
      });

      // Customize payload based on recipient type
      const promises = webhooks.map(webhook => {
        let payload = this.customizePayload(data, webhook.owner.type);
        
        // Generate signature for security
        const signature = crypto
          .createHmac('sha256', webhook.secret)
          .update(JSON.stringify(payload))
          .digest('hex');

        return axios.post(webhook.url, payload, {
          headers: {
            'Content-Type': 'application/json',
            'X-Terminal-Webhook-Signature': signature,
            'X-Terminal-Event': event,
            'X-Terminal-Recipient-Type': webhook.owner.type
          },
          timeout: 5000
        });
      });

      await Promise.allSettled(promises);
    } catch (error) {
      console.error('Webhook sending error:', error);
    }
  }

  static customizePayload(data, recipientType) {
    // Customize the payload based on recipient type
    const basePayload = {
      ...data,
      timestamp: new Date().toISOString()
    };

    if (recipientType === 'Buyer') {
      // Remove sensitive seller information for buyer notifications
      const { sellerPrivateData, internalNotes, ...buyerPayload } = basePayload;
      return buyerPayload;
    }

    return basePayload;
  }
}

module.exports = WebhookService;
