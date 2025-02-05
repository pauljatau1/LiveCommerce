const Return = require('../models/Return');
const Order = require('../models/Order');
const cloudinary = require('../config/cloudinary');
const { validateReturnEligibility } = require('../utils/returnUtils');
const Admin = require('../models/Admin');
const sgMail = require('../config/sendgrid');

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
      timeline: [{
        status: 'PENDING_SELLER_REVIEW',
        note: 'Return request created',
        updatedBy: 'buyer'
      }]
    });

    console.log('Return Request Object:', {
      orderId: returnRequest.order,
      buyerId: returnRequest.buyer,
      sellerId: returnRequest.seller,
      itemsCount: returnRequest.items?.length,
      evidenceCount: returnRequest.evidence?.length
    });

    await returnRequest.save();
    console.log('Return Request Saved Successfully');

    res.status(201).json({
      message: 'Return request created successfully',
      returnRequest
    });

  } catch (error) {
    console.error('Error in createReturnRequest:', error);
    console.error('Error Stack:', error.stack);
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

    const returnRequest = await Return.findById(returnId)
      .populate('order')
      .populate('buyer', 'firstName lastName email')
      .populate('seller', 'firstName lastName businessName email')
      .populate('items.product', 'name images price');

    if (!returnRequest) {
      return res.status(404).json({ message: 'Return request not found' });
    }

    // Check authorization
    if (![returnRequest.buyer._id.toString(), returnRequest.seller._id.toString()].includes(userId)) {
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

    // Send notification to buyer
    // TODO: Implement notification system

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
    const { resolution, note, refundAmount } = req.body;
    const adminId = req.user.id;

    const returnRequest = await Return.findById(returnId)
      .populate('buyer')
      .populate('seller')
      .populate('order');

    if (!returnRequest) {
      return res.status(404).json({ message: 'Return request not found' });
    }

    if (!returnRequest.dispute) {
      return res.status(400).json({ message: 'No active dispute found' });
    }

    // Process resolution
    switch (resolution) {
      case 'approve_return':
        returnRequest.status = 'APPROVED';
        await generateShippingLabel(returnRequest);
        break;

      case 'reject_return':
        returnRequest.status = 'REJECTED';
        break;

      case 'partial_refund':
        if (!refundAmount) {
          return res.status(400).json({ message: 'Refund amount is required for partial refund' });
        }
        returnRequest.status = 'RESOLVED';
        await processPartialRefund(returnRequest, refundAmount);
        break;

      default:
        return res.status(400).json({ message: 'Invalid resolution type' });
    }

    // Update dispute status
    returnRequest.dispute.status = 'RESOLVED';
    returnRequest.dispute.resolvedBy = adminId;
    returnRequest.dispute.resolvedAt = new Date();
    returnRequest.dispute.resolution = {
      type: resolution,
      note,
      refundAmount
    };

    returnRequest.timeline.push({
      status: returnRequest.status,
      note: `Dispute resolved by admin: ${note}`,
      updatedBy: 'admin'
    });

    await returnRequest.save();

    // Notify both parties
    await createNotification(returnRequest.buyer._id, 'dispute_resolved', {
      returnId: returnRequest._id,
      resolution,
      note
    });

    await createNotification(returnRequest.seller._id, 'dispute_resolved', {
      returnId: returnRequest._id,
      resolution,
      note
    });

    res.json({
      message: 'Dispute resolved successfully',
      returnRequest
    });

  } catch (error) {
    console.error('Error resolving dispute:', error);
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