const mailer = require('../services/email/mailer');
const Return = require('../models/Return');
const Order = require('../models/Order');
const cloudinary = require('../config/cloudinary');
const { validateReturnEligibility } = require('../utils/returnUtils');
const Admin = require('../models/Admin');

const { createBuyerNotification, createNotification } = require('./notificationController');
const Product = require('../models/Product');
const Buyer = require('../models/Buyer');
const mongoose = require('mongoose');
const terminalAPI = require('../config/terminalAPI');
const { formatAddressForTerminal } = require('../helpers/formatters');
const crypto = require('crypto');

// Initialize Paystack for Terminal Africa returns
const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
const paystack = require('axios').create({
  baseURL: 'https://api.paystack.co',
  headers: {
    Authorization: `Bearer ${paystackSecretKey}`,
    'Content-Type': 'application/json'
  }
});

// Helper function to verify Paystack transaction status
const verifyPaystackTransaction = async (reference) => {
  try {
    const response = await paystack.get(`/transaction/verify/${reference}`);
    return {
      success: response.data.status === true && response.data.data.status === 'success',
      data: response.data.data
    };
  } catch (error) {
    console.error('Error verifying Paystack transaction:', error);
    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
};

// Helper function to notify admins
async function notifyAdmins(type, data) {
  try {
    const admins = await Admin.find({});
    
    if (admins && admins.length > 0) {
      const adminEmails = admins.map(admin => admin.email).filter(Boolean);
      
      if (adminEmails.length > 0) {
        let subject, html;
        
        switch (type) {
          case 'REFUND_REQUEST':
            subject = 'New Refund Request - Terminal Africa Return';
            html = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>New Refund Request</h2>
                <p>A new refund request has been created for a Terminal Africa return.</p>
                <p><strong>Return ID:</strong> ${data.returnId}</p>
                <p><strong>Order ID:</strong> ${data.orderId}</p>
                <p><strong>Amount:</strong> ₦${data.amount?.toLocaleString()}</p>
                <p><strong>Reason:</strong> ${data.reason}</p>
                <p>Please review this request in the admin dashboard.</p>
              </div>
            `;
            break;
          default:
            subject = 'Admin Notification - Terminal Africa Return';
            html = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Admin Notification</h2>
                <p>A new notification requires your attention.</p>
                <p>Type: ${type}</p>
                <p>Data: ${JSON.stringify(data, null, 2)}</p>
              </div>
            `;
        }
        
        const adminEmail = {
          to: adminEmails,
          from: process.env.EMAIL_FROM,
          subject,
          html
        };
        
        await mailer.send({ ...adminEmail, tags: [{ name: 'type', value: 'return-update' }] });
        console.log('Admin notification sent successfully');
      }
    }
  } catch (error) {
    console.error('Error notifying admins:', error);
  }
}

// Create return request for Terminal Africa orders
exports.createReturnRequest = async (req, res) => {
  try {
    const { orderId, items, description, preferredResolution } = req.body;
    const buyerId = req.user.id;

    console.log('Terminal Africa Return Request Body:', {
      orderId,
      items,
      description,
      preferredResolution,
      files: req.files?.length
    });

    // Check if items exists and is properly formatted
    if (!items) {
      console.log('Items is missing from request body');
      return res.status(400).json({
        message: 'Items are required',
        error: 'Missing items array'
      });
    }

    // Parse items if it's a string (from form-data)
    let parsedItems;
    try {
      parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
      console.log('Parsed Items:', parsedItems);
      
      // Convert single item to array if necessary
      if (!Array.isArray(parsedItems)) {
        parsedItems = [parsedItems];
      }

      console.log('Processed Items Array:', parsedItems);
    } catch (error) {
      console.log('Error parsing items:', error);
      return res.status(400).json({
        message: 'Invalid items format',
        error: 'Items must be a valid JSON array or object'
      });
    }

    // Find the Terminal Africa order
    const order = await Order.findById(orderId)
      .populate('seller', '_id email firstName lastName businessName storeName')
      .populate('buyer', '_id email firstName lastName')
      .populate('items.product');

    console.log('Found Terminal Africa Order:', {
      orderId: order?._id,
      sellerInfo: order?.seller,
      itemsCount: order?.items?.length,
      isTerminalOrder: order?.shipping?.carrier?.name === 'Terminal Africa'
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if this is a Terminal Africa order
    if (order.shipping?.carrier?.name !== 'Terminal Africa') {
      return res.status(400).json({ 
        message: 'This return controller only handles Terminal Africa orders' 
      });
    }

    // Check if return is eligible
    const eligibilityCheck = await validateReturnEligibility(order);
    console.log('Eligibility Check Result:', eligibilityCheck);

    if (!eligibilityCheck.isEligible) {
      return res.status(400).json({
        message: 'Return request not eligible',
        reason: eligibilityCheck.reason
      });
    }

    // Upload evidence files if provided
    let uploadedFiles = [];
    if (req.files && req.files.length > 0) {
      console.log('Uploading evidence files...');
      for (const file of req.files) {
        try {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: 'returns/evidence',
            resource_type: 'auto'
          });
          uploadedFiles.push({
            url: result.secure_url,
            public_id: result.public_id,
            type: file.mimetype.startsWith('image/') ? 'image' : 'document'
          });
        } catch (uploadError) {
          console.error('Error uploading file:', uploadError);
        }
      }
    }

    // Create return request
    const returnRequest = new Return({
      buyer: buyerId,
      seller: order.seller._id,
      order: order._id,
      items: parsedItems.map(item => ({
        product: item.product,
        quantity: item.quantity,
        reason: item.reason,
        description: item.description || ''
      })),
      description,
      preferredResolution,
      evidence: uploadedFiles,
      status: 'PENDING',
      requestDate: new Date(),
      timeline: [{
        status: 'PENDING',
        date: new Date(),
        note: 'Return request created for Terminal Africa order',
        updatedBy: 'buyer'
      }]
    });

    await returnRequest.save();

    // Send notifications
    await createBuyerNotification(buyerId, 'return_created', {
      returnId: returnRequest._id,
      orderId: order._id,
      order_id: order.order_id
    });

    // Notify seller about new return request
    await createNotification(order.seller._id, 'return_request', {
      returnId: returnRequest._id,
      orderId: order._id,
      order_id: order.order_id,
      buyerName: `${order.buyer.firstName} ${order.buyer.lastName}`
    });

    res.status(201).json({
      message: 'Return request created successfully for Terminal Africa order',
      returnRequest
    });

  } catch (error) {
    console.error('Create Terminal Africa return request error:', error);
    res.status(500).json({
      message: 'Failed to create return request',
      error: error.message
    });
  }
};

// Get return details
exports.getReturnDetails = async (req, res) => {
  try {
    const { returnId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const returnRequest = await Return.findById(returnId)
      .populate('order')
      .populate('buyer', 'firstName lastName email')
      .populate('seller', 'firstName lastName businessName storeName email')
      .populate('items.product', 'name images price');

    if (!returnRequest) {
      return res.status(404).json({ message: 'Return request not found' });
    }

    // Check authorization - allow admin access
    if (!isAdmin && ![returnRequest.buyer._id.toString(), returnRequest.seller._id.toString()].includes(userId)) {
      return res.status(403).json({ message: 'Not authorized to view this return request' });
    }

    res.json(returnRequest);

  } catch (error) {
    console.error('Error fetching Terminal Africa return details:', error);
    res.status(500).json({
      message: 'Failed to fetch return details',
      error: error.message
    });
  }
};

// Get seller returns
exports.getSellerReturns = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const sellerId = req.user.id;

    const query = { seller: sellerId };
    if (status) {
      query.status = status;
    }

    const returns = await Return.find(query)
      .populate('order', 'order_id createdAt totalAmount')
      .populate('buyer', 'firstName lastName email')
      .populate('items.product', 'name images price')
      .sort({ requestDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Return.countDocuments(query);

    res.json({
      returns,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching seller Terminal Africa returns:', error);
    res.status(500).json({
      message: 'Failed to fetch returns',
      error: error.message
    });
  }
};

// Get buyer returns
exports.getBuyerReturns = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const buyerId = req.user.id;

    console.log('Buyer ID:', buyerId);
    console.log('Query:', { buyer: buyerId, status });

    const query = { buyer: buyerId };
    if (status) {
      query.status = status;
    }

    const returns = await Return.find(query)
      .populate('order', 'order_id createdAt totalAmount')
      .populate('seller', 'firstName lastName businessName storeName')
      .populate('items.product', 'name images price')
      .sort({ requestDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Return.countDocuments(query);

    res.json({
      returns,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching buyer Terminal Africa returns:', error);
    res.status(500).json({
      message: 'Failed to fetch returns',
      error: error.message
    });
  }
};

// Get all returns (admin)
exports.getAllReturns = async (req, res) => {
  try {
    const { status, disputeStatus, page = 1, limit = 10 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (disputeStatus) query['dispute.status'] = disputeStatus;

    const returns = await Return.find(query)
      .populate('order', 'order_id createdAt totalAmount')
      .populate('buyer', 'firstName lastName email')
      .populate('seller', 'firstName lastName businessName storeName email')
      .populate('items.product', 'name images price')
      .sort({ requestDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Return.countDocuments(query);

    res.json({
      returns,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching all Terminal Africa returns:', error);
    res.status(500).json({
      message: 'Failed to fetch returns',
      error: error.message
    });
  }
};

// Respond to return request
exports.respondToReturn = async (req, res) => {
  try {
    const { returnId } = req.params;
    const { action, message, partialRefundAmount } = req.body;
    const sellerId = req.user.id;

    console.log('Terminal Africa Return Response Data:', {
      returnId,
      action,
      message,
      partialRefundAmount,
      sellerId
    });

    // Find and validate return request
    const returnRequest = await Return.findById(returnId)
      .populate('buyer', 'email firstName lastName')
      .populate('seller', 'email firstName lastName businessName storeName')
      .populate('order');

    if (!returnRequest) {
      return res.status(404).json({ message: 'Return request not found' });
    }

    // Verify seller ownership
    if (returnRequest.seller._id.toString() !== sellerId) {
      return res.status(403).json({ message: 'Not authorized to respond to this return' });
    }

    // Update return status based on action
    switch (action) {
      case 'approve':
        returnRequest.status = 'APPROVED';
        // Generate shipping label with Terminal Africa for approved returns
        try {
          const shippingLabel = await generateTerminalAfricaShippingLabel(returnRequest);
          returnRequest.returnShippingLabel = shippingLabel;
        } catch (error) {
          console.error('Error generating Terminal Africa shipping label:', error);
          // Continue with the response even if shipping label generation fails
        }
        break;
      case 'reject':
        returnRequest.status = 'REJECTED';
        break;
      case 'need_info':
        returnRequest.status = 'NEED_MORE_INFO';
        break;
      case 'partial_refund':
        if (!partialRefundAmount) {
          return res.status(400).json({
            message: 'Partial refund amount is required'
          });
        }
        returnRequest.status = 'APPROVED';
        break;
      default:
        return res.status(400).json({
          message: 'Invalid action'
        });
    }

    // Update seller response
    returnRequest.sellerResponse = {
      status: action,
      message: message,
      date: new Date(),
      partialRefundAmount: partialRefundAmount
    };

    // Add to timeline
    returnRequest.timeline.push({
      status: returnRequest.status,
      date: new Date(),
      note: `Seller ${action}: ${message}`,
      updatedBy: 'seller'
    });

    await returnRequest.save();

    // Send notification to buyer based on action
    const notificationTypes = {
      'approve': 'return_approved',
      'reject': 'return_rejected',
      'need_info': 'return_info_needed',
      'partial_refund': 'return_partial_refund'
    };

    await createBuyerNotification(returnRequest.buyer._id, notificationTypes[action], {
      returnId: returnRequest._id,
      orderId: returnRequest.order._id,
      order_id: returnRequest.order.order_id,
      message: message,
      partialRefundAmount: partialRefundAmount,
      sellerName: returnRequest.seller.businessName || returnRequest.seller.storeName || 'Seller'
    });

    res.json({
      message: 'Return response processed successfully for Terminal Africa order',
      returnRequest
    });

  } catch (error) {
    console.error('Error responding to Terminal Africa return:', error);
    res.status(500).json({
      message: 'Failed to process return response',
      error: error.message
    });
  }
};

// Helper function to generate Terminal Africa shipping label for returns
async function generateTerminalAfricaShippingLabel(returnRequest) {
  try {
    if (!returnRequest || !returnRequest.order) {
      throw new Error('Invalid return request or missing order information');
    }

    console.log('Generating Terminal Africa shipping label for return:', returnRequest._id);

    // Get order details
    const order = returnRequest.order;
    
    // Check if this is a Terminal Africa order
    if (order.shipping?.carrier?.name !== 'Terminal Africa') {
      throw new Error('This return is not for a Terminal Africa order');
    }

    // Format pickup address (where buyer will send the return - original delivery address)
    const pickupAddress = formatAddressForTerminal({
      recipientName: `${returnRequest.buyer.firstName} ${returnRequest.buyer.lastName}`,
      recipientEmail: returnRequest.buyer.email,
      recipientPhone: returnRequest.buyer.phoneNumber || '08000000000', // Default if missing
      ...order.delivery_address,
      country: 'NG'
    });

    // Format delivery address (where return will be delivered - original pickup address)
    const deliveryAddress = formatAddressForTerminal({
      recipientName: `${returnRequest.seller.firstName} ${returnRequest.seller.lastName}`,
      recipientEmail: returnRequest.seller.email,
      recipientPhone: returnRequest.seller.phoneNumber || '08000000000', // Default if missing
      ...order.pickup_address,
      country: 'NG'
    });

    // Calculate total weight and value for return items
    const totalWeight = returnRequest.items.reduce((sum, item) => {
      const weight = item.product.weight || 0.5; // Default weight if not specified
      return sum + (weight * item.quantity);
    }, 0);
    
    const totalValue = returnRequest.items.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity);
    }, 0);

    // Create parcel items for Terminal Africa
    const parcelItems = returnRequest.items.map(item => ({
      description: item.product.name,
      name: item.product.name,
      type: "parcel",
      currency: "NGN",
      value: item.product.price,
      quantity: item.quantity,
      weight: (item.product.weight || 0.5) * item.quantity,
      metadata: {
        productId: item.product._id.toString(),
        returnReason: item.reason
      }
    }));

    // Generate unique return shipment ID
    const uniqueReturnId = `AUQLI-RTN-${returnRequest._id.toString().substring(0, 8)}`;

    // Create Terminal Africa shipment request for return
    const terminalShipmentRequest = {
      pickup_address: pickupAddress,
      delivery_address: deliveryAddress,
      metadata: `Return ${uniqueReturnId} for order ${order.order_id}`,
      shipment_purpose: 'commercial',
      parcel: {
        items: parcelItems,
        description: `Return shipment for order ${order.order_id}`,
        weight_unit: "kg"
      }
    };

    console.log('Terminal Africa Return Shipment Request:', JSON.stringify(terminalShipmentRequest, null, 2));

    // Call Terminal Africa API to create return shipment
    const terminalResponse = await terminalAPI.post('/shipments/quick', terminalShipmentRequest);

    console.log('Terminal Africa Return Shipment Response:', {
      status: terminalResponse.data.status,
      shipmentId: terminalResponse.data.data?.shipment_id || terminalResponse.data.data?._id,
      message: terminalResponse.data.message
    });

    // Check if the shipment was created successfully
    if (!terminalResponse.data.status || !terminalResponse.data.data) {
      throw new Error(terminalResponse.data.message || 'Failed to create return shipment with Terminal Africa');
    }

    // Extract the Terminal Africa shipment ID
    const terminalShipmentId = terminalResponse.data.data.shipment_id || terminalResponse.data.data._id;

    // Return shipping label information
    return {
      shipment_id: terminalShipmentId,
      tracking_number: terminalShipmentId,
      tracking_url: `https://terminal.africa/tracking/${terminalShipmentId}`,
      carrier: 'Terminal Africa',
      generatedAt: new Date(),
      pickup_address: pickupAddress,
      delivery_address: deliveryAddress,
      weight: totalWeight,
      value: totalValue
    };

  } catch (error) {
    console.error('Error generating Terminal Africa shipping label:', error);
    throw error;
  }
}

// Generate shipping label endpoint
exports.generateShippingLabel = async (req, res) => {
  try {
    const { returnId } = req.params;
    
    const returnRequest = await Return.findById(returnId)
      .populate('order')
      .populate('buyer', 'email firstName lastName')
      .populate('seller', 'email firstName lastName businessName storeName');

    if (!returnRequest) {
      return res.status(404).json({
        message: 'Return request not found'
      });
    }

    if (returnRequest.status !== 'APPROVED') {
      return res.status(400).json({
        message: 'Cannot generate shipping label for non-approved returns'
      });
    }

    const shippingLabel = await generateTerminalAfricaShippingLabel(returnRequest);
    
    // Update return request with shipping label
    returnRequest.returnShippingLabel = shippingLabel;
    returnRequest.returnShipment = {
      shipment_id: shippingLabel.shipment_id,
      status: 'LABEL_GENERATED',
      tracking: {
        number: shippingLabel.tracking_number,
        url: shippingLabel.tracking_url,
        status: 'pending'
      }
    };
    
    await returnRequest.save();

    // Notify buyer about shipping label creation
    if (returnRequest && returnRequest.buyer) {
      try {
        await createBuyerNotification(returnRequest.buyer._id, 'return_label_created', {
          returnId: returnId,
          orderId: returnRequest.order._id,
          order_id: returnRequest.order.order_id,
          trackingNumber: shippingLabel.tracking_number,
          trackingUrl: shippingLabel.tracking_url
        });
      } catch (notificationError) {
        console.error('Error sending notification to buyer:', notificationError);
        // Continue execution despite notification error
      }
    }

    res.json({
      message: 'Terminal Africa shipping label generated successfully',
      shippingLabel
    });

  } catch (error) {
    console.error('Error generating Terminal Africa shipping label:', error);
    res.status(500).json({
      message: 'Failed to generate shipping label',
      error: error.message
    });
  }
};

// Create return shipping label (detailed version)
exports.createReturnShippingLabel = async (req, res) => {
  try {
    const { returnId } = req.params;
    const sellerId = req.user.id;

    const returnRequest = await Return.findById(returnId)
      .populate('order')
      .populate('buyer', 'email firstName lastName phoneNumber')
      .populate('seller', 'email firstName lastName businessName storeName phoneNumber')
      .populate('items.product', 'name weight price');

    if (!returnRequest) {
      return res.status(404).json({ message: 'Return request not found' });
    }

    // Verify seller ownership
    if (returnRequest.seller._id.toString() !== sellerId) {
      return res.status(403).json({ message: 'Unauthorized to create shipping label for this return' });
    }

    if (returnRequest.status !== 'APPROVED') {
      return res.status(400).json({
        message: 'Cannot create shipping label for non-approved returns'
      });
    }

    // Check if label already exists
    if (returnRequest.returnShipment?.shipment_id) {
      return res.status(400).json({
        message: 'Shipping label already exists for this return',
        existing_shipment: {
          shipment_id: returnRequest.returnShipment.shipment_id,
          tracking_number: returnRequest.returnShipment.tracking.number,
          tracking_url: returnRequest.returnShipment.tracking.url
        }
      });
    }

    // Generate Terminal Africa shipping label
    const shippingLabel = await generateTerminalAfricaShippingLabel(returnRequest);

    // Update return request with detailed shipping information
    returnRequest.returnShippingLabel = shippingLabel;
    returnRequest.returnShipment = {
      shipment_id: shippingLabel.shipment_id,
      status: 'LABEL_GENERATED',
      tracking: {
        number: shippingLabel.tracking_number,
        url: shippingLabel.tracking_url,
        status: 'pending',
        lastUpdate: new Date()
      },
      pickup_address: shippingLabel.pickup_address,
      delivery_address: shippingLabel.delivery_address,
      weight: shippingLabel.weight,
      value: shippingLabel.value,
      carrier: 'Terminal Africa'
    };

    // Add to timeline
    returnRequest.timeline.push({
      status: 'LABEL_GENERATED',
      date: new Date(),
      note: 'Terminal Africa shipping label generated',
      updatedBy: 'seller'
    });

    await returnRequest.save();

    // Notify buyer about shipping label creation
    await createBuyerNotification(returnRequest.buyer._id, 'return_label_created', {
      returnId: returnId,
      orderId: returnRequest.order._id,
      order_id: returnRequest.order.order_id,
      trackingNumber: shippingLabel.tracking_number,
      trackingUrl: shippingLabel.tracking_url
    });

    res.json({
      message: 'Return shipping label created successfully with Terminal Africa',
      data: {
        shipment_id: shippingLabel.shipment_id,
        tracking_number: shippingLabel.tracking_number,
        tracking_url: shippingLabel.tracking_url,
        carrier_name: 'Terminal Africa',
        shipment_cost: 0 // Terminal Africa cost will be determined when rates are selected
      }
    });

  } catch (error) {
    console.error('Error creating Terminal Africa return shipping label:', error);
    res.status(500).json({
      message: 'Failed to create return shipping label',
      error: error.message,
      details: error.response?.data
    });
  }
};

// Get shipping rates for Terminal Africa return
exports.getReturnShippingRates = async (req, res) => {
  try {
    const { returnId } = req.params;
    const returnRequest = await Return.findById(returnId)
      .populate('order')
      .populate('seller');

    if (!returnRequest) {
      return res.status(404).json({ message: 'Return request not found' });
    }

    // Verify seller ownership
    if (returnRequest.seller._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to get shipping rates for this return' });
    }

    // Get the shipment ID from the return request
    const shipmentId = returnRequest.returnShipment?.shipment_id;
    
    if (!shipmentId) {
      return res.status(400).json({ 
        message: 'No shipment ID found for this return. Please create shipping label first.' 
      });
    }

    console.log(`Fetching Terminal Africa rates for return shipment ID: ${shipmentId}`);
    
    // Call Terminal Africa API to get rates for this shipment
    const ratesResponse = await terminalAPI.get(`/rates/shipment?shipment_id=${shipmentId}`);
    
    console.log('Terminal Africa Return Rates Response:', {
      status: ratesResponse.data.status,
      message: ratesResponse.data.message,
      ratesCount: ratesResponse.data.data?.length || 0
    });
    
    if (!ratesResponse.data.status) {
      return res.status(400).json({
        message: 'Failed to retrieve rates from Terminal Africa',
        error: ratesResponse.data.message
      });
    }
    
    // Return the rates data
    return res.status(200).json({
      message: 'Return shipping rates retrieved successfully',
      return_id: returnRequest._id,
      shipment_id: shipmentId,
      rates: ratesResponse.data.data || []
    });
    
  } catch (error) {
    console.error('Error getting Terminal Africa return shipping rates:', error);
    return res.status(500).json({
      message: 'Failed to get return shipping rates',
      error: error.message
    });
  }
};

// Arrange return pickup with Terminal Africa
exports.arrangeReturnPickup = async (req, res) => {
  try {
    const { returnId } = req.params;
    const { rate_id } = req.body;

    if (!rate_id) {
      return res.status(400).json({ 
        message: 'Rate ID is required to arrange pickup' 
      });
    }

    const returnRequest = await Return.findById(returnId)
      .populate('order')
      .populate('seller')
      .populate('buyer');
      
    if (!returnRequest) {
      return res.status(404).json({ message: 'Return request not found' });
    }

    // Verify seller ownership
    if (returnRequest.seller._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to arrange pickup for this return' });
    }

    // Verify shipment_id exists
    if (!returnRequest.returnShipment?.shipment_id) {
      return res.status(400).json({ 
        message: 'Cannot arrange pickup. Missing shipment_id. Please create shipment first.' 
      });
    }

    const shipmentId = returnRequest.returnShipment.shipment_id;

    console.log(`Arranging pickup for return: ${returnId}, shipment: ${shipmentId}, rate: ${rate_id}`);
    
    // Call Terminal Africa API to arrange pickup
    const arrangePickupResponse = await terminalAPI.post('/shipments/pickup', {
      rate_id: rate_id
    });
    
    console.log('Terminal Africa Arrange Return Pickup Response:', {
      status: arrangePickupResponse.data.status,
      message: arrangePickupResponse.data.message
    });
    
    if (!arrangePickupResponse.data.status) {
      return res.status(400).json({
        message: 'Failed to arrange return pickup with Terminal Africa',
        error: arrangePickupResponse.data.message
      });
    }
    
    // Extract response data
    const responseData = arrangePickupResponse.data.data;
    const extras = responseData.extras || {};
    
    // Update return request with pickup information
    returnRequest.returnShipment.status = 'PICKUP_ARRANGED';
    returnRequest.returnShipment.rate_id = rate_id;
    
    // Update tracking information
    if (extras.tracking_number) {
      returnRequest.returnShipment.tracking.number = extras.tracking_number;
    }
    
    if (extras.tracking_url) {
      returnRequest.returnShipment.tracking.url = extras.tracking_url;
    }
    
    // Update shipping documents
    if (!returnRequest.returnShipment.documents) {
      returnRequest.returnShipment.documents = {};
    }
    
    if (extras.shipping_label_url) {
      returnRequest.returnShipment.documents.shippingLabel = extras.shipping_label_url;
    }
    
    // Update status
    returnRequest.status = 'IN_TRANSIT';
    returnRequest.returnShipment.tracking.status = 'pickup_arranged';
    returnRequest.returnShipment.tracking.lastUpdate = new Date();
    
    // Add to timeline
    returnRequest.timeline.push({
      status: 'RETURN_PICKUP_ARRANGED',
      date: new Date(),
      note: 'Return pickup arranged with Terminal Africa',
      updatedBy: 'seller'
    });

    await returnRequest.save();

    // Send notification to buyer
    await createBuyerNotification(returnRequest.buyer._id, 'return_pickup_arranged', {
      returnId: returnRequest._id,
      orderId: returnRequest.order._id,
      order_id: returnRequest.order.order_id,
      trackingNumber: returnRequest.returnShipment.tracking.number,
      trackingUrl: returnRequest.returnShipment.tracking.url
    });

    res.json({
      message: 'Return pickup arranged successfully with Terminal Africa',
      data: {
        shipment_id: shipmentId,
        tracking_number: returnRequest.returnShipment.tracking.number,
        tracking_url: returnRequest.returnShipment.tracking.url,
        status: 'pickup_arranged',
        documents: returnRequest.returnShipment.documents
      }
    });

  } catch (error) {
    console.error('Error arranging Terminal Africa return pickup:', error);
    res.status(500).json({
      message: 'Failed to arrange return pickup',
      error: error.response?.data?.message || error.message
    });
  }
};

// Helper function to send refund confirmation emails
async function sendRefundConfirmationEmails(returnRequest) {
  try {
    const buyerEmail = {
      to: returnRequest.buyer.email,
      from: process.env.EMAIL_FROM,
      subject: 'Your Refund Has Been Processed - Terminal Africa Return',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Refund Processed Successfully</h2>
          <p>Dear ${returnRequest.buyer.firstName},</p>
          <p>Good news! Your refund for Terminal Africa return request #${returnRequest._id} has been processed.</p>
          <p><strong>Refund Details:</strong></p>
          <ul>
            <li>Amount: ₦${returnRequest.refundDetails.amount.toLocaleString()}</li>
            <li>Method: Wallet Credit</li>
            <li>Date: ${new Date(returnRequest.refundDetails.processedAt).toLocaleDateString()}</li>
          </ul>
          <p>The refund amount has been credited to your Auqli wallet and is available for immediate use.</p>
          <p>If you have any questions, please don't hesitate to contact our support team.</p>
          <p>Best regards,<br>The Auqli Team</p>
        </div>
      `
    };

    await mailer.send({ ...buyerEmail, tags: [{ name: 'type', value: 'return-update' }] });
    console.log('Refund confirmation email sent to buyer for Terminal Africa return');

  } catch (error) {
    console.error('Error sending refund confirmation emails:', error);
  }
}

// Confirm refund for Terminal Africa return
exports.confirmRefund = async (req, res) => {
  try {
    const { returnId } = req.params;
    const { refundAmount, refundMethod, transactionReference, notes } = req.body;
    const adminId = req.user.id;

    const returnRequest = await Return.findById(returnId)
      .populate('buyer', 'email firstName lastName')
      .populate('seller', 'email businessName storeName')
      .populate('order', 'order_id totalAmount');

    if (!returnRequest) {
      return res.status(404).json({ message: 'Return request not found' });
    }

    // Update return request with refund details
    returnRequest.status = 'REFUNDED';
    returnRequest.refundDetails = {
      amount: refundAmount,
      processedAt: new Date(),
      method: refundMethod,
      transactionId: transactionReference,
      processedBy: adminId,
      notes
    };

    returnRequest.timeline.push({
      status: 'REFUNDED',
      date: new Date(),
      note: `Refund processed: ₦${refundAmount} via ${refundMethod}`,
      updatedBy: 'admin'
    });

    await returnRequest.save();

    // Send email notifications
    await sendRefundConfirmationEmails(returnRequest);

    res.json({
      message: 'Refund confirmed successfully for Terminal Africa return',
      returnRequest
    });

  } catch (error) {
    console.error('Error confirming refund:', error);
    res.status(500).json({
      message: 'Failed to confirm refund',
      error: error.message
    });
  }
};

// Initiate refund request (seller action)
exports.initiateRefundRequest = async (req, res) => {
  try {
    const { returnId } = req.params;
    const { amount, reason } = req.body;
    const sellerId = req.user.id;

    // Find the return request
    const returnRequest = await Return.findOne({ _id: returnId, seller: sellerId })
      .populate('buyer')
      .populate('order');

    if (!returnRequest) {
      return res.status(404).json({ message: 'Return request not found' });
    }

    // Validate return status and resolution type
    if (!['refund', 'REFUND', 'FULL_REFUND'].includes(returnRequest.preferredResolution)) {
      return res.status(400).json({ 
        message: 'Invalid return status or resolution type for refund request' 
      });
    }

    // Validate refund amount against order total
    if (amount <= 0 || amount > returnRequest.order.totalAmount) {
      return res.status(400).json({ 
        message: 'Invalid refund amount' 
      });
    }

    // Update return request with refund details
    returnRequest.status = 'PENDING_ADMIN_REVIEW';
    returnRequest.sellerResponse = {
      status: 'REFUND_REQUESTED',
      message: reason,
      date: new Date(),
      partialRefundAmount: amount
    };

    // Add to timeline
    returnRequest.timeline.push({
      status: 'REFUND_REQUESTED',
      date: new Date(),
      note: `Seller initiated refund request for ₦${amount}`,
      updatedBy: 'seller'
    });

    await returnRequest.save();

    // Notify admin of new refund request
    await notifyAdmins('REFUND_REQUEST', {
      returnId: returnRequest._id,
      orderId: returnRequest.order._id,
      amount,
      reason
    });

    res.status(200).json({
      message: 'Refund request initiated successfully for Terminal Africa return',
      returnRequest
    });

  } catch (error) {
    console.error('Error in initiateRefundRequest:', error);
    res.status(500).json({ message: 'Error processing refund request' });
  }
};

// Get refund requests (admin)
exports.getRefundRequests = async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const query = {
      'sellerResponse.status': 'REFUND_REQUESTED',
      status: 'PENDING_ADMIN_REVIEW'
    };

    if (status !== 'pending') {
      query.status = status === 'approved' ? 'REFUNDED' : 'REJECTED';
    }

    const refundRequests = await Return.find(query)
      .populate('buyer', 'firstName lastName email')
      .populate('seller', 'firstName lastName businessName storeName')
      .populate('order')
      .sort({ 'sellerResponse.date': -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Return.countDocuments(query);

    res.status(200).json({
      refundRequests,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error in getRefundRequests:', error);
    res.status(500).json({ message: 'Error fetching refund requests' });
  }
};

// Process refund request (admin)
exports.processRefundRequest = async (req, res) => {
  try {
    const { returnId } = req.params;
    const { action, note } = req.body;
    const adminId = req.user.id;

    const returnRequest = await Return.findById(returnId)
      .populate('buyer')
      .populate('order')
      .populate('seller');

    if (!returnRequest) {
      return res.status(404).json({ message: 'Return request not found' });
    }

    if (returnRequest.status !== 'PENDING_ADMIN_REVIEW') {
      return res.status(400).json({ message: 'Invalid return status for processing refund' });
    }

    const refundAmount = returnRequest.sellerResponse.partialRefundAmount;

    if (action === 'approve') {
      // Update buyer's wallet
      const buyer = await Buyer.findById(returnRequest.buyer._id);
      
      // Add transaction to buyer's wallet
      buyer.wallet.transactions.push({
        type: 'credit',
        amount: refundAmount,
        paymentReference: `REF-${returnId}-${Date.now()}`,
        description: `Refund for Terminal Africa return #${returnRequest._id}`,
        status: 'completed'
      });

      // Update wallet balance
      buyer.wallet.balance += refundAmount;
      await buyer.save();

      // Update return status
      returnRequest.status = 'REFUNDED';
      returnRequest.refundDetails = {
        amount: refundAmount,
        processedAt: new Date(),
        method: 'wallet_credit',
        transactionId: `REF-${returnId}-${Date.now()}`,
        processedBy: adminId,
        notes: note
      };

      // Add to timeline
      returnRequest.timeline.push({
        status: 'REFUNDED',
        date: new Date(),
        note: `Admin approved refund of ₦${refundAmount}`,
        updatedBy: 'admin'
      });

      // Send email to buyer
      await sendRefundConfirmationEmails(returnRequest);

    } else if (action === 'reject') {
      // Reject refund request
      returnRequest.status = 'REJECTED';
      returnRequest.timeline.push({
        status: 'REFUND_REJECTED',
        date: new Date(),
        note: `Admin rejected refund request: ${note}`,
        updatedBy: 'admin'
      });
    }

    // Add admin note
    if (!returnRequest.adminNotes) {
      returnRequest.adminNotes = [];
    }
    returnRequest.adminNotes.push({
      note,
      date: new Date(),
      adminId
    });

    await returnRequest.save();

    res.status(200).json({
      message: `Refund request ${action}ed successfully for Terminal Africa return`,
      returnRequest
    });

  } catch (error) {
    console.error('Error in processRefundRequest:', error);
    res.status(500).json({ message: 'Error processing refund request' });
  }
};

// Get return statistics
exports.getReturnStatistics = async (req, res) => {
  try {
    const { timeframe = 'monthly' } = req.query;
    const now = new Date();
    let startDate;

    switch (timeframe) {
      case 'daily':
        startDate = new Date(now.setDate(now.getDate() - 30)); // Last 30 days
        break;
      case 'weekly':
        startDate = new Date(now.setDate(now.getDate() - 90)); // Last 90 days
        break;
      case 'monthly':
        startDate = new Date(now.setMonth(now.getMonth() - 12)); // Last 12 months
        break;
      case 'yearly':
        startDate = new Date(now.setFullYear(now.getFullYear() - 5)); // Last 5 years
        break;
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 12));
    }

    const stats = await Return.aggregate([
      {
        $match: {
          requestDate: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRefundAmount: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'REFUNDED'] },
                { $toDouble: '$refundDetails.amount' },
                0
              ]
            }
          }
        }
      }
    ]);

    const topReasons = await Return.aggregate([
      {
        $unwind: '$items'
      },
      {
        $group: {
          _id: '$items.reason',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5
      }
    ]);

    res.json({
      statistics: {
        byStatus: stats,
        topReasons,
        timeframe
      }
    });

  } catch (error) {
    console.error('Error getting Terminal Africa return statistics:', error);
    res.status(500).json({
      message: 'Failed to get return statistics',
      error: error.message
    });
  }
};

