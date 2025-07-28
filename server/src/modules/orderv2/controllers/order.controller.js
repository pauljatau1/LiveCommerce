const orderService = require('../services/create.service');
const ratesService = require('../services/rates.service');
const carrierService = require('../services/carrier.service');
const shipmentService = require('../services/shipment.service');
const paymentService = require('../services/payment.service');
const markAsPaidService = require('../services/mark-as-paid.service');
const verifyPaymentService = require('../services/verify-payment-reference.service');
const paystackWebhookService = require('../services/paystack-webhook.service');
const cancelOrderService = require('../services/cancel-order.service');
const cancelOrderByBuyerService = require('../services/cancel-order-by-buyer.service');
const terminalWebhookHandlerService = require('../services/terminal-webhook-handler.service');
const terminalWebhookCreateService = require('../services/terminal-webhook-create.service');
const terminalWebhookListService = require('../services/terminal-webhook-list.service');
const terminalWebhookDeleteService = require('../services/terminal-webhook-delete.service');
const terminalService = require('../services/terminal.service');
const orderRepository = require('../repositories/order.repository');
const errorLoggingService = require('../../error-logging/services/error-logging.service');

exports.createOrder = async (req, res) => {
  let orderId;
  try {
    // Step 1: Create the draft order(s)
    console.log('Controller: Calling createOrder service...');
    const createdOrders = await orderService.createOrder(req);
    const orderResult = { orders: createdOrders }; // Structure the data as the rest of the function expects
    console.log('Controller: Received from createOrder service:', JSON.stringify(createdOrders, null, 2));

    // Step 2 & 3: For each order, create shipment and get rates
    const ordersWithRates = await Promise.all(orderResult.orders.map(async (order) => {
      orderId = order.orderId.toString();
      // If order is for store pickup or is international, skip shipment/rate steps
      if (order.isStorePickup || order.isInternational) {
        console.log(`Controller: Skipping shipment and rates for orderId ${orderId} (isStorePickup: ${order.isStorePickup}, isInternational: ${order.isInternational})`);
        return {
          ...order,
          rates: [], // Return empty rates array
        };
      }

      console.log(`Controller: Processing orderId ${orderId}`);
      
      // Create shipment
      try {
        console.log(`Controller: Calling createShipmentForOrder for orderId ${orderId}`);
        await shipmentService.createShipmentForOrder(orderId);
        console.log(`Controller: Shipment created for orderId ${orderId}`);
      } catch (error) {
        await errorLoggingService.logError(orderId, 'create_shipment', error);
        throw error;
      }
      
      // Get rates
      try {
        console.log(`Controller: Calling getOrderRates for orderId ${orderId}`);
        const ratesResult = await ratesService.getOrderRates(orderId);
        console.log(`Controller: Rates received for orderId ${orderId}`, ratesResult.data.rates);
        
        return {
          ...order,
          rates: ratesResult.data.rates || [],
        };
      } catch (error) {
        await errorLoggingService.logError(orderId, 'get_rates', error);
        throw error;
      }
    }));

    // Step 4: Return the consolidated response
    const finalOrders = ordersWithRates.map(order => ({
      isFreeShipping: true,
      ...order,
     
    }));

    return res.status(201).json({
      message: 'Draft orders created and rates fetched successfully.',
      orders: finalOrders,
    });

  } catch (error) {
    console.error('Error in createOrder workflow:', error);
    if (orderId) {
      await errorLoggingService.logError(orderId, 'create_order', error);
    }
    return res.status(500).json({ message: 'Failed to create order, shipment, and fetch rates', error: error.message });
  }
};





