const Return = require('../models/Return');
const Order = require('../models/Order');
const cloudinary = require('../config/cloudinary');
const { validateReturnEligibility } = require('../utils/returnUtils');
const Admin = require('../models/Admin');
const sgMail = require('../config/sendgrid');
const axios = require('axios');
const NotificationController = require('./notificationController');
const Product = require('../models/Product');
const { createBuyerNotification, createNotification } = require('./notificationController');

// Initialize Terminal Africa API client
const terminalAPI = axios.create({
  baseURL: 'https://sandbox.terminal.africa/v1',
  headers: {
    Authorization: `Bearer ${process.env.TERMINAL_SECRET_KEY}`,
    'Content-Type': 'application/json'
  }
});

exports.createReturnRequest = async (req, res) => {
  try {
    const { orderId, items, description, preferredResolution } = req.body;
    const buyerId = req.user.id;

    console.log('Request Body:', {
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

    // Find the order
    const order = await Order.findById(orderId)
      .populate('seller', '_id email')
      .populate('items.product');

    console.log('Found Order:', {
      orderId: order?._id,
      sellerInfo: order?.seller,
      itemsCount: order?.items?.length
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
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

    // Upload evidence files to cloudinary
    console.log('Processing Evidence Files:', {
      filesCount: req.files?.length,
      fileTypes: req.files?.map(f => f.mimetype)
    });

    const evidencePromises = req.files.map(file => {
      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({
          resource_type: "auto",
          folder: "returns"
        }, (error, result) => {
          if (error) {
            console.log('Cloudinary Upload Error:', error);
            reject(error);
          } else {
            console.log('Cloudinary Upload Success:', {
              publicId: result.public_id,
              url: result.secure_url
            });
            resolve({
              type: file.mimetype.startsWith('image/') ? 'image' : 'video',
              url: result.secure_url,
              public_id: result.public_id,
            });
          }
        }).end(file.buffer);
      });
    });

    const evidence = await Promise.all(evidencePromises);
    console.log('Uploaded Evidence:', evidence);

    // Create return request
    console.log('Creating Return Request with items:', parsedItems);

    const returnRequest = new Return({
      order: orderId,
      buyer: buyerId,
      seller: order.seller._id,
      items: parsedItems.map(item => ({
        product: item.productId,
        quantity: item.quantity,
        reason: item.reason
      })),
      description,
      preferredResolution,
      evidence,
      status: 'PENDING_SELLER_REVIEW'
    });

    console.log('Return Request Object:', {
      orderId: returnRequest.order,
      buyerId: returnRequest.buyer,
      sellerId: returnRequest.seller,
      itemsCount: returnRequest.items?.length,
      evidenceCount: returnRequest.evidence?.length
    });

    await returnRequest.save();

    // Update the order's return status
    await Order.findByIdAndUpdate(orderId, {
      'orderStatus.hasReturn': true
    });

    // After successfully creating return request
    await createBuyerNotification(buyerId, 'return_created', {
      returnId: returnRequest._id,
      orderId: order._id,
      order_id: order.order_id,
      // items: parsedItems.map(item => ({
      //   productName: item.product.name,
      //   quantity: item.quantity
      // }))
    });

    // Notify seller about new return request
    await createNotification(order.seller._id, 'return_request', {
      returnId: returnRequest._id,
      orderId: order._id,
      order_id: order.order_id,
      buyerName: `${order.buyer.firstName} ${order.buyer.lastName}`
    });

    res.status(201).json({
      message: 'Return request created successfully',
      returnRequest
    });

  } catch (error) {
    console.error('Create return request error:', error);
    res.status(500).json({
      message: 'Failed to create return request',
      error: error.message
    });
  }
};

exports.getReturnDetails = async (req, res) => {
  try {
    const { returnId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const returnRequest = await Return.findById(returnId)
      .populate('order')
      .populate('buyer', 'firstName lastName email')
      .populate('seller', 'firstName lastName businessName email')
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
    console.error('Error fetching return details:', error);
    res.status(500).json({
      message: 'Failed to fetch return details',
      error: error.message
    });
  }
};

exports.getSellerReturns = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const sellerId = req.user.id;

    const query = { seller: sellerId };
    if (status) {
      query.status = status;
    }

    const returns = await Return.find(query)
      .populate('order', 'order_id createdAt total')
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
    console.error('Error fetching seller returns:', error);
    res.status(500).json({
      message: 'Failed to fetch returns',
      error: error.message
    });
  }
};

exports.respondToReturn = async (req, res) => {
  try {
    const { returnId } = req.params;
    const { action, message, partialRefundAmount } = req.body;
    const sellerId = req.user.id;

    console.log('Return Response Data:', {
      returnId,
      action,
      message,
      partialRefundAmount,
      sellerId
    });

    // Find and validate return request
    const returnRequest = await Return.findById(returnId)
      .populate('buyer', 'email')
      .populate('seller', 'email')
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
        // Generate shipping label only for approved returns
        try {
          const shippingLabel = await generateShippingLabel(returnRequest);
          returnRequest.returnShippingLabel = shippingLabel;
        } catch (error) {
          console.error('Error generating shipping label:', error);
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
      sellerName: returnRequest.seller.businessName || 'Seller'
    });

    res.json({
      message: 'Return response processed successfully',
      returnRequest
    });

  } catch (error) {
    console.error('Error responding to return:', error);
    res.status(500).json({
      message: 'Failed to process return response',
      error: error.message
    });
  }
};

