const PickupRequest = require('../models/PickupRequest');
const Order = require('../models/Order');
const Seller = require('../models/Seller');
const cloudinary = require('../config/cloudinary');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const { s3 } = require('../config/awsConfig')
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');


// Create a new pickup request
exports.createPickupRequest = async (req, res) => {
  try {
    const { orderId } = req.params;
    const sellerId = req.user.id;

    console.log('--- Incoming Pickup Request ---');
    console.log('req.body:', req.body);
    console.log('req.file:', req.file);
    console.log('req.files:', req.files);
    console.log('------------------------------');

    // Check if order exists and belongs to seller
    const order = await Order.findOne({ _id: orderId, seller: sellerId })
      .populate('buyer')
      .populate('seller');

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found or does not belong to seller',
      });
    }

    // Check if there's already a pending or approved pickup request
    const existingRequest = await PickupRequest.findOne({
      order: orderId,
      status: { $in: ['pending', 'approved'] },
    });

    if (existingRequest) {
      return res.status(400).json({
        status: 'error',
        message: 'A pickup request for this order is already pending or approved',
      });
    }

    // Check if proof of delivery was uploaded
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'Proof of delivery is required',
      });
    }

    // Generate a unique key for the uploaded file
    const fileExtension = req.file.originalname.split('.').pop();
    const fileKey = `pickup_proofs/${Date.now()}-${uuidv4()}.${fileExtension}`;

    // Upload image to S3
    const uploadParams = {
      Bucket: process.env.CDN_S3_BUCKET,
      Key: fileKey,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    };

    const uploadResult = await s3.upload(uploadParams).promise();

    // Create pickup request
    const pickupRequest = await PickupRequest.create({
      order: orderId,
      seller: sellerId,
      buyer: order.buyer._id,
      proofOfDelivery: {
        url: `https://${process.env.CDN_URL}/${uploadResult.Key}`,
        public_id: uploadResult.Key,
      },
      notes: req.body.notes,
      status: 'pending',
    });

    // Send email to admin about new pickup request
    const adminEmail = {
      to: 'admin@auqli.com',
      from: {
        email: 'support@auqli.com',
        name: 'Auqli Orders',
      },
      subject: 'New Pickup Request Pending Approval',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New Pickup Request</h2>
          <p>A new pickup request has been submitted and requires your approval:</p>
          <ul>
            <li>Order ID: ${order.order_id}</li>
            <li>Seller: ${order.seller.storeName}</li>
            <li>Buyer: ${order.buyer.firstName} ${order.buyer.lastName}</li>
          </ul>
          <p>Please review the request in the admin dashboard.</p>
        </div>
      `,
    };

    await sgMail.send(adminEmail);

    // Send confirmation to seller
    const sellerEmail = {
      to: order.seller.email,
      from: {
        email: 'support@auqli.com',
        name: 'Auqli Orders',
      },
      subject: 'Pickup Request Submitted',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Pickup Request Submitted</h2>
          <p>Dear ${order.seller.firstName},</p>
          <p>Your pickup request for order #${order.order_id} has been submitted and is pending admin approval.</p>
          <p>We will notify you once the request has been reviewed.</p>
          <p>Best regards,<br>The Auqli Team</p>
        </div>
      `,
    };

    await sgMail.send(sellerEmail);

    return res.status(201).json({
      status: 'success',
      message: 'Pickup request created successfully and pending admin approval',
      data: pickupRequest,
    });

  } catch (error) {
    console.error('Error creating pickup request:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Error creating pickup request',
      error: error.message,
    });
  }
};


