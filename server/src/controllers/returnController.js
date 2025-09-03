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
const Buyer = require('../models/Buyer');

// Initialize Fez API configuration
const FEZ_API_URL = process.env.FEZ_API_URL;
const FEZ_BEARER_TOKEN = process.env.FEZ_BEARER_TOKEN;
const FEZ_SECRET_KEY = process.env.FEZ_SECRET_KEY;

// Function to get Fez authentication token
const getFezAuthToken = async () => {
  try {
    
    
    const authUrl = `${process.env.FEZ_API_URL}/user/authenticate`;
    const authData = {
      user_id: process.env.FEZ_USER_ID,
      password: process.env.FEZ_PASSWORD
    };
    
    // console.log(`📤 Auth request to: ${authUrl}`);
    
    const response = await axios.post(authUrl, authData);
    
    console.log(`📥 Auth response status: ${response.status}`);
    
    if (response.data && response.data.status === 'Success' && response.data.authDetails) {
      console.log(`✅ Authentication successful! Token: ${response.data.authDetails.authToken.substring(0, 10)}... (expires: ${response.data.authDetails.expireToken})`);
      return response.data.authDetails.authToken;
    } else {
      console.error('❌ Authentication failed:', response.data);
      throw new Error('Failed to authenticate with Fez Delivery API');
    }
  } catch (error) {
    console.error('❌ Error authenticating with Fez Delivery API:', error.message);
    throw error;
  }
};

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
    if (returnRequest && returnRequest.buyer) {
      try {
        await createBuyerNotification(returnRequest.buyer, 'return_label_created', {
          returnId: returnId,
          orderId: returnRequest.order._id,
          order_id: returnRequest.order.order_id,
          trackingNumber: shippingLabel.trackingNumber,
          trackingUrl: shippingLabel.url
        });
      } catch (notificationError) {
        console.error('Error sending notification to buyer:', notificationError);
        // Continue execution despite notification error
      }
    }

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
      from: 'Auqli Returns <support@auqli.com>',
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
      from: 'Auqli Returns <support@auqli.com>',
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
  try {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    // Email to buyer
    const buyerEmail = {
      to: returnRequest.buyer.email,
      from: {
        email: 'support@auqli.com',
        name: 'Auqli Returns'
      },
      subject: 'Your Refund Has Been Processed',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Refund Processed Successfully</h2>
          <p>Dear ${returnRequest.buyer.firstName},</p>
          <p>Good news! Your refund for return request #${returnRequest._id} has been processed.</p>
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

    await sgMail.send(buyerEmail);
    console.log('Refund confirmation email sent to buyer');

  } catch (error) {
    console.error('Error sending refund confirmation emails:', error);
    // Don't throw error, just log it
  }
}