// Helper function to generate shipping label
async function generateShippingLabel(returnRequest) {
  try {
    if (!returnRequest || !returnRequest.order) {
      throw new Error('Invalid return request or missing order information');
    }

    // For now, return a mock shipping label
    // TODO: Integrate with actual shipping provider
    return {
      url: `https://example.com/shipping-labels/${returnRequest._id}.pdf`,
      carrier: 'Mock Carrier',
      trackingNumber: `RT${Date.now()}`,
      generatedAt: new Date()
    };
  } catch (error) {
    console.error('Error generating shipping label:', error);
    throw error;
  }
}

exports.generateShippingLabel = async (req, res) => {
  try {
    const { returnId } = req.params;
    
    const returnRequest = await Return.findById(returnId)
      .populate('order')
      .populate('buyer', 'email')
      .populate('seller', 'email');

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

    const shippingLabel = await generateShippingLabel(returnRequest);
    
    // Update return request with shipping label
    returnRequest.returnShippingLabel = shippingLabel;
    await returnRequest.save();

    // Notify buyer about shipping label creation
    await createBuyerNotification(returnRequest.buyer._id, 'return_label_created', {
      returnId: returnId,
      orderId: returnRequest.order._id,
      order_id: returnRequest.order.order_id,
      trackingNumber: shippingLabel.trackingNumber,
      trackingUrl: shippingLabel.url
    });

    res.json({
      message: 'Shipping label generated successfully',
      shippingLabel
    });

  } catch (error) {
    console.error('Error generating shipping label:', error);
    res.status(500).json({
      message: 'Failed to generate shipping label',
      error: error.message
    });
  }
};

// Helper function for partial refund processing
async function processPartialRefund(returnRequest, amount) {
  // Implementation will depend on your payment processing system
  // This is a placeholder for the actual implementation
  try {
    // Process refund through payment gateway
    // Update order status
    // Record refund transaction
    return true;
  } catch (error) {
    throw new Error('Failed to process partial refund: ' + error.message);
  }
}

