const terminalService = require('../services/adminterminal.service');
const Product = require('../../../models/Product');
const Seller = require('../../../models/Seller');
const adminBuyerService = require('../services/adminBuyer.service');
const emailService = require('../../../utils/emailService');
const { toggleSellerVacationMode } = require('../services/adminVacation.service');
const ErrorLog = require('../../../models/ErrorLog');

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
};