// Add admin note
exports.addAdminNote = async (req, res) => {
  try {
    const { returnId } = req.params;
    const { note } = req.body;
    const adminId = req.user.id;

    const returnRequest = await Return.findById(returnId);
    if (!returnRequest) {
      return res.status(404).json({ message: 'Return request not found' });
    }

    if (!returnRequest.dispute) {
      returnRequest.dispute = { adminNotes: [] };
    }

    if (!returnRequest.dispute.adminNotes) {
      returnRequest.dispute.adminNotes = [];
    }

    returnRequest.dispute.adminNotes.push({
      note,
      addedBy: adminId,
      addedAt: new Date()
    });

    await returnRequest.save();

    res.json({
      message: 'Admin note added successfully to Terminal Africa return',
      returnRequest
    });

  } catch (error) {
    console.error('Add admin note error:', error);
    res.status(500).json({
      message: 'Failed to add admin note',
      error: error.message
    });
  }
};

// Payment-related functions for Terminal Africa returns

// Mark return refund as paid using Paystack
exports.markReturnRefundAsPaid = async (req, res) => {
  try {
    const { returnId } = req.params;
    const { transactionId, paymentReference, manualNote } = req.body;
    
    if (!transactionId && !paymentReference) {
      return res.status(400).json({ message: 'Either transactionId or paymentReference is required' });
    }
    
    const returnRequest = await Return.findById(returnId)
      .populate('buyer', 'email firstName lastName')
      .populate('seller', 'email firstName lastName businessName storeName')
      .populate('order');
    
    if (!returnRequest) {
      return res.status(404).json({ message: 'Return request not found' });
    }
    
    // Verify Paystack transaction if reference is provided
    let verificationResult = null;
    if (paymentReference) {
      verificationResult = await verifyPaystackTransaction(paymentReference);
      if (!verificationResult.success) {
        return res.status(400).json({ 
          message: 'Payment verification failed', 
          details: verificationResult.error 
        });
      }
    }
    
    // Check if return is already refunded
    if (returnRequest.status === 'REFUNDED') {
      return res.status(400).json({ message: 'Return is already marked as refunded' });
    }
    
    // Update return request with refund details
    returnRequest.status = 'REFUNDED';
    returnRequest.refundDetails = {
      amount: returnRequest.sellerResponse?.partialRefundAmount || returnRequest.order.totalAmount,
      processedAt: new Date(),
      method: 'paystack',
      transactionId: transactionId || verificationResult?.data?.id,
      paymentReference: paymentReference || null,
      processedBy: req.user.id,
      notes: manualNote || 'Refund processed via Paystack'
    };
    
    // Add to timeline
    returnRequest.timeline.push({
      status: 'REFUNDED',
      date: new Date(),
      note: `Refund processed via Paystack: ₦${returnRequest.refundDetails.amount}`,
      updatedBy: 'admin'
    });
    
    await returnRequest.save();
    
    // Send confirmation email
    await sendRefundConfirmationEmails(returnRequest);
    
    return res.status(200).json({ 
      message: 'Terminal Africa return refund marked as paid successfully', 
      returnRequest: {
        _id: returnRequest._id,
        status: returnRequest.status,
        refundDetails: returnRequest.refundDetails
      }
    });
    
  } catch (error) {
    console.error('Error marking Terminal Africa return refund as paid:', error);
    return res.status(500).json({ 
      message: 'Failed to mark return refund as paid', 
      error: error.message 
    });
  }
};