exports.getAllReturns = async (req, res) => {
  try {
    const { status, disputeStatus, page = 1, limit = 10 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (disputeStatus) query['dispute.status'] = disputeStatus;

    const returns = await Return.find(query)
      .populate('order', 'order_id createdAt total')
      .populate('buyer', 'firstName lastName email')
      .populate('seller', 'firstName lastName businessName email')
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
    console.error('Error fetching all returns:', error);
    res.status(500).json({
      message: 'Failed to fetch returns',
      error: error.message
    });
  }
};

exports.createDispute = async (req, res) => {
  try {
    const { returnId } = req.params;
    const { reason, description, evidence } = req.body;
    const userId = req.user.id;

    const returnRequest = await Return.findById(returnId)
      .populate('buyer')
      .populate('seller');

    if (!returnRequest) {
      return res.status(404).json({ message: 'Return request not found' });
    }

    // Verify user is involved in the return
    const isInvolved = [
      returnRequest.buyer._id.toString(),
      returnRequest.seller._id.toString()
    ].includes(userId);

    if (!isInvolved) {
      return res.status(403).json({ message: 'Not authorized to create dispute' });
    }

    // Update return with dispute information
    returnRequest.status = 'DISPUTED';
    returnRequest.dispute = {
      initiatedBy: userId,
      reason,
      description,
      evidence,
      status: 'PENDING',
      createdAt: new Date()
    };

    returnRequest.timeline.push({
      status: 'DISPUTED',
      note: `Dispute initiated: ${reason}`,
      updatedBy: userId === returnRequest.buyer._id.toString() ? 'buyer' : 'seller'
    });

    await returnRequest.save();

    // Notify admin and other party
    const otherParty = userId === returnRequest.buyer._id.toString() 
      ? returnRequest.seller 
      : returnRequest.buyer;

    await createNotification(otherParty._id, 'return_disputed', {
      returnId: returnRequest._id,
      reason
    });

    // Notify admin (implement your admin notification system)
    await notifyAdmins('new_return_dispute', {
      returnId: returnRequest._id,
      reason,
      buyerId: returnRequest.buyer._id,
      sellerId: returnRequest.seller._id
    });

    res.json({
      message: 'Dispute created successfully',
      returnRequest
    });

  } catch (error) {
    console.error('Error creating dispute:', error);
    res.status(500).json({
      message: 'Failed to create dispute',
      error: error.message
    });
  }
};

exports.resolveDispute = async (req, res) => {
  try {
    const { returnId } = req.params;
    const { resolution, action, refundAmount, note } = req.body;
    const adminId = req.user.id;

    const returnRequest = await Return.findById(returnId)
      .populate('buyer', 'email firstName lastName')
      .populate('seller', 'email firstName lastName businessName')
      .populate('order');

    if (!returnRequest) {
      return res.status(404).json({ message: 'Return request not found' });
    }

    // Update dispute resolution details
    returnRequest.dispute.status = 'RESOLVED';
    returnRequest.dispute.resolution = resolution;
    returnRequest.dispute.resolutionDetails = {
      decidedBy: adminId,
      decidedAt: new Date(),
      action,
      refundAmount,
      note
    };

    // Update return status based on resolution
    switch (action) {
      case 'FULL_REFUND':
      case 'PARTIAL_REFUND':
        returnRequest.status = 'REFUNDED';
        break;
      case 'REPLACEMENT_APPROVED':
        returnRequest.status = 'APPROVED';
        break;
      case 'NO_REFUND':
        returnRequest.status = 'REJECTED';
        break;
    }

    await returnRequest.save();

    // Send emails based on resolution
    const buyerEmail = {
      to: returnRequest.buyer.email,
      from: 'Auqli Returns <joseph@auqli.com>',
      subject: `Return Dispute Resolution - ${resolution === 'BUYER_FAVORED' ? 'Approved' : 'Rejected'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Return Dispute Resolution</h2>
          <p>Dear ${returnRequest.buyer.firstName},</p>
          <p>Your return dispute has been resolved.</p>
          <p><strong>Decision:</strong> ${resolution.replace('_', ' ')}</p>
          <p><strong>Action:</strong> ${action.replace('_', ' ')}</p>
          ${refundAmount ? `<p><strong>Refund Amount:</strong> $${refundAmount}</p>` : ''}
          <p><strong>Note:</strong> ${note}</p>
          <p>If you have any questions, please contact our support team.</p>
        </div>
      `
    };

    const sellerEmail = {
      to: returnRequest.seller.email,
      from: 'Auqli Returns <joseph@auqli.com>',
      subject: `Return Dispute Resolution - ${resolution === 'SELLER_FAVORED' ? 'In Your Favor' : 'Against'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Return Dispute Resolution</h2>
          <p>Dear ${returnRequest.seller.firstName},</p>
          <p>The return dispute has been resolved.</p>
          <p><strong>Decision:</strong> ${resolution.replace('_', ' ')}</p>
          <p><strong>Action:</strong> ${action.replace('_', ' ')}</p>
          ${refundAmount ? `<p><strong>Refund Amount:</strong> $${refundAmount}</p>` : ''}
          <p><strong>Note:</strong> ${note}</p>
          <p>If you have any questions, please contact our support team.</p>
        </div>
      `
    };

    await Promise.all([
      sgMail.send(buyerEmail),
      sgMail.send(sellerEmail)
    ]);

    res.json({
      message: 'Dispute resolved successfully',
      returnRequest
    });

  } catch (error) {
    console.error('Resolve dispute error:', error);
    res.status(500).json({
      message: 'Failed to resolve dispute',
      error: error.message
    });
  }
};

// Helper function to notify admins
async function notifyAdmins(type, data) {
  try {
    const admins = await Admin.find({});
    for (const admin of admins) {
      await createNotification(admin._id, type, data);
    }
  } catch (error) {
    console.error('Error notifying admins:', error);
  }
}

exports.confirmRefund = async (req, res) => {
  try {
    const { returnId } = req.params;
    const { refundAmount, refundMethod, transactionReference, notes } = req.body;
    const adminId = req.user.id;

    const returnRequest = await Return.findById(returnId)
      .populate('buyer', 'email firstName lastName')
      .populate('seller', 'email businessName')
      .populate('order', 'order_id total');

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
      note: `Refund processed: ${refundAmount} via ${refundMethod}`,
      updatedBy: 'admin'
    });

    await returnRequest.save();

    // Send email notifications
    await sendRefundConfirmationEmails(returnRequest);

    res.json({
      message: 'Refund confirmed successfully',
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
    console.error('Error getting return statistics:', error);
    res.status(500).json({
      message: 'Failed to get return statistics',
      error: error.message
    });
  }
};

// Email notification templates and sending function
async function sendRefundConfirmationEmails(returnRequest) {
  // Email to buyer
  const buyerEmail = {
    to: returnRequest.buyer.email,
    from: 'Joseph From Auqli <joseph@auqli.com>',
    subject: 'Refund Processed for Your Return',
    html: `
      <div style="background-color: #1a1a1a; color: #ffffff; padding: 30px; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto;">
          <img src="https://res.cloudinary.com/dljgzevaj/image/upload/v1733928675/Group_178_iqez5h.png" alt="Auqli Logo" style="width: 150px; margin-bottom: 30px;">
          
          <h1 style="color: #4CAF50; margin-bottom: 20px;">Refund Processed Successfully!</h1>
          
          <div style="background-color: #333333; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #4CAF50; margin-bottom: 15px;">Refund Details</h3>
            <p style="margin: 5px 0;">Order ID: ${returnRequest.order.order_id}</p>
            <p style="margin: 5px 0;">Refund Amount: ${returnRequest.refundDetails.amount}</p>
            <p style="margin: 5px 0;">Method: ${returnRequest.refundDetails.method}</p>
            <p style="margin: 5px 0;">Date: ${new Date(returnRequest.refundDetails.processedAt).toLocaleDateString()}</p>
          </div>

          <p style="font-size: 16px; line-height: 1.5;">Your refund has been processed and should be reflected in your account within 3-5 business days.</p>
          
          <div style="margin: 30px 0;">
            <p style="font-size: 14px; color: #999999;">If you have any questions about your refund, please don't hesitate to contact our support team.</p>
          </div>

          <hr style="border: 1px solid #333333; margin: 30px 0;">
          <p style="font-size: 12px; color: #999999; text-align: center;">© ${new Date().getFullYear()} Auqli. All rights reserved.</p>
        </div>
      </div>
    `
  };

  // Email to seller
  const sellerEmail = {
    to: returnRequest.seller.email,
    from: 'Joseph From Auqli <joseph@auqli.com>',
    subject: 'Return Refund Processed',
    html: `
      <div style="background-color: #1a1a1a; color: #ffffff; padding: 30px; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto;">
          <img src="https://res.cloudinary.com/dljgzevaj/image/upload/v1733928675/Group_178_iqez5h.png" alt="Auqli Logo" style="width: 150px; margin-bottom: 30px;">
          
          <h1 style="color: #4CAF50; margin-bottom: 20px;">Return Refund Processed</h1>
          
          <div style="background-color: #333333; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #4CAF50; margin-bottom: 15px;">Transaction Details</h3>
            <p style="margin: 5px 0;">Order ID: ${returnRequest.order.order_id}</p>
            <p style="margin: 5px 0;">Refund Amount: ${returnRequest.refundDetails.amount}</p>
            <p style="margin: 5px 0;">Date: ${new Date(returnRequest.refundDetails.processedAt).toLocaleDateString()}</p>
          </div>

          <p style="font-size: 16px; line-height: 1.5;">The refund for the return request has been processed. This amount will be deducted from your next settlement.</p>
          
          <div style="margin: 30px 0;">
            <p style="font-size: 14px; color: #999999;">Please review your seller dashboard for more details about this transaction.</p>
          </div>

          <hr style="border: 1px solid #333333; margin: 30px 0;">
          <p style="font-size: 12px; color: #999999; text-align: center;">© ${new Date().getFullYear()} Auqli. All rights reserved.</p>
        </div>
      </div>
    `
  };

  try {
    await sgMail.send(buyerEmail);
    await sgMail.send(sellerEmail);
  } catch (error) {
    console.error('Error sending refund confirmation emails:', error);
    // Don't throw error, just log it
  }
}

exports.createReturnShippingLabel = async (req, res) => {
  try {
    const { returnId } = req.params;
    const { pickup_address } = req.body;

    // Validate required pickup address fields
    const requiredFields = ['first_name', 'last_name', 'email', 'phone', 'line1', 'city', 'state', 'country', 'zip'];
    const missingFields = requiredFields.filter(field => !pickup_address[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing required pickup address fields: ${missingFields.join(', ')}`
      });
    }

    // Find return request and validate
    const returnRequest = await Return.findById(returnId)
      .populate('order')
      .populate({
        path: 'items.product',
        select: 'name weight price'
      })
      .populate('seller', 'email firstName lastName businessName phoneNumber');

    if (!returnRequest) {
      return res.status(404).json({ message: 'Return request not found' });
    }

    // Verify seller ownership
    if (returnRequest.seller._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to create shipping label for this return' });
    }

    // Format items array according to Terminal Africa's requirements
    const items = returnRequest.items.map(item => ({
      name: item.product.name,
      quantity: item.quantity,
      weight: item.product.weight || 0.5,
      weight_unit: 'kg',
      description: item.product.name,
      value: item.product.price,
      currency: 'NGN',
      sku: item.product._id.toString()
    }));

    // Calculate total weight and value
    const totalWeight = items.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
    const totalValue = items.reduce((sum, item) => sum + (item.value * item.quantity), 0);

    // Clean up addresses to match Terminal Africa format
    const cleanPickupAddress = {
      first_name: pickup_address.first_name,
      last_name: pickup_address.last_name,
      email: pickup_address.email,
      phone: pickup_address.phone,
      line1: pickup_address.line1,
      line2: pickup_address.line2 || '',
      city: pickup_address.city,
      state: pickup_address.state,
      country: pickup_address.country || 'NG',
      zip: pickup_address.zip
    };

    // Ensure seller phone number is available
    if (!returnRequest.seller.phoneNumber) {
      return res.status(400).json({
        message: 'Seller phone number is required for delivery address'
      });
    }

    const cleanDeliveryAddress = {
      first_name: returnRequest.seller.firstName,
      last_name: returnRequest.seller.lastName,
      email: returnRequest.seller.email,
      phone: returnRequest.seller.phoneNumber,
      line1: returnRequest.order.pickup_address.line1,
      line2: returnRequest.order.pickup_address.line2 || '',
      city: returnRequest.order.pickup_address.city,
      state: returnRequest.order.pickup_address.state,
      country: returnRequest.order.pickup_address.country || 'NG',
      zip: returnRequest.order.pickup_address.zip
    };

    // Prepare shipping data for Terminal Africa
    const shippingData = {
      pickup_address: cleanPickupAddress,
      delivery_address: cleanDeliveryAddress,
      parcel: {
        weight: totalWeight,
        weight_unit: 'kg',
        description: `Return for order #${returnRequest.order.order_id}`,
        items: items,
        value: totalValue,
        currency: 'NGN'
      },
      shipment_purpose: 'return',
      metadata: {
        return_id: returnId,
        order_id: returnRequest.order.order_id
      }
    };

    // Log request data
    console.log('Terminal Africa Request Data:', JSON.stringify(shippingData, null, 2));

    // Create shipment with Terminal Africa
    const shipmentResponse = await terminalAPI.post('/shipments/quick', shippingData);

    // Log response data
    console.log('Terminal Africa Response:', JSON.stringify(shipmentResponse.data, null, 2));

    if (!shipmentResponse.data.status) {
      throw new Error(shipmentResponse.data.message || 'Failed to create return shipment');
    }

    const shipmentData = shipmentResponse.data.data;

    // Update return request with shipping information
    const shippingUpdate = {
      status: 'RETURN_LABEL_CREATED',
      'returnShipment.shipment_id': shipmentData.shipment_id,
      'returnShipment.rate_id': shipmentData.rate_id,
      'returnShipment.tracking': {
        number: shipmentData.tracking_number,
        url: shipmentData.tracking_url,
        status: 'pending',
        lastUpdate: new Date(),
        history: [{
          status: 'pending',
          timestamp: new Date(),
          description: 'Return shipping label created'
        }]
      },
      'returnShipment.documents': {
        shippingLabel: shipmentData.shipping_label_url,
        commercialInvoice: shipmentData.commercial_invoice_url
      },
      'returnShipment.carrier': {
        name: shipmentData.carrier_name,
        reference: shipmentData.carrier_reference
      },
      'returnShipment.fee': {
        amount: shipmentData.shipment_cost,
        currency: 'NGN'
      },
      'returnShipment.pickup_address': cleanPickupAddress,
      'returnShipment.delivery_address': cleanDeliveryAddress,
      'returnShipment.parcel': {
        weight: totalWeight,
        weight_unit: 'kg',
        items: items
      },
      'returnShipment.created_at': new Date()
    };

    const updatedReturn = await Return.findByIdAndUpdate(
      returnId,
      { 
        $set: shippingUpdate,
        $push: {
          timeline: {
            status: 'RETURN_LABEL_CREATED',
            date: new Date(),
            note: `Return shipping label created with tracking number ${shipmentData.tracking_number}`,
            updatedBy: 'seller'
          }
        }
      },
      { new: true }
    );

    // Notify buyer about shipping label creation
    await createBuyerNotification(updatedReturn.buyer, 'return_label_created', {
      returnId: returnId,
      orderId: updatedReturn.order._id,
      order_id: updatedReturn.order.order_id,
      trackingNumber: shipmentData.tracking_number,
      trackingUrl: shipmentData.tracking_url
    });

    res.json({
      message: 'Return shipping label created successfully',
      data: shipmentData
    });

  } catch (error) {
    console.error('Error creating return shipping label:', error);
    console.error('Error details:', error.response?.data);
    res.status(500).json({
      message: 'Failed to create return shipping label',
      error: error.response?.data?.message || error.message
    });
  }
};

// Get shipping rates for return
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

    // Verify shipment_id exists
    if (!returnRequest.returnShipment?.shipment_id) {
      return res.status(400).json({ message: 'No shipment created for this return yet' });
    }

    // Get shipping rates from Terminal Africa using the correct endpoint
    const ratesResponse = await terminalAPI.get('/rates/shipment', {
      params: {
        shipment_id: returnRequest.returnShipment.shipment_id,
        currency: 'NGN'
      }
    });

    if (!ratesResponse.data.status) {
      throw new Error(ratesResponse.data.message || 'Failed to get shipping rates');
    }

    res.json({
      message: 'Shipping rates retrieved successfully',
      rates: ratesResponse.data.data,
      pageData: ratesResponse.data.pageData
    });

  } catch (error) {
    console.error('Error getting return shipping rates:', error);
    console.error('Error details:', error.response?.data);
    res.status(500).json({
      message: 'Failed to get shipping rates',
      error: error.response?.data?.message || error.message
    });
  }
};

