const Webhook = require('../models/WebHook');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Withdrawal = require('../models/Withdrawal');
const Seller = require('../models/Seller');
const Transaction = require('../models/Transaction');
const termiiEmailService = require('../services/termiiEmailService');

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

exports.handlePaystackWebhook = async (req, res) => {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  console.log('--- Paystack Webhook Received ---');

  // Paystack sends signature in x-paystack-signature header
  const signature = req.headers['x-paystack-signature'];
  console.log('Paystack Signature Header:', signature);

  // The signature is over the exact bytes Paystack sent. The global JSON parser
  // runs first and keeps them on req.rawBody; fall back to a raw Buffer body.
  const rawBody = Buffer.isBuffer(req.body) ? req.body : req.rawBody;
  if (!secret || !rawBody || !signature) {
    return res.status(400).json({ message: 'Invalid signature' });
  }
  let event;

  try {
    // 1. Verify Signature using the RAW body
    const hash = crypto
      .createHmac('sha512', secret)
      .update(rawBody)
      .digest('hex');

    if (hash !== signature) {
      console.warn('⚠️ Paystack Webhook Signature Mismatch!');
      console.log('Calculated Hash:', hash);
      return res.status(400).json({ message: 'Invalid signature' });
    }

    // 2. Parse the body to get the event data
    event = JSON.parse(rawBody.toString());
    console.log('Event Type Identified:', event.event);
    console.log('Reference:', event.data?.reference);
  } catch (err) {
    console.error('❌ Error parsing Paystack webhook body:', err.message);
    return res.status(400).json({ message: 'Invalid payload' });
  }

  try {
    switch (event.event) {
      case 'charge.success':
        // Credit wallet top-ups even if the buyer closed the page before the app
        // confirmed the payment. The service re-verifies with Paystack and
        // credits each payment at most once, so retries and the app's own
        // confirmation are safe.
        if (event.data?.metadata?.purpose === require('../modules/buyer/services/verifyWalletTopUp.service').WALLET_TOPUP_PURPOSE) {
          await require('../modules/buyer/services/verifyWalletTopUp.service').verifyWalletTopUp(event.data.reference);
        }
        break;
      case 'transfer.success':
        console.log('Handling transfer.success...');
        await handleTransferSuccess(event.data);
        break;
      case 'transfer.failed':
        console.log('Handling transfer.failed...');
        await handleTransferFailed(event.data);
        break;
      case 'transfer.reversed':
        console.log('Handling transfer.reversed...');
        await handleTransferReversed(event.data);
        break;
      default:
        console.log(`Unhandled Paystack event: ${event.event}`);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
};

async function handleTransferSuccess(data) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    console.log(`Processing transfer.success for reference: ${data.reference}`);

    const withdrawal = await Withdrawal.findOne({
      'paymentInfo.transferReference': data.reference
    }).populate('seller').session(session);

    if (!withdrawal) {
      await session.abortTransaction();
      session.endSession();
      console.warn(`❌ No withdrawal record found in DB matching transfer reference: ${data.reference}`);
      return;
    }

    console.log(`Found withdrawal: ${withdrawal.reference} (_id: ${withdrawal._id}) currently in status: ${withdrawal.status}`);

    // Mark as completed
    withdrawal.status = 'completed';
    withdrawal.processedDate = new Date();
    withdrawal.paymentInfo.completedAt = new Date();
    withdrawal.paymentInfo.paystackStatus = 'success';
    withdrawal.notes.push({
      content: `Transfer completed successfully via Paystack webhook. Reference: ${data.reference}`,
      addedBy: 'system'
    });

    await withdrawal.save({ session });

    // Deduct from seller wallet balance
    const seller = await Seller.findById(withdrawal.seller._id).session(session);
    if (seller) {
      seller.walletBalance = Math.max(0, seller.walletBalance - withdrawal.amount);
      await seller.save({ session });
      console.log(`Deducted ₦${withdrawal.amount} from seller ${seller._id} wallet. New balance: ₦${seller.walletBalance}`);
    }

    // Create transaction record
    await Transaction.create([{
      seller: withdrawal.seller._id,
      type: 'withdrawal',
      amount: withdrawal.amount,
      status: 'completed',
      bankDetails: withdrawal.bankDetails,
      description: `Withdrawal to bank account ${withdrawal.bankDetails.accountNumber}`,
      reference: data.reference
    }], { session });

    await session.commitTransaction();
    console.log(`Transfer.success processed for withdrawal ${withdrawal.reference}: ₦${withdrawal.amount}`);

    // Send success email (non-blocking, outside transaction)
    try {
      await termiiEmailService.sendRawHTMLEmail({
        email: withdrawal.seller.email,
        subject: 'Withdrawal Completed Successfully - Auqli',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Withdrawal Completed</h2>
            <p>Dear ${withdrawal.seller.firstName},</p>
            <p>Your withdrawal request (Ref: ${withdrawal.reference}) has been completed successfully.</p>
            <p>Amount: ₦${withdrawal.amount.toLocaleString()}</p>
            <p>The funds have been transferred to your bank account.</p>
            <p>Best regards,<br>The Auqli Team</p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Error sending withdrawal success email:', emailError.message);
    }
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    console.error('Error processing transfer.success webhook:', error);
    throw error;
  } finally {
    session.endSession();
  }
}

async function handleTransferFailed(data) {
  const withdrawal = await Withdrawal.findOne({
    'paymentInfo.transferReference': data.reference
  }).populate('seller');

  if (!withdrawal) return;

  withdrawal.status = 'failed';
  withdrawal.paymentInfo.failureReason = data.reason;
  withdrawal.notes.push({
    content: `Transfer failed: ${data.reason}`,
    addedBy: 'system'
  });

  await withdrawal.save();

  // Send failure notification email
  try {
    await termiiEmailService.sendRawHTMLEmail({
      email: withdrawal.seller.email,
      subject: 'Withdrawal Transfer Failed - Auqli',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Withdrawal Transfer Failed</h2>
          <p>Dear ${withdrawal.seller.firstName},</p>
          <p>We encountered an issue while processing your withdrawal (Ref: ${withdrawal.reference}).</p>
          <p>Our team has been notified and will investigate the issue.</p>
          <p>We will process your withdrawal as soon as possible.</p>
          <p>Best regards,<br>The Auqli Team</p>
        </div>
      `
    });
  } catch (emailError) {
    console.error('Error sending withdrawal failure email:', emailError.message);
  }
}

async function handleTransferReversed(data) {
  const withdrawal = await Withdrawal.findOne({
    'paymentInfo.transferReference': data.reference
  });

  if (!withdrawal) return;

  withdrawal.status = 'reversed';
  withdrawal.notes.push({
    content: `Transfer reversed: ${data.reason}`,
    addedBy: 'system'
  });

  await withdrawal.save();
}

// Add other webhook management methods...