exports.payForOrder = async (req, res) => {
  const { orderId } = req.params;
  try {
    const { paymentDetails, carrier } = req.body;

    // Fetch the order to check its properties
    const order = await orderRepository.findOrderById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // If the order is a standard shipment, select a carrier. This service should update the status.
    if (!order.isStorePickup && !order.isInternational) {
      if (!carrier) {
        return res.status(400).json({ message: 'Carrier information is required for payment.' });
      }
      const carrierResult = await carrierService.selectCarrier(orderId, carrier);
      if (carrierResult.status >= 400) {
        return res.status(carrierResult.status).json(carrierResult.data);
      }
    } else {
      // For international or store pickup orders, manually update status to allow payment
      order.status = 'pending_payment';
      await order.save();
    }

    // 2. Proceed with payment
    const paymentResult = await paymentService.payForOrder(orderId, paymentDetails);
    return res.status(200).json(paymentResult);
    
  } catch (error) {
    console.error('Error in payForOrder workflow:', error);
    await errorLoggingService.logError(orderId, 'payment', error);
    return res.status(500).json({ message: 'Failed to process payment', error: error.message });
  }
};


  exports.markOrderAsPaid = async (req, res) => {
    try {
      const { id } = req.params;
      const { transactionId, paymentReference, manualNote } = req.body;
  
      const result = await markAsPaidService.markOrderAsPaid(id, transactionId, paymentReference, manualNote);
      return res.status(result.status).json(result.data);
    } catch (error) {
      console.error('Error in markOrderAsPaid controller:', error);
      return res.status(500).json({
        message: 'Failed to mark order as paid',
        error: error.message
      });
    }
  };


  exports.verifyPaymentByReference = async (req, res) => {
    try {
      const { reference, orderId } = req.body;
      const result = await verifyPaymentService.verifyPaymentByReference(reference, orderId);
      return res.status(result.status).json(result.data);
    } catch (error) {
      console.error('Error in verifyPaymentByReference controller:', error);
      return res.status(500).json({
        message: 'Error verifying payment',
        error: error.message
      });
    }
  };


  exports.handlePaystackWebhook = async (req, res) => {
    try {
      const result = await paystackWebhookService.handlePaystackWebhook(req);
      return res.status(result.status).json(result.data);
    } catch (error) {
      console.error('Error in handlePaystackWebhook controller:', error);
      return res.status(500).json({
        message: 'Error processing webhook',
        error: error.message
      });
    }
  };


exports.cancelOrderBySeller = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    const sellerId = req.user.id;

    // Validate input
    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required' });
    }

    if (!sellerId) {
      return res.status(401).json({ message: 'Seller authentication required' });
    }

    // Call the service
    const result = await cancelOrderService.cancelOrderBySeller(orderId, sellerId, reason);

    // Return response
    return res.status(result.status).json(result.data);

  } catch (error) {
    console.error('Error in cancelOrderBySeller controller:', error);
    return res.status(500).json({ 
      message: 'Error cancelling order', 
      error: error.message 
    });
  }
};


exports.cancelOrderByBuyer = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    const buyerId = req.user.id;

    // Validate input
    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required' });
    }

    if (!buyerId) {
      return res.status(401).json({ message: 'Buyer authentication required' });
    }

    // Call the service
    const result = await cancelOrderByBuyerService.cancelOrderByBuyer(orderId, buyerId, reason);

    // Return response
    return res.status(result.status).json(result.data);

  } catch (error) {
    console.error('Error in cancelOrderByBuyer controller:', error);
    return res.status(500).json({ 
      message: 'Error cancelling order', 
      error: error.message 
    });
  }
};

// Terminal Africa webhook endpoints
exports.handleTerminalWebhook = async (req, res) => {
  try {
    await terminalWebhookHandlerService.handleTerminalWebhook(req, res);
  } catch (error) {
    console.error('Error handling Terminal webhook:', error);
    return res.status(500).json({
      status: false,
      message: 'Failed to process Terminal webhook',
      error: error.message
    });
  }
};

exports.createTerminalWebhook = async (req, res) => {
  try {
    const result = await terminalWebhookCreateService.createTerminalWebhook(req.body);
    return res.status(result.status).json(result.data);
  } catch (error) {
    console.error('Error in createTerminalWebhook controller:', error);
    return res.status(500).json({
      status: false,
      message: 'Failed to create webhook',
      error: error.message
    });
  }
};

exports.getTerminalWebhooks = async (req, res) => {
  try {
    const result = await terminalWebhookListService.getTerminalWebhooks(req.query);
    return res.status(result.status).json(result.data);
  } catch (error) {
    console.error('Error in getTerminalWebhooks controller:', error);
    return res.status(500).json({
      status: false,
      message: 'Failed to retrieve webhooks',
      error: error.message
    });
  }
};

exports.deleteTerminalWebhook = async (req, res) => {
  try {
    const { webhook_id } = req.params;
    const result = await terminalWebhookDeleteService.deleteTerminalWebhook(webhook_id);
    return res.status(result.status).json(result.data);
  } catch (error) {
    console.error('Error in deleteTerminalWebhook controller:', error);
    return res.status(500).json({
      status: false,
      message: 'Failed to delete webhook',
      error: error.message
    });
  }
};

exports.getStates = async (req, res) => {
  try {
    const result = await terminalService.getStates();
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error getting states:', error);
    return res.status(500).json({ message: 'Failed to get states', error: error.message });
  }
};

exports.getCities = async (req, res) => {
  try {
    const { stateCode } = req.params;
    const result = await terminalService.getCities(stateCode);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error getting cities:', error);
    return res.status(500).json({ message: 'Failed to get cities', error: error.message });
  }
};