// Select shipping rate for return
exports.selectReturnShippingRate = async (req, res) => {
  try {
    const { returnId } = req.params;
    const { rate_id, carrier_name, amount } = req.body;

    const returnRequest = await Return.findById(returnId)
      .populate('order')
      .populate('seller');

    if (!returnRequest) {
      return res.status(404).json({ message: 'Return request not found' });
    }

    // Verify seller ownership
    if (returnRequest.seller._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to select rate for this return' });
    }

    // Verify shipment_id exists
    if (!returnRequest.returnShipment?.shipment_id) {
      return res.status(400).json({ message: 'No shipment created for this return yet' });
    }

    // // Select rate with Terminal Africa
    // const selectRateResponse = await terminalAPI.post(`/rates/select`, {
    //   rate_id,
    //   shipment_id: returnRequest.returnShipment.shipment_id
    // });

    // // if (!selectRateResponse.data.status) {
    // //   throw new Error(selectRateResponse.data.message || 'Failed to select shipping rate');
    // // }

    // Update return request with selected rate information
    const rateUpdate = {
      'returnShipment.rate_id': rate_id,
      'returnShipment.carrier.name': carrier_name,
      'returnShipment.fee.amount': amount,
      'returnShipment.fee.currency': 'NGN',
      'returnShipment.status': 'RATE_SELECTED',
      'returnShipment.paid': true,
      status: 'RETURN_SHIPPING_ARRANGED'
    };

    // Add to timeline
    const timelineUpdate = {
      $push: {
        timeline: {
          status: 'RETURN_SHIPPING_ARRANGED',
          date: new Date(),
          note: `Return shipping rate selected with ${carrier_name}. Amount: NGN ${amount}`,
          updatedBy: 'seller'
        }
      }
    };

    const updatedReturn = await Return.findByIdAndUpdate(
      returnId,
      { 
        $set: rateUpdate,
        ...timelineUpdate
      },
      { new: true }
    );

    // Send notification to buyer
    await NotificationController.createNotification(returnRequest.buyer, 'return_shipping_arranged', {
      returnId: returnRequest._id,
      orderId: returnRequest.order._id,
      carrier: carrier_name,
      amount: amount
    });

    res.json({
      message: 'Shipping rate selected successfully',
      data: {
        shipment_id: returnRequest.returnShipment.shipment_id,
        rate_id: rate_id,
        carrier: {
          name: carrier_name
        },
        fee: {
          amount: amount,
          currency: 'NGN'
        },
        status: 'RATE_SELECTED'
      }
    });

  } catch (error) {
    console.error('Error selecting return shipping rate:', error);
    console.error('Error details:', error.response?.data);
    res.status(500).json({
      message: 'Failed to select shipping rate',
      error: error.response?.data?.message || error.message
    });
  }
};