// Process pickup request (admin only)
exports.processPickupRequest = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { requestId } = req.params;
    const { status, adminNote } = req.body;
    const adminId = req.user.id;

    if (!['approved', 'declined'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid status. Must be either approved or declined'
      });
    }

    const pickupRequest = await PickupRequest.findById(requestId)
      .populate({
        path: 'order',
        populate: [
          { path: 'buyer' },
          { path: 'seller' }
        ]
      });

    if (!pickupRequest) {
      return res.status(404).json({
        status: 'error',
        message: 'Pickup request not found'
      });
    }

    if (pickupRequest.status !== 'pending') {
      return res.status(400).json({
        status: 'error',
        message: 'This pickup request has already been processed'
      });
    }

    // Update pickup request
    pickupRequest.status = status;
    pickupRequest.adminNote = adminNote;
    pickupRequest.processedAt = new Date();
    pickupRequest.processedBy = adminId;

    if (status === 'approved') {
      const order = pickupRequest.order;
      
      // Update order status
      order.shipping.tracking.status = 'delivered';
      order.shipping.tracking.history.push({
        status: 'delivered',
        timestamp: new Date(),
        description: 'Pickup request approved by admin'
      });
      order.isOpen = false;
      order.closedAt = new Date();
      order.closedBy = 'admin';
      order.closedReason = 'Pickup request approved';

      // Let the order pre-save middleware handle transaction creation
      await order.save({ session });
      console.log(`Order ${order.order_id} updated and closed via pickup request approval`);
    }

    await pickupRequest.save({ session });
    await session.commitTransaction();

    // Send notifications after transaction is committed
    if (status === 'approved') {
      // Send email to seller
      const sellerEmail = {
        to: pickupRequest.order.seller.email,
        from: {
          email: 'support@auqli.com',
          name: 'Auqli Orders'
        },
        subject: 'Pickup Request Approved',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Pickup Request Approved</h2>
            <p>Dear ${pickupRequest.order.seller.firstName},</p>
            <p>Your pickup request for order #${pickupRequest.order.order_id} has been approved.</p>
            <p>The order has been marked as delivered and payment will be released to your wallet.</p>
            <p>Best regards,<br>The Auqli Team</p>
          </div>
        `
      };

      await sgMail.send(sellerEmail);
    } else {
      // Send declined notification to seller
      const sellerEmail = {
        to: pickupRequest.order.seller.email,
        from: {
          email: 'support@auqli.com',
          name: 'Auqli Orders'
        },
        subject: 'Pickup Request Declined',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Pickup Request Declined</h2>
            <p>Dear ${pickupRequest.order.seller.firstName},</p>
            <p>Your pickup request for order #${pickupRequest.order.order_id} has been declined.</p>
            ${adminNote ? `<p>Admin note: ${adminNote}</p>` : ''}
            <p>You may submit a new pickup request with updated proof of delivery.</p>
            <p>Best regards,<br>The Auqli Team</p>
          </div>
        `
      };

      await sgMail.send(sellerEmail);
    }

    return res.status(200).json({
      status: 'success',
      message: `Pickup request ${status}`,
      data: pickupRequest
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error processing pickup request:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Error processing pickup request',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

// Get all pickup requests (admin only)
exports.getAllPickupRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};
    
    // Add filters if provided
    if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.query.startDate && req.query.endDate) {
      query.createdAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    const [pickupRequests, total] = await Promise.all([
      PickupRequest.find(query)
        .populate('order')
        .populate('seller', 'storeName businessName email')
        .populate('buyer', 'firstName lastName email')
        .populate('processedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      PickupRequest.countDocuments(query)
    ]);

    return res.status(200).json({
      status: 'success',
      data: {
        pickupRequests,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          page,
          limit
        }
      }
    });

  } catch (error) {
    console.error('Error fetching pickup requests:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Error fetching pickup requests',
      error: error.message
    });
  }
};

// Get seller's pickup requests
exports.getSellerPickupRequests = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { seller: sellerId };
    
    // Add status filter if provided
    if (req.query.status) {
      query.status = req.query.status;
    }

    const [pickupRequests, total] = await Promise.all([
      PickupRequest.find(query)
        .populate('order')
        .populate('buyer', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      PickupRequest.countDocuments(query)
    ]);

    return res.status(200).json({
      status: 'success',
      data: {
        pickupRequests,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          page,
          limit
        }
      }
    });

  } catch (error) {
    console.error('Error fetching seller pickup requests:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Error fetching pickup requests',
      error: error.message
    });
  }
};