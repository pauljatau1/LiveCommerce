const terminalService = require('../services/adminterminal.service');
const Product = require('../../../models/Product');
const Seller = require('../../../models/Seller');
const adminBuyerService = require('../services/adminBuyer.service');
const emailService = require('../../../utils/emailService');
const { toggleSellerVacationMode } = require('../services/adminVacation.service');
const ErrorLog = require('../../../models/ErrorLog');
const { getNonLagosSellerNotificationEmail } = require('../helpers/email.helper');

const getShipments = async (req, res, next) => {
  try {
    const shipmentsData = await terminalService.getShipments(req.query);
    res.status(200).json(shipmentsData);
  } catch (error) {
    next(error);
  }
};

const getShipmentById = async (req, res, next) => {
  try {
    const { shipmentId } = req.params;
    const shipmentData = await terminalService.getShipmentById(shipmentId);
    res.status(200).json(shipmentData);
  } catch (error) {
    next(error);
  }
};

const updateShipment = async (req, res, next) => {
  try {
    const { shipmentId } = req.params;
    const updateData = req.body;
    const updatedShipment = await terminalService.updateShipment(shipmentId, updateData);
    res.status(200).json(updatedShipment);
  } catch (error) {
    next(error);
  }
};

const cancelShipment = async (req, res, next) => {
  try {
    const { shipment_id } = req.body;
    const result = await terminalService.cancelShipment(shipment_id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const deleteShipment = async (req, res, next) => {
  try {
    const { shipment_id } = req.body;
    const result = await terminalService.deleteShipment(shipment_id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const trackShipment = async (req, res, next) => {
  try {
    const { shipmentId } = req.params;
    const trackingData = await terminalService.trackShipment(shipmentId);
    res.status(200).json(trackingData);
  } catch (error) {
    next(error);
  }
};

const createWebhook = async (req, res, next) => {
  try {
    const webhookData = req.body;
    const newWebhook = await terminalService.createWebhook(webhookData);
    res.status(201).json(newWebhook);
  } catch (error) {
    next(error);
  }
};

const getWebhooks = async (req, res, next) => {
  try {
    const webhooksData = await terminalService.getWebhooks(req.query);
    res.status(200).json(webhooksData);
  } catch (error) {
    next(error);
  }
};

const getWebhookById = async (req, res, next) => {
  try {
    const { webhookId } = req.params;
    const webhookData = await terminalService.getWebhookById(webhookId);
    res.status(200).json(webhookData);
  } catch (error) {
    next(error);
  }
};

const deleteWebhook = async (req, res, next) => {
  try {
    const { webhookId } = req.params;
    const result = await terminalService.deleteWebhook(webhookId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const enableWebhook = async (req, res, next) => {
  try {
    const { webhookId } = req.params;
    const result = await terminalService.enableWebhook(webhookId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const disableWebhook = async (req, res, next) => {
  try {
    const { webhookId } = req.params;
    const result = await terminalService.disableWebhook(webhookId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Set all products of a seller to draft or active
 * PATCH /admin/sellers/:sellerId/products/draft-status
 * Body: { isDraft: boolean }
 */
const setSellerProductsDraftStatus = async (req, res, next) => {
  try {
    const { sellerId } = req.params;
    const { isDraft } = req.body;
    if (typeof isDraft !== 'boolean') {
      return res.status(400).json({ status: false, message: 'isDraft must be a boolean' });
    }
    const update = { status: isDraft ? 'draft' : 'active' };
    const result = await Product.updateMany({ seller: sellerId }, update);
    res.status(200).json({ status: true, message: `All products set to ${update.status}`, modifiedCount: result.modifiedCount });
  } catch (error) {
    next(error);
  }
};

/**
 * Set or unset a seller's vacation mode
 * PATCH /admin/sellers/:sellerId/vacation-mode
 * Body: { isOn: boolean }
 */
const setSellerVacationMode = async (req, res, next) => {
  try {
    const { sellerId } = req.params;
    const { isOn } = req.body;
    if (typeof isOn !== 'boolean') {
      return res.status(400).json({ status: false, message: 'isOn must be a boolean' });
    }
    let result;
    try {
      result = await toggleSellerVacationMode(sellerId, isOn);
    } catch (err) {
      if (err.message === 'Seller not found') {
        return res.status(404).json({ status: false, message: 'Seller not found' });
      }
      throw err;
    }
    res.status(200).json({ status: true, message: `Seller vacation mode set to ${isOn} and all products set to ${result.productStatus}`, seller: result.seller });
  } catch (error) {
    next(error);
  }
};

/**
 * Manually update a product's sold count
 * PATCH /admin/products/:productId/sold-count
 * Body: { soldCount: number }
 */
const updateProductSoldCount = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { soldCount } = req.body;

    // Validate input
    if (typeof soldCount !== 'number' || soldCount < 0) {
      return res.status(400).json({ 
        status: false, 
        message: 'soldCount must be a non-negative number' 
      });
    }

    // Find the product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ 
        status: false, 
        message: 'Product not found' 
      });
    }

    // Get the old sold count for logging
    const oldSoldCount = product.stats.soldCount;

    // Update the sold count
    product.stats.soldCount = soldCount;
    await product.save();

    // Log the change
   

    res.status(200).json({ 
      status: true, 
      message: 'Product sold count updated successfully',
      product: {
        _id: product._id,
        name: product.name,
        oldSoldCount,
        newSoldCount: product.stats.soldCount
      }
    });
  } catch (error) {
    next(error);
  }
};

const getErrors = async (req, res) => {
  try {
    const errors = await ErrorLog.find().sort({ createdAt: -1 });
    res.status(200).json({ errors });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch error logs', error: error.message });
  }
};

/**
 * Soft delete a buyer account and anonymize PII so the email/username can be reused.
 * DELETE /admin/buyers/:buyerId
 */
const deleteBuyerAccount = async (req, res, next) => {
  try {
    const { buyerId } = req.params;
    const hard = String(req.query.hard || '').toLowerCase() === 'true';
    const result = await adminBuyerService.deleteBuyerAccount(buyerId, { hard });
    return res.status(200).json(result);
  } catch (error) {
    // Translate service errors with status to HTTP response codes
    if (error && error.status) {
      return res.status(error.status).json({ status: false, message: error.message });
    }
    next(error);
  }
};

/**
 * Bulk disable sellers that are not in Lagos state
 * POST /admin/sellers/disable-non-lagos
 * This operation disables all sellers whose sellerAddress.state is not "Lagos" (case-insensitive)
 */
const disableNonLagosSellers = async (req, res, next) => {
  try {
    // Build a filter that matches sellers who have addresses but are NOT in Lagos
    // We should only disable sellers who have filled addresses but the state is not Lagos
    // We should NOT disable sellers who haven't filled any addresses at all
    const nonLagosFilter = {
      isDisabled: { $ne: true },
      $and: [
        // Only target sellers who have at least one address field filled
        {
          $or: [
            { 'sellerAddress.state': { $exists: true, $ne: null, $ne: '' } },
            { 'businessAddress.state': { $exists: true, $ne: null, $ne: '' } }
          ]
        },
        // But exclude those who have Lagos in either address field
        {
          $nor: [
            { 'sellerAddress.state': /^lagos$/i },
            { 'businessAddress.state': /^lagos$/i }
          ]
        }
      ]
    };

    // First, get the sellers that will be affected for email notifications
    const sellersToDisable = await Seller.find(nonLagosFilter).select('email firstName lastName businessName businessEmail');

    const update = { $set: { isDisabled: true } };
    const result = await Seller.updateMany(nonLagosFilter, update);

    // Send notification emails asynchronously (non-blocking)
    // Don't wait for emails to complete - they run in the background
    const sendEmailsAsync = async () => {
      const emailPromises = sellersToDisable.map(async (seller) => {
        try {
          // Get email content from helper
          const emailContent = getNonLagosSellerNotificationEmail(seller);
          
          // Send to primary email
          await emailService.sendEmail(
            seller.email, 
            emailContent.subject, 
            emailContent.text, 
            emailContent.html
          );
          
          // Also send to business email if it exists and is different
          if (seller.businessEmail && seller.businessEmail !== seller.email) {
            await emailService.sendEmail(
              seller.businessEmail, 
              emailContent.subject, 
              emailContent.text, 
              emailContent.html
            );
          }
          
          console.log(`✅ Notification email sent to ${seller.email}`);
        } catch (emailError) {
          console.error(`❌ Failed to send notification email to ${seller.email}:`, emailError);
          // Continue with other emails even if one fails
        }
      });

      // Run all email sending in parallel without blocking
      try {
        await Promise.allSettled(emailPromises);
        console.log(`📧 Email sending completed for ${sellersToDisable.length} sellers`);
      } catch (error) {
        console.error('📧 Email sending process failed:', error);
      }
    };

    // Start email sending in background (fire and forget)
    sendEmailsAsync().catch(error => {
      console.error('📧 Background email sending failed:', error);
    });

    // Return response immediately without waiting for emails
    return res.status(200).json({
      status: true,
      message: 'Sellers outside Lagos have been disabled. Notification emails are being sent in the background.',
      matchedCount: result.matchedCount ?? result.nMatched ?? 0,
      modifiedCount: result.modifiedCount ?? result.nModified ?? 0,
      emailsQueued: sellersToDisable.length
    });
  } catch (error) {
    next(error);
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
  setSellerProductsDraftStatus,
  setSellerVacationMode,
  updateProductSoldCount,
  getErrors,
  deleteBuyerAccount,
  disableNonLagosSellers,
};