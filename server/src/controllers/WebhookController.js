const Webhook = require('../models/Webhook');
const crypto = require('crypto');

exports.createWebhook = async (req, res) => {
  try {
    const { name, url, events } = req.body;
    const sellerId = req.user.id;

    // Generate a random secret for webhook verification
    const secret = crypto.randomBytes(32).toString('hex');

    const webhook = new Webhook({
      name,
      url,
      events,
      seller: sellerId,
      secret
    });

    await webhook.save();

    res.status(201).json({
      message: 'Webhook created successfully',
      data: {
        webhookId: webhook._id,
        secret // Send secret back only once
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to create webhook',
      error: error.message
    });
  }
};

// Add other webhook management methods...