// Verify refund payment by reference
exports.verifyRefundPaymentByReference = async (req, res) => {
  try {
    const { reference, returnId } = req.body;

    if (!reference) {
      return res.status(400).json({ message: 'Payment reference is required' });
    }

    // Verify with Paystack
    const verificationResult = await verifyPaystackTransaction(reference);
    
    if (!verificationResult.success) {
      return res.status(400).json({ 
        message: 'Payment verification failed', 
        details: verificationResult.error
      });
    }

    // If returnId is provided, mark the return as refunded
    if (returnId) {
      const returnRequest = await Return.findById(returnId)
        .populate('buyer', 'email firstName lastName')
        .populate('seller', 'email firstName lastName businessName storeName')
        .populate('order');
      
      if (!returnRequest) {
        return res.status(404).json({ message: 'Return request not found' });
      }

      if (returnRequest.status !== 'REFUNDED') {
        // Update return request with refund details
        returnRequest.status = 'REFUNDED';
        returnRequest.refundDetails = {
          amount: verificationResult.data.amount / 100, // Convert from kobo to naira
          processedAt: new Date(),
          method: 'paystack',
          transactionId: verificationResult.data.id,
          paymentReference: reference,
          processedBy: req.user.id,
          notes: 'Refund verified via Paystack'
        };
        
        // Add to timeline
        returnRequest.timeline.push({
          status: 'REFUNDED',
          date: new Date(),
          note: `Refund verified via Paystack: ₦${returnRequest.refundDetails.amount}`,
          updatedBy: 'admin'
        });
        
        await returnRequest.save();
        
        // Send confirmation email
        await sendRefundConfirmationEmails(returnRequest);

        return res.status(200).json({
          message: 'Payment verified and Terminal Africa return marked as refunded',
          returnRequest,
          verificationDetails: verificationResult.data
        });
      } else {
        return res.status(200).json({
          message: 'Payment verified but return is already refunded',
          verificationDetails: verificationResult.data
        });
      }
    }

    // If no returnId or return already refunded, just return verification result
    return res.status(200).json({
      message: 'Payment verification successful',
      verificationDetails: verificationResult.data
    });
  } catch (error) {
    console.error('Error verifying refund payment by reference:', error);
    return res.status(500).json({ 
      message: 'Error verifying payment', 
      error: error.message 
    });
  }
};