// Arrange pickup for return
exports.arrangeReturnPickup = async (req, res) => {
  try {
    const { returnId } = req.params;

    const returnRequest = await Return.findById(returnId);
    if (!returnRequest) {
      return res.status(404).json({ message: 'Return request not found' });
    }

    // Verify shipment_id and rate_id exist
    if (!returnRequest.returnShipment?.shipment_id || !returnRequest.returnShipment?.rate_id) {
      return res.status(400).json({ 
        message: 'Cannot arrange pickup. Missing shipment_id or rate_id. Please create shipment and select rate first.' 
      });
    }

    // Arrange pickup with Terminal Africa
    const pickupResponse = await terminalAPI.post('/shipments/pickup', {
      shipment_id: returnRequest.returnShipment.shipment_id,
      rate_id: returnRequest.returnShipment.rate_id,
      purchase_insurance: false
    });

    if (!pickupResponse.data.status) {
      throw new Error(pickupResponse.data.message || 'Failed to arrange pickup');
    }

    // Extract important data from response
    const responseData = pickupResponse.data.data;
    const shipmentPayload = responseData.metadata.shipment_payload;
    const carrierShipment = responseData.metadata.carrier_shipment;

    // Safely parse the planned shipping date
    let plannedShippingDate = null;
    try {
      if (carrierShipment?.plannedShippingDateAndTime) {
        plannedShippingDate = new Date(carrierShipment.plannedShippingDateAndTime);
        // Validate the parsed date
        if (isNaN(plannedShippingDate.getTime())) {
          plannedShippingDate = null;
        }
      }
    } catch (error) {
      console.warn('Failed to parse planned shipping date:', error);
      plannedShippingDate = null;
    }

    // Prepare the update object
    const pickupUpdate = {
      'returnShipment.shipment_reference': responseData._id,
      'returnShipment.tracking.number': shipmentPayload.shipmentTrackingNumber,
      'returnShipment.tracking.url': shipmentPayload.trackingUrl,
      'returnShipment.tracking.package_number': shipmentPayload.packages[0]?.trackingNumber,
      'returnShipment.tracking.package_url': shipmentPayload.packages[0]?.trackingUrl,
      'returnShipment.tracking.status': 'pickup_arranged',
      'returnShipment.tracking.lastUpdate': new Date(),
      'returnShipment.documents.shippingLabel': shipmentPayload.documents.find(d => d.typeCode === 'label')?.url,
      'returnShipment.pickup_details': {
        instructions: carrierShipment.pickup.specialInstructions?.map(i => i.value) || [],
        contact: {
          email: carrierShipment.pickup.pickupDetails.contactInformation.email,
          phone: carrierShipment.pickup.pickupDetails.contactInformation.phone,
          company: carrierShipment.pickup.pickupDetails.contactInformation.companyName,
          name: carrierShipment.pickup.pickupDetails.contactInformation.fullName
        }
      },
      'returnShipment.delivery_details': {
        contact: {
          company: shipmentPayload.shipmentDetails[0]?.customerDetails.receiverDetails.contactInformation.companyName,
          name: shipmentPayload.shipmentDetails[0]?.customerDetails.receiverDetails.contactInformation.fullName
        },
        address: {
          postal_code: shipmentPayload.shipmentDetails[0]?.customerDetails.receiverDetails.postalAddress.postalCode,
          city: shipmentPayload.shipmentDetails[0]?.customerDetails.receiverDetails.postalAddress.cityName,
          country_code: shipmentPayload.shipmentDetails[0]?.customerDetails.receiverDetails.postalAddress.countryCode,
          line1: shipmentPayload.shipmentDetails[0]?.customerDetails.receiverDetails.postalAddress.addressLine1,
          line2: shipmentPayload.shipmentDetails[0]?.customerDetails.receiverDetails.postalAddress.addressLine2
        }
      }
    };

    // Only add planned shipping date if it's valid
    if (plannedShippingDate) {
      pickupUpdate['returnShipment.planned_shipping_date'] = plannedShippingDate;
    }

    // Add tracking history
    const timelineUpdate = {
      $push: {
        'returnShipment.tracking.history': {
          status: 'pickup_arranged',
          timestamp: new Date(),
          description: 'Return pickup has been arranged',
          location: shipmentPayload.shipmentDetails[0]?.customerDetails.shipperDetails.postalAddress.cityName
        }
      }
    };

    const updatedReturn = await Return.findByIdAndUpdate(
      returnId,
      { 
        $set: pickupUpdate,
        ...timelineUpdate
      },
      { new: true }
    );

    // Notify buyer
    await createBuyerNotification(returnRequest.buyer, 'return_pickup_arranged', {
      returnId: returnRequest._id,
      orderId: returnRequest.order,
      order_id: returnRequest.order.order_id,
      tracking_number: shipmentPayload.shipmentTrackingNumber,
      pickupDate: plannedShippingDate,
      carrier: returnRequest.returnShipment.carrier.name
    });

    res.json({
      message: 'Return pickup arranged successfully',
      data: {
        tracking_number: shipmentPayload.shipmentTrackingNumber,
        tracking_url: shipmentPayload.trackingUrl,
        shipping_label: pickupUpdate['returnShipment.documents.shippingLabel'],
        planned_shipping_date: plannedShippingDate
      }
    });

  } catch (error) {
    console.error('Error arranging return pickup:', error);
    res.status(500).json({
      message: 'Failed to arrange pickup',
      error: error.message
    });
  }
};

