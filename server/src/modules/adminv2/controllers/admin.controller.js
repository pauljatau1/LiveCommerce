const terminalService = require('../services/adminterminal.service');
const Product = require('../../../models/Product');
const Seller = require('../../../models/Seller');
const emailService = require('../../../utils/emailService');
const { toggleSellerVacationMode } = require('../services/adminVacation.service');

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
}; 