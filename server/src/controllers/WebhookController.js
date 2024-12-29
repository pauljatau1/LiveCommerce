const Webhook = require('../models/WebHook');
const crypto = require('crypto');

exports.createWebhook = async (req, res) => {
  try {
    console.log(req.body);
    const { name, url, events } = req.body;
    const userId = req.user.id;
    const userType = req.path.includes('/seller') ? 'Seller' : 'Buyer';

    // Validate required fields
    if (!name || !url || !events || !Array.isArray(events) || events.length === 0) {
      return res.status(400).json({
        message: 'Name, URL, and at least one event are required'
      });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      return res.status(400).json({
        message: 'Invalid URL format'
      });
    }

    // Generate a random secret for webhook verification
    const secret = crypto.randomBytes(32).toString('hex');

    const webhook = new Webhook({
      name,
      url,
      events,
      owner: {
        id: userId,
        type: userType
      },
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

exports.getWebhooks = async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.role; // Assuming role is set in auth middleware

    // Find all webhooks for the current user
    const webhooks = await Webhook.find({
      'owner.id': userId,
      'owner.type': userType
    }).select('-secret'); // Exclude secret from response

    res.json({
      message: 'Webhooks retrieved successfully',
      data: webhooks
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to retrieve webhooks',
      error: error.message
    });
  }
};

exports.updateWebhook = async (req, res) => {
  try {
    const { webhookId } = req.params;
    const userId = req.user.id;
    const userType = req.user.role;
    const { name, url, events, active } = req.body;

    // Find webhook and verify ownership
    const webhook = await Webhook.findOne({
      _id: webhookId,
      'owner.id': userId,
      'owner.type': userType
    });

    if (!webhook) {
      return res.status(404).json({
        message: 'Webhook not found or unauthorized'
      });
    }

    // Validate URL if provided
    if (url) {
      try {
        new URL(url);
      } catch (error) {
        return res.status(400).json({
          message: 'Invalid URL format'
        });
      }
    }

    // Update webhook
    if (name) webhook.name = name;
    if (url) webhook.url = url;
    if (events && Array.isArray(events) && events.length > 0) webhook.events = events;
    if (typeof active === 'boolean') webhook.active = active;

    webhook.updatedAt = new Date();
    await webhook.save();

    res.json({
      message: 'Webhook updated successfully',
      data: {
        webhookId: webhook._id,
        name: webhook.name,
        url: webhook.url,
        events: webhook.events,
        active: webhook.active,
        updatedAt: webhook.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to update webhook',
      error: error.message
    });
  }
};

exports.deleteWebhook = async (req, res) => {
  try {
    const { webhookId } = req.params;
    const userId = req.user.id;
    const userType = req.user.role;

    // Find and delete webhook
    const webhook = await Webhook.findOneAndDelete({
      _id: webhookId,
      'owner.id': userId,
      'owner.type': userType
    });

    if (!webhook) {
      return res.status(404).json({
        message: 'Webhook not found or unauthorized'
      });
    }

    res.json({
      message: 'Webhook deleted successfully',
      data: {
        webhookId: webhook._id
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to delete webhook',
      error: error.message
    });
  }
};

exports.getWebhookById = async (req, res) => {
  try {
    const { webhookId } = req.params;
    const userId = req.user.id;
    const userType = req.user.role;

    // Find webhook
    const webhook = await Webhook.findOne({
      _id: webhookId,
      'owner.id': userId,
      'owner.type': userType
    }).select('-secret'); // Exclude secret from response

    if (!webhook) {
      return res.status(404).json({
        message: 'Webhook not found or unauthorized'
      });
    }

    res.json({
      message: 'Webhook retrieved successfully',
      data: webhook
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to retrieve webhook',
      error: error.message
    });
  }
};

exports.toggleWebhook = async (req, res) => {
  try {
    const { webhookId } = req.params;
    const userId = req.user.id;
    const userType = req.user.role;

    // Find webhook
    const webhook = await Webhook.findOne({
      _id: webhookId,
      'owner.id': userId,
      'owner.type': userType
    });

    if (!webhook) {
      return res.status(404).json({
        message: 'Webhook not found or unauthorized'
      });
    }

    // Toggle active status
    webhook.active = !webhook.active;
    webhook.updatedAt = new Date();
    await webhook.save();

    res.json({
      message: `Webhook ${webhook.active ? 'enabled' : 'disabled'} successfully`,
      data: {
        webhookId: webhook._id,
        active: webhook.active,
        updatedAt: webhook.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to toggle webhook',
      error: error.message
    });
  }
};

// Add other webhook management methods...