// Get shipping rates for replacement
exports.getReplacementShippingRates = async (req, res) => {
  try {
    const { returnId } = req.params;
    const returnRequest = await Return.findById(returnId)
      .populate('order')
      .populate('replacementProduct.product');

    if (!returnRequest) {
      return res.status(404).json({ message: 'Return request not found' });
    }

    // Get rates for return pickup (from buyer to seller)
    const returnRates = await getShippingRates({
      origin: returnRequest.order.delivery_address,
      destination: returnRequest.order.pickup_address,
      weight: returnRequest.order.items[0].product.weight,
      dimensions: returnRequest.order.items[0].product.dimensions
    });

    // Get rates for replacement delivery (from seller to buyer)
    const replacementRates = await getShippingRates({
      origin: returnRequest.order.pickup_address,
      destination: returnRequest.order.delivery_address,
      weight: returnRequest.order.items[0].product.weight,
      dimensions: returnRequest.order.items[0].product.dimensions
    });

    res.json({
      returnRates: returnRates.data.data.rates,
      replacementRates: replacementRates.data.data.rates
    });

  } catch (error) {
    console.error('Get replacement shipping rates error:', error);
    res.status(500).json({
      message: 'Failed to get shipping rates',
      error: error.message
    });
  }
};

// Create shipping labels for replacement
exports.createReplacementShippingLabels = async (req, res) => {
  try {
    const { returnId } = req.params;
    const { returnRateId, replacementRateId, replacementProductId, variant, specifications } = req.body;

    const returnRequest = await Return.findById(returnId)
      .populate('order');

    if (!returnRequest) {
      return res.status(404).json({ message: 'Return request not found' });
    }

    // Verify replacement product
    const replacementProduct = await Product.findById(replacementProductId);
    if (!replacementProduct) {
      return res.status(404).json({ message: 'Replacement product not found' });
    }

    // Create return shipment label
    const returnShipment = await createShipment({
      rate_id: returnRateId,
      pickup_address: returnRequest.order.delivery_address,
      delivery_address: returnRequest.order.pickup_address,
      parcel: {
        weight: returnRequest.order.items[0].product.weight,
        dimensions: returnRequest.order.items[0].product.dimensions
      }
    });

    // Create replacement shipment label
    const replacementShipment = await createShipment({
      rate_id: replacementRateId,
      pickup_address: returnRequest.order.pickup_address,
      delivery_address: returnRequest.order.delivery_address,
      parcel: {
        weight: replacementProduct.weight,
        dimensions: replacementProduct.dimensions
      }
    });

    // Update return request
    returnRequest.returnShipment = {
      shipment_id: returnShipment.data.data.id,
      rate_id: returnRateId,
      status: 'RATE_SELECTED',
      tracking: {
        number: returnShipment.data.data.extras.tracking_number,
        url: returnShipment.data.data.extras.tracking_url
      }
    };

    returnRequest.replacementShipment = {
      shipment_id: replacementShipment.data.data.id,
      rate_id: replacementRateId,
      status: 'RATE_SELECTED',
      tracking: {
        number: replacementShipment.data.data.extras.tracking_number,
        url: replacementShipment.data.data.extras.tracking_url
      }
    };

    returnRequest.replacementProduct = {
      product: replacementProductId,
      variant,
      specifications
    };

    await returnRequest.save();

    res.json({
      message: 'Shipping labels created successfully',
      returnShipment: returnRequest.returnShipment,
      replacementShipment: returnRequest.replacementShipment,
      documents: {
        return: {
          shippingLabel: returnShipment.data.data.extras.shipping_label_url,
          commercialInvoice: returnShipment.data.data.extras.commercial_invoice_url
        },
        replacement: {
          shippingLabel: replacementShipment.data.data.extras.shipping_label_url,
          commercialInvoice: replacementShipment.data.data.extras.commercial_invoice_url
        }
      }
    });

  } catch (error) {
    console.error('Create replacement shipping labels error:', error);
    res.status(500).json({
      message: 'Failed to create shipping labels',
      error: error.message
    });
  }
};