exports.createReturnShippingLabel = async (req, res) => {
  try {
    const { returnId } = req.params;
    let { pickup_address } = req.body;

    // Find return request and validate first to get order details if needed
    const returnRequest = await Return.findById(returnId)
      .populate('order')
      .populate({
        path: 'items.product',
        select: 'name weight price'
      })
      .populate('seller', 'email firstName lastName businessName phoneNumber address state')
      .populate('buyer', 'firstName lastName email phoneNumber shippingAddresses');

    if (!returnRequest) {
      return res.status(404).json({ message: 'Return request not found' });
    }

    // Verify seller ownership
    if (returnRequest.seller._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to create shipping label for this return' });
    }

    // If pickup_address is not provided, try to use buyer's shipping addresses or order delivery address
    let buyerSavedAddress = null;
    
    // Store buyer's saved address for potential use regardless of whether pickup_address was provided
    if (returnRequest.buyer?.shippingAddresses && returnRequest.buyer.shippingAddresses.length > 0) {
      buyerSavedAddress = returnRequest.buyer.shippingAddresses[0];
      console.log('Found buyer saved address for reference:', JSON.stringify(buyerSavedAddress));
    }
    
    if (!pickup_address) {
      console.log('No pickup_address provided in request, looking for alternatives...');
      
      // Check if buyer has saved shipping addresses
      if (buyerSavedAddress) {
        console.log('Buyer has saved shipping addresses:', JSON.stringify(returnRequest.buyer.shippingAddresses));
        
        // Use the first shipping address (could be enhanced to use default address if marked)
        console.log('Using buyer\'s first saved shipping address:', JSON.stringify(buyerSavedAddress));
        
        pickup_address = {
          first_name: returnRequest.buyer.firstName || '',
          last_name: returnRequest.buyer.lastName || '',
          email: returnRequest.buyer.email || '',
          phone: returnRequest.buyer.phoneNumber || '',
          line1: buyerSavedAddress.addressLine1 || '',
          line2: buyerSavedAddress.addressLine2 || '',
          city: buyerSavedAddress.city || '',
          state: buyerSavedAddress.state || '',
          country: buyerSavedAddress.country || 'NG',
          zip: buyerSavedAddress.zipCode || ''
        };
        
        console.log('Created pickup address from buyer\'s saved address:', pickup_address);
      } 
      // Fallback to order delivery address if no shipping addresses in buyer model
      else if (returnRequest.order.delivery_address) {
        console.log('No saved addresses in buyer model, using delivery address from order:', 
          JSON.stringify(returnRequest.order.delivery_address));
        console.log('Buyer info:', JSON.stringify({
          firstName: returnRequest.buyer?.firstName,
          lastName: returnRequest.buyer?.lastName,
          email: returnRequest.buyer?.email,
          phoneNumber: returnRequest.buyer?.phoneNumber
        }));
        
        pickup_address = {
          first_name: returnRequest.buyer?.firstName || returnRequest.order.delivery_address.first_name || '',
          last_name: returnRequest.buyer?.lastName || returnRequest.order.delivery_address.last_name || '',
          email: returnRequest.buyer?.email || returnRequest.order.delivery_address.email || '',
          phone: returnRequest.buyer?.phoneNumber || returnRequest.order.delivery_address.phone || '',
          line1: returnRequest.order.delivery_address.line1 || '',
          line2: returnRequest.order.delivery_address.line2 || '',
          city: returnRequest.order.delivery_address.city || '',
          state: returnRequest.order.delivery_address.state || '',
          country: returnRequest.order.delivery_address.country || '',
          zip: returnRequest.order.delivery_address.zip || ''
        };
        
        console.log('Created pickup address from order delivery address:', pickup_address);
      } else {
        return res.status(400).json({
          message: 'No pickup address provided and neither buyer saved addresses nor order delivery address is available. Please provide pickup_address in the request body.'
        });
      }
    } else {
      console.log('Using pickup address provided in request:', pickup_address);
      
      // If pickup_address is provided but missing some fields, try to fill from buyer saved address
      if (buyerSavedAddress) {
        console.log('Checking if pickup_address is missing any fields that can be filled from buyer saved address');
        
        // Fill missing fields from buyer saved address if available
        if (!pickup_address.first_name) pickup_address.first_name = returnRequest.buyer.firstName || '';
        if (!pickup_address.last_name) pickup_address.last_name = returnRequest.buyer.lastName || '';
        if (!pickup_address.email) pickup_address.email = returnRequest.buyer.email || '';
        if (!pickup_address.phone) pickup_address.phone = returnRequest.buyer.phoneNumber || '';
        if (!pickup_address.line1) pickup_address.line1 = buyerSavedAddress.addressLine1 || '';
        if (!pickup_address.line2) pickup_address.line2 = buyerSavedAddress.addressLine2 || '';
        if (!pickup_address.city) pickup_address.city = buyerSavedAddress.city || '';
        if (!pickup_address.state) pickup_address.state = buyerSavedAddress.state || '';
        if (!pickup_address.country) pickup_address.country = buyerSavedAddress.country || '';
        if (!pickup_address.zip) pickup_address.zip = buyerSavedAddress.zipCode || '';
        
        console.log('Pickup address after filling missing fields from buyer saved address:', pickup_address);
      }
    }

    // Validate required pickup address fields and fill in defaults where possible
    const requiredFields = ['first_name', 'last_name', 'email', 'phone', 'line1', 'city', 'state', 'country', 'zip'];
    
    // Fill in default values for missing fields if possible
    if (!pickup_address.first_name && returnRequest.buyer) pickup_address.first_name = returnRequest.buyer.firstName || '';
    if (!pickup_address.last_name && returnRequest.buyer) pickup_address.last_name = returnRequest.buyer.lastName || '';
    if (!pickup_address.email && returnRequest.buyer) pickup_address.email = returnRequest.buyer.email || '';
    if (!pickup_address.phone && returnRequest.buyer) pickup_address.phone = returnRequest.buyer.phoneNumber || '';
    if (!pickup_address.city) pickup_address.city = 'Lagos';
    if (!pickup_address.state) pickup_address.state = 'Lagos';
    if (!pickup_address.country) pickup_address.country = 'NG';
    if (!pickup_address.zip) pickup_address.zip = '100001'; // Default Lagos postal code
    
    // Make sure all fields are strings (not undefined or null)
    for (const field of requiredFields) {
      if (pickup_address[field] === undefined || pickup_address[field] === null) {
        pickup_address[field] = '';
      }
    }
    
    console.log('Final pickup address after all defaults applied:', pickup_address);
    
    // Now check if any required fields are still missing or empty
    const missingFields = requiredFields.filter(field => !pickup_address[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing required pickup address fields: ${missingFields.join(', ')}`,
        currentAddress: pickup_address
      });
    }

    // Ensure seller phone number is available
    if (!returnRequest.seller.phoneNumber) {
      return res.status(400).json({
        message: 'Seller phone number is required for delivery address'
      });
    }

    // Log order pickup address details for debugging
    console.log('Order pickup address:', JSON.stringify(returnRequest.order.pickup_address || {}));
    console.log('Seller address details:', JSON.stringify({
      firstName: returnRequest.seller.firstName,
      lastName: returnRequest.seller.lastName,
      email: returnRequest.seller.email,
      phoneNumber: returnRequest.seller.phoneNumber,
      address: returnRequest.seller.address,
      state: returnRequest.seller.state
    }));

    // Use seller details or warehouse details if order pickup_address is missing
    let sellerAddressForDelivery = null;
    let sellerStateForDelivery = null;

    if (returnRequest.order.pickup_address && returnRequest.order.pickup_address.line1) {
      sellerAddressForDelivery = returnRequest.order.pickup_address.line1;
      sellerStateForDelivery = returnRequest.order.pickup_address.state;
      console.log('Using order pickup_address for seller delivery address');
    } else if (returnRequest.seller.address) {
      sellerAddressForDelivery = returnRequest.seller.address;
      sellerStateForDelivery = returnRequest.seller.state || 'Lagos';
      console.log('Using seller.address for seller delivery address');
    } else {
      // Create default address for seller if all else fails
      sellerAddressForDelivery = `${returnRequest.seller.firstName || ''} ${returnRequest.seller.lastName || ''} Business Address`;
      sellerStateForDelivery = returnRequest.seller.state || 'Lagos';
      console.log('Created default address for seller delivery address');
    }

    // Calculate total weight and value
    const totalWeight = returnRequest.items.reduce((sum, item) => {
      const weight = item.product.weight || 0.5;
      return sum + (weight * item.quantity);
    }, 0);
    
    const totalValue = returnRequest.items.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity);
    }, 0);

    // Generate a unique order ID for the return
    const uniqueReturnId = `AUQLI-RTN-${returnId.substring(0, 8)}`;

    // Create Fez Delivery request with proper null/undefined checks
    const fezRequest = {
      recipientAddress: sellerAddressForDelivery,
      recipientState: sellerStateForDelivery || "Lagos",
      recipientName: `${returnRequest.seller.firstName || ''} ${returnRequest.seller.lastName || ''}`,
      recipientPhone: returnRequest.seller.phoneNumber,
      recipientEmail: returnRequest.seller.email || '',
      uniqueID: uniqueReturnId,
      BatchID: `RETURN-${returnRequest.order.order_id || returnId}`,
      valueOfItem: totalValue.toString(),
      weight: Math.max(1, Math.round(totalWeight)), // Ensure minimum weight of 1kg for Fez
      itemDescription: `Return for order #${returnRequest.order.order_id || returnId}`,
      additionalDetails: `Return reason: ${returnRequest.description || 'Not specified'}`,
      isItemCod: false,
      thirdparty: "true",
      senderName: `${pickup_address.first_name} ${pickup_address.last_name}`,
      senderAddress: pickup_address.line1,
      senderPhone: pickup_address.phone,
      senderEmail: pickup_address.email || '',
      pickUpState: pickup_address.state || "Lagos",
    };

    // Set a default pickup date (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    fezRequest.pickUpDate = tomorrow.toISOString().split('T')[0]; // Format as YYYY-MM-DD

    // Log request data
    console.log('Fez Delivery Request Data:', JSON.stringify(fezRequest, null, 2));

    // Get a fresh authentication token for Fez Delivery
    const authToken = await getFezAuthToken();
    console.log('Using fresh token for return shipment creation:', authToken.substring(0, 10) + '...');

    // Create shipment with Fez Delivery
    const fezResponse = await axios.post(`${FEZ_API_URL}/order`, [fezRequest], {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'secret-key': FEZ_SECRET_KEY,
        'Content-Type': 'application/json'
      }
    });

    // Log response data
    console.log('Fez Delivery Response:', JSON.stringify(fezResponse.data, null, 2));

    if (!fezResponse.data || fezResponse.data.status !== 'Success') {
      throw new Error(fezResponse.data?.message || 'Failed to create return shipment');
    }

    // Get the order number from the response
    // Fez returns orderNos as an object with uniqueID as key and order number as value
    const orderNo = fezResponse.data.orderNos?.[uniqueReturnId];
    
    if (!orderNo) {
      throw new Error('Failed to get order number from Fez response');
    }

    // Update return request with shipping information
    const shippingUpdate = {
      status: 'RETURN_LABEL_CREATED',
      'returnShipment.shipment_id': orderNo,
      'returnShipment.tracking': {
        number: orderNo,
        url: `https://fezdelivery.co/track?orderNo=${orderNo}`,
        status: 'pending',
        lastUpdate: new Date(),
        history: [{
          status: 'pending',
          timestamp: new Date(),
          description: 'Return shipping label created'
        }]
      },
      'returnShipment.carrier': {
        name: 'Fez Delivery',
        reference: orderNo
      },
      'returnShipment.fee': {
        amount: 0, // Fez doesn't return fee in the create order response
        currency: 'NGN'
      },
      'returnShipment.pickup_address': {
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
      },
      'returnShipment.delivery_address': {
        first_name: returnRequest.seller.firstName || '',
        last_name: returnRequest.seller.lastName || '',
        email: returnRequest.seller.email || '',
        phone: returnRequest.seller.phoneNumber || '',
        line1: sellerAddressForDelivery,
        line2: returnRequest.order.pickup_address?.line2 || '',
        city: returnRequest.order.pickup_address?.city || 'Lagos',
        state: sellerStateForDelivery || 'Lagos',
        country: returnRequest.order.pickup_address?.country || 'NG',
        zip: returnRequest.order.pickup_address?.zip || '100001'
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
            note: `Return shipping label created with Fez Delivery tracking number ${orderNo}`,
            updatedBy: 'seller'
          }
        }
      },
      { new: true }
    );

    // Notify buyer about shipping label creation
    if (updatedReturn && updatedReturn.buyer) {
      try {
        await createBuyerNotification(updatedReturn.buyer, 'return_label_created', {
          returnId: returnId,
          orderId: updatedReturn.order?._id,
          order_id: updatedReturn.order?.order_id || returnId,
          trackingNumber: orderNo,
          trackingUrl: `https://fezdelivery.co/track?orderNo=${orderNo}`
        });
      } catch (notificationError) {
        console.error('Error sending notification to buyer:', notificationError);
        // Continue execution despite notification error
      }
    }

    res.json({
      message: 'Return shipping label created successfully',
      data: {
        shipment_id: orderNo,
        tracking_number: orderNo,
        tracking_url: `https://fezdelivery.co/track?orderNo=${orderNo}`,
        carrier_name: 'Fez Delivery',
        shipment_cost: 0 // Fez doesn't return fee in the create order response
      }
    });

  } catch (error) {
    console.error('Error creating return shipping label:', error);
    console.error('Error details:', error.response?.data);
    res.status(500).json({
      message: 'Failed to create return shipping label',
      error: error.message || 'Unknown error',
      details: error.response?.data
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

    // For Fez Delivery, we don't need to get rates as they have fixed pricing
    // Instead, we'll return an estimated delivery fee based on weight
    
    // Calculate total weight
    const totalWeight = returnRequest.items.reduce((sum, item) => {
      const weight = item.product?.weight || 0.5;
      return sum + (weight * item.quantity);
    }, 0);
    
    // Round up to nearest kg and ensure minimum of 1kg
    const roundedWeight = Math.max(1, Math.ceil(totalWeight));
    
    // Calculate estimated fee (base fee + additional per kg)
    // These are example values - adjust based on Fez's actual pricing
    const baseFee = 2500; // Base fee for first kg
    const additionalFee = 500; // Fee per additional kg
    const estimatedFee = baseFee + (Math.max(0, roundedWeight - 1) * additionalFee);

    // Get a fresh authentication token for Fez Delivery
    const authToken = await getFezAuthToken();
    
    // Get delivery time estimate from Fez
    const estimateResponse = await axios.post(`${FEZ_API_URL}/delivery-time-estimate`, {
      pickUpState: returnRequest.order.pickup_address.state || "Lagos",
      deliveryState: returnRequest.order.delivery_address.state || "Lagos"
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'secret-key': FEZ_SECRET_KEY,
        'Content-Type': 'application/json'
      }
    });

    let estimatedDeliveryTime = "1-3 days";
    if (estimateResponse.data && estimateResponse.data.status === 'Success') {
      estimatedDeliveryTime = estimateResponse.data.data.estimatedDeliveryTime || estimatedDeliveryTime;
    }

    // Create a single rate option
    const fezRate = {
      id: 'fez-standard-rate',
      carrier_name: 'Fez Delivery',
      carrier_logo: 'https://fezdelivery.co/assets/images/logo.png',
      amount: estimatedFee,
      currency: 'NGN',
      delivery_time: estimatedDeliveryTime,
      delivery_time_hours: 72, // 3 days in hours
      pickup_time: '24h',
      insurance_fee: 0,
      is_doorstep_delivery: true,
      is_doorstep_pickup: true,
      weight: roundedWeight
    };

    res.json({
      message: 'Shipping rates retrieved successfully',
      rates: [fezRate],
      pageData: {
        total: 1,
        page: 1,
        limit: 10
      }
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

    // For Fez Delivery, we don't need to select a rate as they have fixed pricing
    // We'll just update the return request with the selected rate information

    // Update return request with rate information
    const updatedReturn = await Return.findByIdAndUpdate(
      returnId,
      { 
        $set: {
          'returnShipment.rate_id': rate_id || 'fez-standard-rate',
          'returnShipment.fee.amount': amount || 0,
          'returnShipment.carrier.name': carrier_name || 'Fez Delivery'
        },
        $push: {
          timeline: {
            status: 'RETURN_RATE_SELECTED',
            date: new Date(),
            note: `Return shipping rate selected: ${carrier_name || 'Fez Delivery'} - ₦${amount || 0}`,
            updatedBy: 'seller'
          }
        }
      },
      { new: true }
    );

    res.json({
      message: 'Shipping rate selected successfully',
      data: {
        rate_id: rate_id || 'fez-standard-rate',
        carrier_name: carrier_name || 'Fez Delivery',
        amount: amount || 0
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

    const returnRequest = await Return.findById(returnId)
      .populate('order')
      .populate('seller');
      
    if (!returnRequest) {
      return res.status(404).json({ message: 'Return request not found' });
    }

    // Verify shipment_id exists
    if (!returnRequest.returnShipment?.shipment_id) {
      return res.status(400).json({ 
        message: 'Cannot arrange pickup. Missing shipment_id. Please create shipment first.' 
      });
    }

    // For Fez Delivery, the pickup is automatically arranged when the order is created
    // We'll just update the return request status to reflect that pickup is arranged

    // Get a fresh authentication token for Fez Delivery
    const authToken = await getFezAuthToken();
    
    // Get tracking information from Fez
    const orderNo = returnRequest.returnShipment.shipment_id;
    const trackingResponse = await axios.get(`${FEZ_API_URL}/order/track/${orderNo}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'secret-key': FEZ_SECRET_KEY,
        'Content-Type': 'application/json'
      }
    });

    let trackingStatus = 'pending';
    let trackingHistory = [];
    
    if (trackingResponse.data && trackingResponse.data.status === 'Success') {
      const trackingData = trackingResponse.data.data;
      trackingStatus = trackingData.status?.toLowerCase() || 'pending';
      
      // Format tracking history if available
      if (trackingData.history && Array.isArray(trackingData.history)) {
        trackingHistory = trackingData.history.map(item => ({
          status: item.status || 'unknown',
          timestamp: new Date(item.date) || new Date(),
          location: item.location || '',
          description: item.description || ''
        }));
      }
    }

    // Update return request with pickup information
    const updatedReturn = await Return.findByIdAndUpdate(
      returnId,
      { 
        $set: {
          status: 'IN_TRANSIT',
          'returnShipment.status': 'PICKUP_ARRANGED',
          'returnShipment.tracking.status': trackingStatus,
          'returnShipment.tracking.lastUpdate': new Date(),
          'returnShipment.tracking.history': trackingHistory.length > 0 ? trackingHistory : [
            {
              status: 'pickup_arranged',
              timestamp: new Date(),
              location: returnRequest.returnShipment.pickup_address?.city || '',
              description: 'Pickup arranged with Fez Delivery'
            }
          ]
        },
        $push: {
          timeline: {
            status: 'RETURN_PICKUP_ARRANGED',
            date: new Date(),
            note: `Return pickup arranged with Fez Delivery`,
            updatedBy: 'seller'
          }
        }
      },
      { new: true }
    );

    // Send notification to buyer
    await createBuyerNotification(returnRequest.buyer, 'return_pickup_arranged', {
      returnId: returnRequest._id,
      orderId: returnRequest.order._id,
      order_id: returnRequest.order.order_id,
      trackingNumber: orderNo,
      trackingUrl: `https://fezdelivery.co/track?orderNo=${orderNo}`
    });

    res.json({
      message: 'Return pickup arranged successfully',
      data: {
        shipment_id: orderNo,
        tracking_number: orderNo,
        tracking_url: `https://fezdelivery.co/track?orderNo=${orderNo}`,
        status: 'pickup_arranged'
      }
    });

  } catch (error) {
    console.error('Error arranging return pickup:', error);
    console.error('Error details:', error.response?.data);
    res.status(500).json({
      message: 'Failed to arrange return pickup',
      error: error.response?.data?.message || error.message
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
      .populate('order')
      .populate('buyer', 'email firstName lastName')
      .populate('seller', 'email firstName lastName businessName')
      .populate({
        path: 'items.product',
        select: 'name'
      });

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

    // Send email notifications to buyer and seller
    try {
      await sendShippingLabelEmails(
        returnRequest, 
        replacementProduct,
        returnShipment.data.data.extras,
        replacementShipment.data.data.extras
      );
      console.log('Shipping label emails sent successfully');
    } catch (emailError) {
      console.error('Error sending shipping label emails:', emailError);
      // Continue despite email error
    }

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

// Helper function to send shipping label emails
async function sendShippingLabelEmails(returnRequest, replacementProduct, returnShipmentExtras, replacementShipmentExtras) {
  try {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    // Get product names
    const originalProductNames = returnRequest.items.map(item => 
      item.product.name || 'Product'
    ).join(', ');
    
    const replacementProductName = replacementProduct.name || 'Replacement Product';

    // Email to buyer
    const buyerEmail = {
      to: returnRequest.buyer.email,
      from: {
        email: 'support@auqli.com',
        name: 'Auqli Returns'
      },
      subject: 'Return and Replacement Shipping Labels Created',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Return and Replacement Shipping Labels</h2>
          <p>Dear ${returnRequest.buyer.firstName},</p>
          <p>Good news! The seller has created shipping labels for your return and replacement request.</p>
          
          <h3>Return Details:</h3>
          <p>You'll need to ship back: <strong>${originalProductNames}</strong></p>
          <p><strong>Return Tracking Number:</strong> ${returnRequest.returnShipment.tracking.number}</p>
          <p><strong>Tracking URL:</strong> <a href="${returnRequest.returnShipment.tracking.url}">${returnRequest.returnShipment.tracking.url}</a></p>
          <p><a href="${returnShipmentExtras.shipping_label_url}" target="_blank">Download Return Shipping Label</a></p>
          
          <h3>Replacement Details:</h3>
          <p>You'll receive: <strong>${replacementProductName}</strong></p>
          <p><strong>Replacement Tracking Number:</strong> ${returnRequest.replacementShipment.tracking.number}</p>
          <p><strong>Tracking URL:</strong> <a href="${returnRequest.replacementShipment.tracking.url}">${returnRequest.replacementShipment.tracking.url}</a></p>
          
          <p><strong>Important:</strong> Please print the return shipping label and attach it to your package. The seller will arrange for pickup of your return item and delivery of your replacement.</p>
          
          <p>If you have any questions, please don't hesitate to contact our support team.</p>
          <p>Best regards,<br>The Auqli Team</p>
        </div>
      `
    };

    // Email to seller
    const sellerEmail = {
      to: returnRequest.seller.email,
      from: {
        email: 'support@auqli.com',
        name: 'Auqli Returns'
      },
      subject: 'Return and Replacement Shipping Labels Created',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Return and Replacement Shipping Labels Created</h2>
          <p>Dear ${returnRequest.seller.firstName || returnRequest.seller.businessName},</p>
          <p>You have successfully created shipping labels for return and replacement for order #${returnRequest.order.order_id}.</p>
          
          <h3>Return Shipment:</h3>
          <p><strong>Tracking Number:</strong> ${returnRequest.returnShipment.tracking.number}</p>
          <p><strong>Tracking URL:</strong> <a href="${returnRequest.returnShipment.tracking.url}">${returnRequest.returnShipment.tracking.url}</a></p>
          <p><a href="${returnShipmentExtras.shipping_label_url}" target="_blank">Download Return Shipping Label</a></p>
          <p><a href="${returnShipmentExtras.commercial_invoice_url}" target="_blank">Download Commercial Invoice</a></p>
          
          <h3>Replacement Shipment:</h3>
          <p><strong>Product:</strong> ${replacementProductName}</p>
          <p><strong>Tracking Number:</strong> ${returnRequest.replacementShipment.tracking.number}</p>
          <p><strong>Tracking URL:</strong> <a href="${returnRequest.replacementShipment.tracking.url}">${returnRequest.replacementShipment.tracking.url}</a></p>
          <p><a href="${replacementShipmentExtras.shipping_label_url}" target="_blank">Download Replacement Shipping Label</a></p>
          <p><a href="${replacementShipmentExtras.commercial_invoice_url}" target="_blank">Download Commercial Invoice</a></p>
          
          <p><strong>Next Steps:</strong></p>
          <ol>
            <li>The buyer has been notified to prepare the return package</li>
            <li>You need to <a href="/dashboard/returns/${returnRequest._id}/arrange-pickup">arrange pickup</a> for both shipments</li>
            <li>Track both shipments to ensure smooth return and replacement delivery</li>
          </ol>
          
          <p>If you have any questions, please don't hesitate to contact our support team.</p>
          <p>Best regards,<br>The Auqli Team</p>
        </div>
      `
    };

    // Send emails
    await Promise.all([
      sgMail.send(buyerEmail),
      sgMail.send(sellerEmail)
    ]);

    return true;
  } catch (error) {
    console.error('Error sending shipping label emails:', error);
    throw error;
  }
}

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
      from: 'Auqli Returns <support@auqli.com>',
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
      from: 'Auqli Returns <support@auqli.com>',
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
      to: 'admin@auqli.com',
      from: 'Auqli Returns <support@auqli.com>',
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
        from: 'Auqli Returns <support@auqli.com>'
      }),
      sgMail.send({
        ...emailTemplate,
        to: returnRequest.seller.email,
        from: 'Auqli Returns <support@auqli.com>'
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

    console.log('Buyer ID:', buyerId); // Debug log
    console.log('Query:', { buyer: buyerId, status }); // Debug log

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

/**
 * Seller initiates a refund request for a return
 */
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
    if ( 
        !['refund', 'REFUND', 'FULL_REFUND'].includes(returnRequest.preferredResolution)) {
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
      message: 'Refund request initiated successfully',
      returnRequest
    });

  } catch (error) {
    console.error('Error in initiateRefundRequest:', error);
    res.status(500).json({ message: 'Error processing refund request' });
  }
};

/**
 * Admin gets all refund requests
 */
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
      .populate('seller', 'firstName lastName businessName')
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

/**
 * Admin processes a refund request
 */
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
        description: `Refund for return #${returnRequest._id}`,
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

    } else {
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
    returnRequest.adminNotes.push({
      note,
      date: new Date(),
      adminId
    });

    await returnRequest.save();

    res.status(200).json({
      message: `Refund request ${action}ed successfully`,
      returnRequest
    });

  } catch (error) {
    console.error('Error in processRefundRequest:', error);
    res.status(500).json({ message: 'Error processing refund request' });
  }
}; 