// Handle Paystack webhook for Terminal Africa return refunds
exports.handlePaystackWebhookForRefunds = async (req, res) => {
  // Verify the event is from Paystack
  const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY || paystackSecretKey)
                    .update(JSON.stringify(req.body))
                    .digest('hex');
                    
  if (hash !== req.headers['x-paystack-signature']) {
    return res.status(400).json({ message: 'Invalid signature' });
  }

  const event = req.body;

  // Check if it's a refund.success event
  if (event.event === 'refund.success') {
    console.log(`Received successful refund event from Paystack for Terminal Africa return:`, {
      reference: event.data.reference,
      amount: event.data.amount / 100,
      status: event.data.status,
      metadata: event.data.metadata || {}
    });
    
    const metadata = event.data.metadata || {};
    
    // If there's no metadata or returnId, just acknowledge the webhook
    if (!metadata || !metadata.returnId) {
      return res.status(200).json({ message: 'Webhook received, but no return metadata' });
    }

    try {
      // Find the return request
      const returnRequest = await Return.findById(metadata.returnId)
        .populate('buyer', 'email firstName lastName')
        .populate('seller', 'email firstName lastName businessName storeName')
        .populate('order');
      
      if (!returnRequest) {
        console.log(`Return request not found for Paystack refund: ${metadata.returnId}`);
        return res.status(200).json({ message: 'Return request not found, but acknowledging webhook' });
      }
      
      // Check if return is not already refunded
      if (returnRequest.status === 'REFUNDED') {
        console.log(`Terminal Africa return ${returnRequest._id} is already refunded`);
        return res.status(200).json({ message: 'Return already refunded' });
      }
      
      // Mark the return as refunded
      returnRequest.status = 'REFUNDED';
      returnRequest.refundDetails = {
        amount: event.data.amount / 100, // Convert from kobo to naira
        processedAt: new Date(),
        method: 'paystack',
        transactionId: event.data.id,
        paymentReference: event.data.reference,
        processedBy: 'system',
        notes: 'Refund processed via Paystack webhook'
      };
      
      // Add to timeline
      returnRequest.timeline.push({
        status: 'REFUNDED',
        date: new Date(),
        note: `Refund processed via Paystack webhook: ₦${returnRequest.refundDetails.amount}`,
        updatedBy: 'system'
      });
      
      await returnRequest.save();
      
      // Send confirmation email
      await sendRefundConfirmationEmails(returnRequest);
      
      return res.status(200).json({ message: 'Terminal Africa return refund processed successfully' });
    } catch (error) {
      console.error('Error processing Terminal Africa return refund webhook:', error);
      return res.status(200).json({ message: 'Error processing webhook, but acknowledging receipt' });
    }
  }

  // For other events, just acknowledge receipt
  return res.status(200).json({ message: 'Webhook received' });
}; 