// Arrange pickup for replacement
exports.arrangeReplacementPickup = async (req, res) => {
  try {
    const { returnId } = req.params;
    const { purchase_insurance = false } = req.body;

    const returnRequest = await Return.findById(returnId);
    if (!returnRequest) {
      return res.status(404).json({ message: 'Return request not found' });
    }

    // Arrange pickup for return shipment
    const returnPickup = await arrangePickup({
      shipment_id: returnRequest.returnShipment.shipment_id,
      purchase_insurance
    });

    // Arrange pickup for replacement shipment
    const replacementPickup = await arrangePickup({
      shipment_id: returnRequest.replacementShipment.shipment_id,
      purchase_insurance
    });

    // Update return request
    returnRequest.returnShipment.status = 'PICKUP_ARRANGED';
    returnRequest.replacementShipment.status = 'PICKUP_ARRANGED';
    await returnRequest.save();

    res.json({
      message: 'Pickups arranged successfully',
      returnShipment: {
        tracking: returnPickup.data.data.tracking,
        status: 'PICKUP_ARRANGED'
      },
      replacementShipment: {
        tracking: replacementPickup.data.data.tracking,
        status: 'PICKUP_ARRANGED'
      }
    });

  } catch (error) {
    console.error('Arrange replacement pickup error:', error);
    res.status(500).json({
      message: 'Failed to arrange pickups',
      error: error.message
    });
  }
};

exports.rejectReturnRequest = async (req, res) => {
  try {
    const { returnId } = req.params;
    const { reason, description } = req.body;
    const sellerId = req.user.id;

    // Validate required fields
    if (!reason || !description || !req.files?.length) {
      return res.status(400).json({
        message: 'Reason, description, and evidence files are required',
        error: 'Missing required fields'
      });
    }

    // Find the return request
    const returnRequest = await Return.findById(returnId)
      .populate('buyer', 'email firstName lastName')
      .populate('seller', 'email firstName lastName businessName')
      .populate('order');

    if (!returnRequest) {
      return res.status(404).json({ message: 'Return request not found' });
    }

    // Verify seller ownership
    if (returnRequest.seller._id.toString() !== sellerId) {
      return res.status(403).json({ message: 'Unauthorized to reject this return request' });
    }

    // Upload evidence files to cloudinary
    const evidencePromises = req.files.map(file => {
      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({
          resource_type: "auto",
          folder: "returns/rejections"
        }, (error, result) => {
          if (error) {
            console.log('Cloudinary Upload Error:', error);
            reject(error);
          } else {
            resolve({
              type: file.mimetype.startsWith('image/') ? 'image' : 'video',
              url: result.secure_url,
              public_id: result.public_id,
            });
          }
        }).end(file.buffer);
      });
    });

    const evidence = await Promise.all(evidencePromises);

    // Update return request with rejection details
    returnRequest.status = 'REJECTED';
    returnRequest.rejectionDetails = {
      reason,
      description,
      evidence,
      rejectedAt: new Date(),
      rejectedBy: sellerId
    };
    returnRequest.dispute = {
      isDisputed: true,
      status: 'PENDING',
      createdAt: new Date()
    };

    await returnRequest.save();

    // Send email to buyer
    const buyerEmail = {
      to: returnRequest.buyer.email,
      from: 'Auqli Returns <joseph@auqli.com>',
      subject: 'Return Request Rejected - Dispute Created',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Return Request Rejected</h2>
          <p>Dear ${returnRequest.buyer.firstName},</p>
          <p>Your return request for order #${returnRequest.order.order_id} has been rejected by the seller.</p>
          <p><strong>Rejection Reason:</strong> ${reason}</p>
          <p><strong>Seller's Explanation:</strong> ${description}</p>
          <p>A dispute has been automatically created and our admin team will review the case.</p>
          <p>We will contact you soon with further information about the dispute resolution process.</p>
          <p>Best regards,<br>The Auqli Team</p>
        </div>
      `
    };

    // Send email to seller
    const sellerEmail = {
      to: returnRequest.seller.email,
      from: 'Auqli Returns <joseph@auqli.com>',
      subject: 'Return Request Rejection Confirmed',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Return Request Rejection Confirmed</h2>
          <p>Dear ${returnRequest.seller.firstName},</p>
          <p>You have rejected the return request for order #${returnRequest.order.order_id}.</p>
          <p><strong>Your Rejection Reason:</strong> ${reason}</p>
          <p><strong>Your Explanation:</strong> ${description}</p>
          <p>A dispute has been created and our admin team will review the case.</p>
          <p>We will contact you if any additional information is needed.</p>
          <p>Best regards,<br>The Auqli Team</p>
        </div>
      `
    };

    // Send email to admin
    const adminEmail = {
      to: 'joseph@auqli.com',
      from: 'Auqli Returns <joseph@auqli.com>',
      subject: 'New Return Dispute Created',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New Return Dispute Requires Review</h2>
          <p>A new return dispute has been created:</p>
          <p><strong>Order ID:</strong> ${returnRequest.order.order_id}</p>
          <p><strong>Buyer:</strong> ${returnRequest.buyer.firstName} ${returnRequest.buyer.lastName}</p>
          <p><strong>Seller:</strong> ${returnRequest.seller.businessName || returnRequest.seller.firstName}</p>
          <p><strong>Rejection Reason:</strong> ${reason}</p>
          <p><strong>Seller's Explanation:</strong> ${description}</p>
          <p><strong>Evidence Files:</strong></p>
          <ul>
            ${evidence.map(e => `<li><a href="${e.url}">View ${e.type}</a></li>`).join('')}
          </ul>
          <p>Please review this case in the admin dashboard.</p>
        </div>
      `
    };

    // Send all emails
    await Promise.all([
      sgMail.send(buyerEmail),
      sgMail.send(sellerEmail),
      sgMail.send(adminEmail)
    ]);

    // Create notifications
    await Promise.all([
      createNotification(returnRequest.buyer._id, 'return_rejected', {
        orderId: returnRequest.order._id,
        returnId: returnRequest._id,
        reason
      }),
      createNotification(returnRequest.seller._id, 'return_rejection_confirmed', {
        orderId: returnRequest.order._id,
        returnId: returnRequest._id
      })
    ]);

    res.json({
      message: 'Return request rejected and dispute created successfully',
      returnRequest
    });

  } catch (error) {
    console.error('Reject return request error:', error);
    res.status(500).json({
      message: 'Failed to reject return request',
      error: error.message
    });
  }
};

exports.adminUpdateStatus = async (req, res) => {
  try {
    const { returnId } = req.params;
    const { status, note } = req.body;
    const adminId = req.user.id;

    const returnRequest = await Return.findById(returnId)
      .populate('buyer', 'email firstName lastName')
      .populate('seller', 'email firstName lastName businessName');

    if (!returnRequest) {
      return res.status(404).json({ message: 'Return request not found' });
    }

    returnRequest.status = status;
    returnRequest.timeline.push({
      status,
      note,
      updatedBy: 'admin',
      updatedAt: new Date()
    });

    await returnRequest.save();

    // Notify both parties
    const emailTemplate = {
      subject: `Return Request Status Updated - ${status}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Return Request Status Update</h2>
          <p>The status of your return request has been updated by our admin team.</p>
          <p><strong>New Status:</strong> ${status}</p>
          <p><strong>Admin Note:</strong> ${note}</p>
          <p>If you have any questions, please contact our support team.</p>
        </div>
      `
    };

    await Promise.all([
      sgMail.send({
        ...emailTemplate,
        to: returnRequest.buyer.email,
        from: 'Auqli Returns <joseph@auqli.com>'
      }),
      sgMail.send({
        ...emailTemplate,
        to: returnRequest.seller.email,
        from: 'Auqli Returns <joseph@auqli.com>'
      })
    ]);

    res.json({
      message: 'Return status updated successfully',
      returnRequest
    });

  } catch (error) {
    console.error('Admin update status error:', error);
    res.status(500).json({
      message: 'Failed to update return status',
      error: error.message
    });
  }
};

exports.addAdminNote = async (req, res) => {
  try {
    const { returnId } = req.params;
    const { note } = req.body;
    const adminId = req.user.id;

    const returnRequest = await Return.findById(returnId);
    if (!returnRequest) {
      return res.status(404).json({ message: 'Return request not found' });
    }

    returnRequest.dispute.adminNotes.push({
      note,
      addedBy: adminId,
      addedAt: new Date()
    });

    await returnRequest.save();

    res.json({
      message: 'Admin note added successfully',
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

exports.getBuyerReturns = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const buyerId = req.user.id;

    const query = { buyer: buyerId };
    if (status) {
      query.status = status;
    }

    const returns = await Return.find(query)
      .populate('order', 'order_id createdAt total')
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
    console.error('Error fetching buyer returns:', error);
    res.status(500).json({
      message: 'Failed to fetch returns',
      error: error.message
    });
  }
}; 