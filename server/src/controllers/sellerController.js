const { authEmail } = require('../utils/authEmail');
const { sellerAppUrl } = require('../utils/helpers');
const Seller = require('../models/Seller');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const termiiEmailService = require('../services/termiiEmailService');
const Category = require('../models/Category');
const { s3 } = require('../config/awsConfig')
const { v4: uuidv4 } = require('uuid');

const Order = require('../models/Order');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../utils/emailService');
const Buyer = require('../models/Buyer');
const Withdrawal = require('../models/Withdrawal');
const Campaign = require('../models/Campaign');
const Stream = require('../models/Stream');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const notificationController = require('./notificationController');
const Transaction = require('../models/Transaction');
const Return = require('../models/Return');
const BankChangeRequest = require('../models/BankChangeRequest');
const Admin = require('../models/Admin');
const mixpanel = require('../config/mixpanel');
const { DeleteS3Objects } = require('../utils/s3');

// SmileID integration
const SIDCore = require("smile-identity-core");
const SIDSignature = SIDCore.Signature;
const SIDWebAPI = SIDCore.WebApi;
const IDApi = SIDCore.IDApi; // ← Add IDApi import

// Add this helper function at the top of the file
const generateUniqueAgoraUid = async () => {
  let attempts = 0;
  let agoraUid;
  let exists;

  do {
    // Generate UID between 100000 and 4294967295
    agoraUid = Math.floor(100000 + Math.random() * (4294967295 - 100000));
    exists = await Seller.findOne({ agoraUid });
    attempts++;
  } while (exists && attempts < 5);

  if (exists) {
    throw new Error('Failed to generate unique Agora UID after 5 attempts');
  }

  return agoraUid;
};

const generateToken = id => require('../services/auth/sessions').issueToken(id, 'Seller', '2w');

// Update seller profile information
exports.updateProfileInfo = async (req, res) => {
  try {
    const {
      businessName,
      businessAddress,
      accountType,
      bankDetails,
      categories,
      shippingOptions,
      warehouseAddress,
      storeName,
      aboutStore,
    } = req.body;

    const seller = await Seller.findById(req.user.id);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    Object.assign(seller, {
      businessName,
      businessAddress,
      accountType,
      bankDetails,
      categories,
      shippingOptions,
      warehouseAddress,
      storeName,
      aboutStore,
    });

    if (accountType === 'business') seller.isVerified = false;

    const updatedSeller = await seller.save();

    res.json({ message: 'Profile updated successfully', seller: updatedSeller });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
};

// Helper function to save verification result
const saveVerificationResult = async (sellerId, smileIdResult, accountType) => {
  try {
    const seller = await Seller.findById(sellerId);
    if (!seller) return;

    // CRITICAL: Check for actual success based on images and result codes
    const hasImages = smileIdResult.images && smileIdResult.images.length > 0;
    const isSuccessfulCode = smileIdResult.ResultCode && ['1012', '1020', '1021'].includes(smileIdResult.ResultCode.toString());
    const isActuallySuccessful = hasImages && (isSuccessfulCode || smileIdResult.success === true);

    // Store SmileID verification result
    seller.smileIdVerification = {
      type: accountType,
      provider: 'SmileID',
      result: smileIdResult,
      verifiedAt: new Date(),
      status: isActuallySuccessful ? 'verified' : 'failed'
    };

    // Set verification documents as filled
    seller.hasFilledVerificationDocuments = true;

    // Only set verified if actually successful
    if (isActuallySuccessful) {
      seller.isVerified = true;
    }

    await seller.save();

    console.log(`Verification result saved for seller ${sellerId}, success: ${isActuallySuccessful}`);
  } catch (error) {
    console.error('Error saving verification result:', error);
  }
};

// Request bank account change
exports.requestBankAccountChange = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const seller = await Seller.findById(sellerId);

    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    // Check if there's already a pending request
    const existingRequest = await BankChangeRequest.findOne({
      seller: sellerId,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({
        message: "You already have a pending bank change request"
      });
    }

    // Validate proof document
    if (!req.file) {
      return res.status(400).json({
        message: "Proof document is required"
      });
    }

    // Parse the newBankDetails from JSON string
    let newBankDetails;
    try {
      newBankDetails = JSON.parse(req.body.newBankDetails);
    } catch (error) {
      return res.status(400).json({
        message: "Invalid bank details format"
      });
    }

    // Upload proof document to S3
    const fileKey = `bank-change-proofs/${uuidv4()}-${req.file.originalname}`;
    const uploadParams = {
      Bucket: process.env.CDN_S3_BUCKET,
      Key: fileKey,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    };

    const uploadResult = await s3.upload(uploadParams).promise();

    // Create bank change request
    const bankChangeRequest = new BankChangeRequest({
      seller: sellerId,
      currentBankDetails: seller.bankDetails,
      newBankDetails: newBankDetails,
      proofDocument: {
        url: `https://` + process.env.CDN_URL + `/${uploadResult.Key}`,
        public_id: uploadResult.Key
      }
    });

    await bankChangeRequest.save();

    // Send email notifications
    const adminEmails = await Admin.find().distinct('email');

    // Email to admin
    const adminEmailMsg = {
      to: adminEmails,
      from: process.env.EMAIL_FROM,
      subject: 'New Bank Account Change Request',
      html: `
        <h2>New Bank Account Change Request</h2>
        <p>A seller has submitted a request to change their bank account details.</p>
        <p>Seller: ${seller.firstName} ${seller.lastName} (${seller.email})</p>
        <p>Store: ${seller.storeName}</p>
        <p>Please review the request in the admin dashboard.</p>
      `
    };

    // Email to seller
    const sellerEmailMsg = {
      to: seller.email,
      from: process.env.EMAIL_FROM,
      subject: 'Bank Account Change Request Submitted',
      html: `
        <h2>Bank Account Change Request Submitted</h2>
        <p>Your request to change bank account details has been submitted successfully.</p>
        <p>Our admin team will review your request and notify you of the decision.</p>
        <p>You can check the status of your request in your seller dashboard.</p>
      `
    };

    // Send both emails
    await Promise.all([
      termiiEmailService.sendRawHTMLEmail({
        email: adminEmails[0] || 'support@auqli.com', // Termii service currently expects single string, using first admin or fallback
        subject: adminEmailMsg.subject,
        html: adminEmailMsg.html
      }),
      termiiEmailService.sendRawHTMLEmail({
        email: seller.email,
        subject: sellerEmailMsg.subject,
        html: sellerEmailMsg.html
      })
    ]);

    res.status(200).json({
      message: "Bank change request submitted successfully"
    });

  } catch (error) {
    console.error('Error in requestBankAccountChange:', error);
    res.status(500).json({
      message: "Failed to submit bank account change request",
      error: error.message
    });
  }
};

// Get bank change request status
exports.getBankChangeRequestStatus = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const pendingRequest = await BankChangeRequest.findOne({
      seller: sellerId,
      status: 'pending'
    }).select('requestDate newBankDetails status');

    res.json({
      success: true,
      pendingRequest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get bank change request status',
      error: error.message
    });
  }
};

// Add categories
exports.addCategories = async (req, res) => {
  try {
    const { categories } = req.body;

    const seller = await Seller.findById(req.user.id);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    seller.categories = categories;

    // Update completion flags
    seller.hasFilledCategoryDetails = categories.length > 0;

    const updatedSeller = await seller.save();

    res.json({ message: 'Categories added successfully', seller: updatedSeller });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add categories', error: error.message });
  }
};

// Add address and shipping information
exports.addAddressShipping = async (req, res) => {
  try {
    const { shippingOptions, warehouseAddress } = req.body;

    const seller = await Seller.findById(req.user.id);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    seller.shippingOptions = shippingOptions;
    seller.warehouseAddress = warehouseAddress;

    // Update completion flags
    seller.hasFilledAddress = !!warehouseAddress;

    const updatedSeller = await seller.save();

    res.json({ message: 'Address and shipping information added successfully', seller: updatedSeller });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add address and shipping information', error: error.message });
  }
};

// Helper function to check if the profile is complete
const checkProfileCompletion = (seller) => {
  return (
    seller.accountType &&
    seller.businessName &&
    seller.businessAddress &&
    seller.bankDetails &&
    seller.categories.length > 0 &&
    seller.shippingOptions &&
    seller.warehouseAddress &&
    seller.storeName
  );
};

exports.updateIndividualInformation = async (req, res) => {
  try {
    const { firstName, lastName, sellerAddress } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !sellerAddress) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, and address are required'
      });
    }

    const seller = await Seller.findById(req.user.id);
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    seller.firstName = firstName;
    seller.lastName = lastName;
    if (sellerAddress) Object.assign(sellerAddress, require('../services/areaDirectory').validateArea(sellerAddress));
    seller.sellerAddress = sellerAddress;

    // Update completion flags
    seller.hasFilledAddress = !!sellerAddress;

    const updatedSeller = await seller.save();

    res.json({
      success: true,
      message: 'Individual information updated successfully',
      seller: updatedSeller
    });
  } catch (error) {
    if (error.code === 'invalid_area' || error.code === 'out_of_area') return res.status(error.status || 400).json({code:error.code,message:error.message});
    res.status(500).json({
      success: false,
      message: 'Failed to update individual information',
      error: error.message
    });
  }
};

// Forgot password
/**
 * Handle forgot password request for sellers.
 * 
 * This controller processes password reset requests by:
 * 1. Validating the email address
 * 2. Finding the seller by email
 * 3. Generating a secure 4-digit reset code
 * 4. Storing the reset code with expiration time (1 hour)
 * 5. Sending password reset email via Termii Email API
 * 
 * The email is sent using a pre-configured Termii template with
 * dynamic variables for personalization and OTP display.
 * 
 * @param {Object} req - Express request object
 * @param {string} req.body.email - Seller's email address
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const legacyForgotPassword = async (req, res) => {
  const { email } = req.body;

  // Validate email input
  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  try {
    // Find seller by email address
    const seller = await Seller.findOne({ email });
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found.' });
    }

    // Generate a secure 4-digit reset code
    // Using Math.random for code generation (consistent with existing implementation)
    const resetCode = Math.floor(1000 + Math.random() * 9000).toString();

    // Store reset code and expiration time (1 hour from now)
    seller.resetPasswordCode = resetCode;
    seller.resetPasswordExpires = Date.now() + 3600000; // Code valid for 1 hour
    await seller.save();

    // Construct HTML email body with reset code (like SendGrid)
    // This keeps the email template in code
    const html = `
      <div style="background-color: #1a1a1a; color: #ffffff; padding: 30px; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto;">
          <img src="https://res.cloudinary.com/dljgzevaj/image/upload/v1733928675/Group_178_iqez5h.png" alt="Auqli Logo" style="width: 150px; margin-bottom: 30px;">
          <h1 style="color: #4CAF50; margin-bottom: 20px;">Password Reset Code</h1>
          <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Hi ${seller.firstName},</p>
          <p style="font-size: 16px; line-height: 1.5; margin-bottom: 30px;">You requested to reset your password. Use the code below to complete the process:</p>
          <div style="background-color: #333333; padding: 20px; border-radius: 5px; text-align: center; margin-bottom: 30px;">
            <span style="font-size: 32px; letter-spacing: 5px; color: #4CAF50; font-weight: bold;">${resetCode}</span>
          </div>
          <p style="font-size: 14px; color: #999999;">This code will expire in 1 hour. If you didn't request this reset, please ignore this email.</p>
          <hr style="border: 1px solid #333333; margin: 30px 0;">
          <p style="font-size: 12px; color: #999999; text-align: center;">© ${new Date().getFullYear()} Auqli. All rights reserved.</p>
        </div>
      </div>
    `;

    // Send password reset email via Termii Email API with raw HTML
    // The Termii service will pass the HTML to Termii via a template variable
    const termiiEmailService = require('../services/termiiEmailService');
    await termiiEmailService.sendPasswordResetEmail({
      email: email,
      ...authEmail({ html, subject: 'Reset Your Password - Auqli' }, { kind: 'reset', audience: 'seller', code: resetCode, name: seller.firstName, email, minutes: 60 })
    });

    // Return success response
    res.json({ message: 'Password reset code sent successfully.' });
  } catch (error) {
    // Log error for debugging
    console.error('Forgot password error:', error);

    // Return error response
    res.status(500).json({
      message: 'Failed to send password reset code',
      error: error.message
    });
  }
};

// Reset password
const legacyResetPassword = async (req, res) => {
  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword) {
    return res.status(400).json({ message: 'Email, code, and new password are required.' });
  }

  try {
    const seller = await Seller.findOne({
      email,
      resetPasswordCode: code,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!seller) {
      return res.status(404).json({ message: 'Invalid or expired reset code.' });
    }

    // Update password and clear reset fields
    seller.password = newPassword;
    seller.resetPasswordCode = undefined;
    seller.resetPasswordExpires = undefined;
    await seller.save();

    res.json({ message: 'Password reset successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reset password', error: error.message });
  }
};

// Update seller's onboarding process
exports.updateOnboardingProcess = async (req, res) => {
  try {
    const { onboardingProcess } = req.body;

    // Find and update seller
    const seller = await Seller.findById(req.user.id);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    // Update the onboarding process
    seller.onboardingProcess = onboardingProcess;
    await seller.save();

    res.json({
      message: 'Onboarding process updated successfully',
      onboardingProcess: seller.onboardingProcess
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to update onboarding process',
      error: error.message
    });
  }
};

// Get seller's onboarding process
exports.getOnboardingProcess = async (req, res) => {
  try {
    // Find seller
    const seller = await Seller.findById(req.user.id);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    res.json({
      onboardingProcess: seller.onboardingProcess
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to retrieve onboarding process',
      error: error.message
    });
  }
};

// Add to sellerController.js - For store verification status changes
async function sendStoreVerificationEmail(seller, status) {
  const sellerMsg = {
    to: seller.email,
    from: process.env.EMAIL_FROM,
    subject: `Store Verification Status - ${status}`,
    html: `
      <div style="background-color: #1a1a1a; color: #ffffff; padding: 30px; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto;">
          <img src="https://res.cloudinary.com/dljgzevaj/image/upload/v1733928675/Group_178_iqez5h.png" alt="Auqli Logo" style="width: 150px; margin-bottom: 30px;">
          <h1 style="color: #4CAF50; margin-bottom: 20px;">Store Verification Update</h1>
          <p style="font-size: 16px; line-height: 1.5;">Your store verification status has been updated to: ${status}</p>
          ${status === 'VERIFIED' ?
        '<p style="font-size: 16px; line-height: 1.5;">Congratulations! You can now start selling on Auqli.</p>' :
        '<p style="font-size: 16px; line-height: 1.5;">Please check your dashboard for more details.</p>'
      }
          <hr style="border: 1px solid #333333; margin: 30px 0;">
          <p style="font-size: 12px; color: #999999; text-align: center;">© ${new Date().getFullYear()} Auqli. All rights reserved.</p>
        </div>
      </div>
    `
  };

  const adminMsg = {
    to: 'bolu@auqli.com',
    from: process.env.EMAIL_FROM,
    subject: `Store Verification Status Update - ${seller.storeName}`,
    html: `
      <div style="background-color: #1a1a1a; color: #ffffff; padding: 30px; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto;">
          <img src="https://res.cloudinary.com/dljgzevaj/image/upload/v1733928675/Group_178_iqez5h.png" alt="Auqli Logo" style="width: 150px; margin-bottom: 30px;">
          <h1 style="color: #4CAF50; margin-bottom: 20px;">Store Verification Status Update</h1>
          <p style="font-size: 16px; line-height: 1.5;">Store: ${seller.storeName}</p>
          <p style="font-size: 16px; line-height: 1.5;">New Status: ${status}</p>
          <p style="font-size: 16px; line-height: 1.5;">Seller: ${seller.firstName} ${seller.lastName}</p>
          <hr style="border: 1px solid #333333; margin: 30px 0;">
          <p style="font-size: 12px; color: #999999; text-align: center;">© ${new Date().getFullYear()} Auqli. All rights reserved.</p>
        </div>
      </div>
    `
  };

  await Promise.all([
    termiiEmailService.sendRawHTMLEmail({
      email: sellerMsg.to,
      subject: sellerMsg.subject,
      html: sellerMsg.html
    }),
    termiiEmailService.sendRawHTMLEmail({
      email: adminMsg.to,
      subject: adminMsg.subject,
      html: adminMsg.html
    })
  ]);
}

exports.updateStoreVerification = async (req, res) => {
  try {
    // ... existing verification update code ...

    await sendStoreVerificationEmail(seller, newStatus);

    res.json({ message: 'Store verification status updated successfully', seller });
  } catch (error) {
    // ... error handling ...
  }
};

// Get seller's followers
exports.getFollowers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const seller = await Seller.findById(req.user.id);

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    // Calculate pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = seller.followers.length;

    // Get paginated followers
    const followers = seller.followers.slice(startIndex, endIndex);

    // Get additional order information for each follower
    const followersWithDetails = await Promise.all(
      followers.map(async (follower) => {
        // Get all orders from this follower with this seller, excluding stale and cancelled
        const orders = await Order.find({
          buyer: follower.buyerId,
          'items.seller': seller._id,
          isStale: { $ne: true },
          status: { $ne: 'cancelled' }
        });

        // Get buyer details including profile image
        const buyer = await Buyer.findById(follower.buyerId);

        // Calculate total amount spent
        const totalSpent = orders.reduce((sum, order) => {
          // Sum up only the items from this seller in each order
          const sellerItems = order.items.filter(item =>
            item.seller.toString() === seller._id.toString()
          );
          return sum + sellerItems.reduce((itemSum, item) =>
            itemSum + (item.price * item.quantity), 0
          );
        }, 0);

        return {
          ...follower.toObject(),
          totalOrders: orders.length,
          totalSpent: totalSpent,
          name: `${follower.firstName} ${follower.lastName}`,
          followedAt: follower.followDate,
          profileImageUrl: buyer?.profileImage?.url || null // Add profile image URL
        };
      })
    );

    res.json({
      followers: followersWithDetails,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        current: page,
        hasMore: endIndex < total
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to retrieve followers',
      error: error.message
    });
  }
};

// Get detailed buyer information
exports.getBuyerDetails = async (req, res) => {
  try {
    const { buyerId } = req.params;
    const sellerId = req.user.id;

    // Get buyer information with relevant fields
    const buyer = await Buyer.findById(buyerId).select(
      'firstName lastName email phoneNumber country profileImage createdAt shippingAddresses isIdentityVerified preferredLanguage preferredCurrency'
    );

    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }

    // Get all orders for this buyer with this seller, excluding stale and cancelled
    const orders = await Order.find({
      buyer: buyerId,
      seller: sellerId,
      isStale: { $ne: true },
      status: { $ne: 'cancelled' }
    })
      .populate('items.product', 'name images price category')
      .sort({ createdAt: -1 });

    // Get recent 5 orders with details, excluding stale and cancelled
    const recentOrders = await Order.find({
      buyer: buyerId,
      seller: sellerId,
      isStale: { $ne: true },
      status: { $ne: 'cancelled' }
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('items.product', 'name images price');

    // Calculate order statistics
    const orderStats = {
      totalOrders: orders.length,
      totalSpent: orders.reduce((sum, order) => sum + order.totalAmount, 0),
      averageOrderValue: orders.length > 0
        ? orders.reduce((sum, order) => sum + order.totalAmount, 0) / orders.length
        : 0,
      firstOrderDate: orders.length > 0 ? orders[orders.length - 1].createdAt : null,
      lastOrderDate: orders.length > 0 ? orders[0].createdAt : null,
      orderFrequency: orders.length > 0
        ? (orders.length / ((new Date() - new Date(orders[orders.length - 1].createdAt)) / (1000 * 60 * 60 * 24 * 30))).toFixed(2) + ' orders/month'
        : '0 orders/month'
    };

    // Get purchase categories distribution
    const categoryPurchases = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        if (!item.product || !item.product.category) return; // Skip if product or category is null

        const category = item.product.category;
        if (!categoryPurchases[category]) {
          categoryPurchases[category] = {
            category,
            quantity: 0,
            totalSpent: 0
          };
        }
        categoryPurchases[category].quantity += item.quantity;
        categoryPurchases[category].totalSpent += item.price * item.quantity;
      });
    });

    // Get top purchases - Modified to handle null products
    const productPurchases = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        if (!item.product) return; // Skip if product is null

        const productId = item.product._id.toString();
        if (!productPurchases[productId]) {
          productPurchases[productId] = {
            productId,
            name: item.product.name || 'Product Unavailable',
            quantity: 0,
            totalSpent: 0,
            seller: {
              id: sellerId,
              name: order.seller?.storeName || 'Unknown Store'
            }
          };
        }
        productPurchases[productId].quantity += item.quantity;
        productPurchases[productId].totalSpent += item.price * item.quantity;
      });
    });

    const topPurchases = Object.values(productPurchases)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);

    // Calculate payment methods distribution
    const paymentMethods = {};
    orders.forEach(order => {
      const method = order.paymentInfo?.method || 'unknown';
      if (!paymentMethods[method]) {
        paymentMethods[method] = {
          method,
          count: 0,
          totalAmount: 0
        };
      }
      paymentMethods[method].count += 1;
      paymentMethods[method].totalAmount += order.totalAmount;
    });

    // Get order status distribution
    const orderStatusDistribution = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        const status = item.status || 'unknown';
        if (!orderStatusDistribution[status]) {
          orderStatusDistribution[status] = 0;
        }
        orderStatusDistribution[status] += 1;
      });
    });

    const response = {
      buyerInfo: {
        firstName: buyer.firstName,
        lastName: buyer.lastName,
        email: buyer.email,
        phoneNumber: buyer.phoneNumber,
        country: buyer.country,
        joinDate: buyer.createdAt,
        profileImageUrl: buyer.profileImage?.url || null,
        isIdentityVerified: buyer.isIdentityVerified,
        preferredLanguage: buyer.preferredLanguage,
        preferredCurrency: buyer.preferredCurrency,
        accountAge: `${Math.floor((new Date() - new Date(buyer.createdAt)) / (1000 * 60 * 60 * 24))} days`
      },
      orderStats,
      purchaseInsights: {
        topCategories: Object.values(categoryPurchases)
          .sort((a, b) => b.totalSpent - a.totalSpent),
        paymentMethods: Object.values(paymentMethods),
        orderStatusDistribution
      },
      shippingAddresses: buyer.shippingAddresses,
      topPurchases,
      recentOrders: recentOrders.map(order => ({
        _id: order._id,
        orderNumber: order.order_id,
        totalAmount: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt,
        paymentMethod: order.paymentInfo?.method || 'unknown',
        isCashOnDelivery: order.paymentInfo?.isCashOnDelivery || false,
        items: order.items.map(item => ({
          product: item.product ? {
            name: item.product.name,
            images: item.product.images,
            price: item.price
          } : {
            name: 'Product Unavailable',
            images: [],
            price: item.price
          },
          quantity: item.quantity,
          status: item.status
        }))
      })),
      hasOrderedFromSeller: orders.length > 0
    };

    res.json(response);

  } catch (error) {
    console.error('Error getting buyer details:', error);
    res.status(500).json({
      message: 'Failed to get buyer details',
      error: error.message
    });
  }
};

// Request password reset
const legacyRequestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    const seller = await Seller.findOne({ email });
    if (!seller) {
      return res.status(404).json({ message: 'No account found with this email' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Update only the password reset fields
    const updateResult = await Seller.updateOne(
      { _id: seller._id },
      {
        $set: {
          passwordResetToken: hashedToken,
          passwordResetExpires: Date.now() + 3600000 // 1 hour
        }
      }
    );

    if (!updateResult.modifiedCount) {
      throw new Error('Failed to update seller with reset token');
    }

    // Send email with reset link
    const msg = {
      to: email,
      from: process.env.EMAIL_FROM,
      subject: 'Reset Your Auqli Password',
      html: `
        <div style="background-color: #1a1a1a; color: #ffffff; padding: 30px; font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto;">
            <img src="https://res.cloudinary.com/dljgzevaj/image/upload/v1733928675/Group_178_iqez5h.png" alt="Auqli Logo" style="width: 150px; margin-bottom: 30px;">
            <h1 style="color: #4CAF50; margin-bottom: 20px;">Reset Your Password</h1>
            <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Hi there,</p>
            <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">We received a request to reset your password. Click the button below to create a new password:</p>
            <div style="text-align: center; margin-bottom: 30px;">
              <a href="${sellerAppUrl()}/forgot-password?token=${resetToken}"
                 style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p style="font-size: 14px; color: #999999;">This link will expire in 1 hour. If you didn't request this reset, please ignore this email.</p>
            <hr style="border: 1px solid #333333; margin: 30px 0;">
            <p style="font-size: 12px; color: #999999; text-align: center;">© ${new Date().getFullYear()} Auqli. All rights reserved.</p>
          </div>
        </div>
      `
    };

    Object.assign(msg, authEmail(msg, { kind: 'reset', audience: 'seller', name: seller.firstName, email, minutes: 60, url: `${sellerAppUrl()}/forgot-password?token=${resetToken}` }));
    await termiiEmailService.sendRawHTMLEmail({
      email: msg.to,
      subject: msg.subject,
      html: msg.html
    });

    res.json({
      message: 'Password reset link sent successfully',
      valid: true
    });

  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({
      message: 'Failed to process password reset request',
      error: error.message
    });
  }
};

// Verify reset token
const legacyVerifyResetToken = async (req, res) => {
  try {
    const { token } = req.body;

    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const seller = await Seller.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!seller) {
      return res.status(400).json({
        message: 'Invalid or expired reset token',
        valid: false
      });
    }

    res.json({
      message: 'Token is valid',
      valid: true
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      message: 'Failed to verify reset token',
      error: error.message
    });
  }
};

// Reset password with token
const legacyResetPasswordWithToken = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        message: 'Token and new password are required'
      });
    }

    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const seller = await Seller.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!seller) {
      return res.status(404).json({
        message: 'Invalid or expired reset token'
      });
    }

    // Update only password and reset token fields
    const updateResult = await Seller.updateOne(
      { _id: seller._id },
      {
        $set: {
          password: await bcrypt.hash(newPassword, 10)
        },
        $unset: {
          passwordResetToken: 1,
          passwordResetExpires: 1
        }
      }
    );

    if (!updateResult.modifiedCount) {
      throw new Error('Failed to update password');
    }

    // Send confirmation email
    const msg = {
      to: seller.email,
      from: process.env.EMAIL_FROM,
      subject: 'Your Auqli Password Has Been Reset',
      html: `
        <div style="background-color: #1a1a1a; color: #ffffff; padding: 30px; font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto;">
            <img src="https://res.cloudinary.com/dljgzevaj/image/upload/v1733928675/Group_178_iqez5h.png" alt="Auqli Logo" style="width: 150px; margin-bottom: 30px;">
            <h1 style="color: #4CAF50; margin-bottom: 20px;">Password Reset Successful</h1>
            <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Hi ${seller.firstName},</p>
            <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Your password has been successfully reset. You can now log in with your new password.</p>
            <p style="font-size: 14px; color: #999999;">If you didn't make this change, please contact our support team immediately.</p>
            <hr style="border: 1px solid #333333; margin: 30px 0;">
            <p style="font-size: 12px; color: #999999; text-align: center;">© ${new Date().getFullYear()} Auqli. All rights reserved.</p>
          </div>
        </div>
      `
    };

    await termiiEmailService.sendRawHTMLEmail({
      email: msg.to,
      subject: msg.subject,
      html: msg.html
    });

    res.json({
      message: 'Password reset successful'
    });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      message: 'Failed to reset password',
      error: error.message
    });
  }
};

// Get seller's top 3 most sold products
exports.getTopSoldProducts = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { startDate, endDate } = req.query;

    let topProducts = [];

    if (startDate && endDate) {
      // If date range is provided, calculate from Orders
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include the end date fully

      const aggregationPipeline = [
        {
          $match: {
            seller: new mongoose.Types.ObjectId(sellerId),
            createdAt: { $gte: start, $lte: end },
            status: { $ne: 'cancelled' },
            isStale: { $ne: true }
          }
        },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            totalSold: { $sum: '$items.quantity' }
          }
        },
        { $sort: { totalSold: -1 } },
        { $limit: 4 },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'productDetails'
          }
        },
        { $unwind: '$productDetails' },
        {
          $project: {
            name: '$productDetails.name',
            description: '$productDetails.description',
            price: '$productDetails.price',
            images: '$productDetails.images',
            category: '$productDetails.category',
            brand: '$productDetails.brand',
            stats: { soldCount: '$totalSold' },
            _id: '$productDetails._id' // Use product ID as the main ID
          }
        }
      ];

      topProducts = await Order.aggregate(aggregationPipeline);
    } else {
      // Default behavior: Fetch from Product stats
      topProducts = await Product.find({ seller: sellerId })
        .sort({ 'stats.soldCount': -1 })
        .limit(4) // Changed from 3 to 4
        .select('name description price images stats.soldCount category brand');

      // Ensure stats.soldCount is treated as stats.soldCount for consistency
      // The Mongoose result needs to be converted to object to be consistent with aggregation result if needed,
      // but actually the aggregation result mimics the product structure so it should be fine.
    }

    const formattedProducts = topProducts.map(product => {
      // Validating and formatting the output
      const obj = product.toObject ? product.toObject() : product;

      // Ensure stats object exists
      if (!obj.stats) {
        obj.stats = { soldCount: 0 };
      }

      // Ensure soldCount is non-negative
      if (typeof obj.stats.soldCount === 'number') {
        obj.stats.soldCount = Math.max(0, obj.stats.soldCount);
      }

      return obj;
    });

    res.json(formattedProducts);
  } catch (error) {
    console.error('Error fetching top sold products:', error);
    res.status(500).json({
      message: 'Failed to retrieve top sold products',
      error: error.message
    });
  }
};

// Create withdrawal request
exports.createWithdrawalRequest = async (req, res) => {
  try {
    if(process.env.LEGACY_WITHDRAWAL_REQUESTS!=='true'){try{const withdrawal=await require('../services/reviewedWithdrawals').request(req.user.id,Number(req.body?.amount));return res.json({success:true,withdrawal});}catch(error){return res.status(error.status || 500).json({message:error.status?error.message:'Couldn’t request your withdrawal. Please try again.'});}}
    const { amount, bankDetails } = req.body;
    const seller = await Seller.findById(req.user.id);

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    if (amount > seller.walletBalance) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    // Check if bank details are verified (backward compatible)
    // If isBankVerified field doesn't exist (old sellers), allow withdrawal
    // For new/updated sellers, require verification
    if (seller.isBankVerified === false) {
      return res.status(400).json({
        success: false,
        message: 'Bank account not verified. Please verify your bank details before making a withdrawal.',
        requiresVerification: true
      });
    }

    // Validate bank details
    if (!bankDetails.bankName || !bankDetails.accountNumber || !bankDetails.accountName || !bankDetails.bankIdentifierCode) {
      return res.status(400).json({ message: 'All bank details are required (bankName, accountNumber, accountName, bankIdentifierCode)' });
    }

    const withdrawal = new Withdrawal({
      seller: seller._id,
      amount,
      bankDetails,
      notes: [{
        content: 'Withdrawal request created',
        addedBy: 'seller'
      }]
    });

    await withdrawal.save();

    // Send email notifications asynchronously (non-blocking)
    const emailMsg = {
      to: seller.email,
      from: process.env.EMAIL_FROM,
      subject: 'Withdrawal Request Received',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Withdrawal Request Received</h2>
          <p>Dear ${seller.firstName},</p>
          <p>Your withdrawal request for ${amount} has been received and is being processed.</p>
          <p>Reference: ${withdrawal.reference}</p>
          <p>Status: Pending</p>
          <p>We will notify you once the status changes.</p>
          <p>Best regards,<br>The Auqli Team</p>
        </div>
      `
    };

    // Send email notification to Slack payout channel
    const slackPayoutMsg = {
      to: 'seller-payouts-aaaaqyrdz6flakixbbdhmldhjm@auqli.slack.com',
      from: process.env.EMAIL_FROM,
      subject: 'New Seller Withdrawal Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New Seller Withdrawal Request</h2>
          <p><strong>Seller:</strong> ${seller.firstName} ${seller.lastName} (${seller.email})</p>
          <p><strong>Store Name:</strong> ${seller.storeName || 'N/A'}</p>
          <p><strong>Amount:</strong> ₦${amount.toLocaleString()}</p>
          <p><strong>Bank Details:</strong></p>
          <ul>
            <li><strong>Bank Name:</strong> ${bankDetails.bankName}</li>
            <li><strong>Account Name:</strong> ${bankDetails.accountName}</li>
            <li><strong>Account Number:</strong> ${bankDetails.accountNumber}</li>
            <li><strong>Bank Identifier Code:</strong> ${bankDetails.bankIdentifierCode}</li>
          </ul>
          <p><strong>Reference:</strong> ${withdrawal.reference}</p>
          <p><strong>Request Date:</strong> ${withdrawal.requestDate ? withdrawal.requestDate.toLocaleString() : new Date().toLocaleString()}</p>
        </div>
      `
    };

    // Send emails without blocking the response (non-blocking)
    Promise.all([
      termiiEmailService.sendRawHTMLEmail({
        email: emailMsg.to,
        subject: emailMsg.subject,
        html: emailMsg.html
      }),
      termiiEmailService.sendRawHTMLEmail({
        email: 'bolu@auqli.com', // fallback or intended recipient for slack payouts
        subject: slackPayoutMsg.subject,
        html: slackPayoutMsg.html
      })
    ])
      .then(() => {
        console.log(`✅ Withdrawal notification emails sent successfully for withdrawal ${withdrawal.reference}`);
      })
      .catch((emailError) => {
        console.error('⚠️ Email sending failed for withdrawal request, but withdrawal was created successfully:', {
          withdrawalRef: withdrawal.reference,
          error: emailError.message,
          code: emailError.code,
          sellerId: seller._id
        });
      });

    res.json({
      message: 'Withdrawal request created successfully',
      withdrawal
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to create withdrawal request',
      error: error.message
    });
  }
};

// Get withdrawal requests
exports.getWithdrawalRequests = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ seller: req.user.id })
      .sort({ requestDate: -1 });

    res.json(withdrawals);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch withdrawal requests',
      error: error.message
    });
  }
};


// Update store profile
exports.updateStoreProfile = async (req, res) => {
  try {
    const { storeName, aboutStore, categories } = req.body;
    if(storeName !== undefined && (typeof storeName !== 'string' || storeName.trim().length < 2))return res.status(400).json({message:'Add your store name before saving.'});
    const seller = await Seller.findById(req.user.id);

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    // Update store information
    if (storeName) seller.storeName = storeName;
    if (aboutStore) seller.aboutStore = aboutStore;
    if (categories) seller.categories = categories;

    // Update completion flags
    seller.hasFilledCategoryDetails = !!categories?.length;

    const updatedSeller = await seller.save();
    res.json({ message: 'Store profile updated successfully', seller: updatedSeller });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update store profile', error: error.message });
  }
};

// Toggle vacation mode
exports.toggleVacationMode = async (req, res) => {
  try {
    const { isOn } = req.body;
    const sellerId = req.user.id;
    console.log('[VacationMode] Request:', { sellerId, isOn });

    if (typeof isOn !== 'boolean') {
      console.log('[VacationMode] isOn is not boolean');
      return res.status(400).json({ message: 'isOn must be a boolean value.' });
    }

    const seller = await Seller.findById(sellerId);
    if (!seller) {
      console.log('[VacationMode] Seller not found');
      return res.status(404).json({ message: 'Seller not found.' });
    }

    console.log('[VacationMode] Found seller, updating status...');

    // Update seller's vacation mode status
    seller.vacationMode.isOn = isOn;
    if (isOn) {
      seller.vacationMode.enabledAt = new Date();
      // Set all products to draft
      console.log('[VacationMode] Setting products to draft...');
      await Product.updateMany({ seller: sellerId }, { $set: { status: 'draft' } });
    } else {
      seller.vacationMode.disabledAt = new Date();
      // Set all products back to active
      console.log('[VacationMode] Setting products to active...');
      await Product.updateMany({ seller: sellerId, status: 'draft' }, { $set: { status: 'active' } });
    }

    console.log('[VacationMode] Saving seller...');
    await seller.save();

    // Send email notification
    console.log('[VacationMode] Sending email...');
    const msg = {
      to: seller.email,
      from: process.env.EMAIL_FROM,
      subject: `Vacation Mode ${isOn ? 'Enabled' : 'Disabled'}`,
      html: `
        <div style="background-color: #f8f8f8; color: #333333; padding: 20px; font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
            <img src="https://res.cloudinary.com/dljgzevaj/image/upload/v1733928675/Group_178_iqez5h.png" alt="Auqli Logo" style="width: 150px; margin-bottom: 20px;">
            <h1 style="color: #4CAF50; margin-bottom: 20px;">Vacation Mode Status Update</h1>
            <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Hi ${seller.firstName},</p>
            <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
              Your vacation mode has been successfully ${isOn ? 'enabled' : 'disabled'}.
            </p>
            ${isOn ? '<p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">All of your products are now set to draft and will not be visible to buyers.</p>' : '<p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Your products are now active and visible in the marketplace again.</p>'}
            <hr style="border: 1px solid #eeeeee; margin: 30px 0;">
            <p style="font-size: 12px; color: #999999; text-align: center;">© ${new Date().getFullYear()} Auqli Nigeria. All rights reserved.</p>
          </div>
        </div>
      `
    };

    // Send email notification (Non-blocking)
    termiiEmailService.sendRawHTMLEmail({
      email: msg.to,
      subject: msg.subject,
      html: msg.html
    }).then(() => {
      console.log('[VacationMode] Email sent successfully.');
    }).catch(err => {
      console.error('[VacationMode] Failed to send email (Non-blocking):', err.message);
    });

    res.json({
      message: `Vacation mode successfully ${isOn ? 'enabled' : 'disabled'}.`,
      vacationMode: seller.vacationMode
    });
  } catch (error) {
    console.error('[VacationMode] Error:', error);
    res.status(500).json({ message: 'Failed to toggle vacation mode.', error: error.message });
  }
};

// Get seller analytics
exports.getSellerAnalytics = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { period = 'month', startDate, endDate } = req.query;

    // Find the seller
    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    // Set date range based on period
    let dateFilter = {};
    const now = new Date();

    if (startDate && endDate) {
      dateFilter = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (period === 'week') {
      const oneWeekAgo = new Date(now);
      oneWeekAgo.setDate(now.getDate() - 7);
      dateFilter = { $gte: oneWeekAgo };
    } else if (period === 'month') {
      const oneMonthAgo = new Date(now);
      oneMonthAgo.setMonth(now.getMonth() - 1);
      dateFilter = { $gte: oneMonthAgo };
    } else if (period === 'year') {
      const oneYearAgo = new Date(now);
      oneYearAgo.setFullYear(now.getFullYear() - 1);
      dateFilter = { $gte: oneYearAgo };
    }

    // Get orders data (exclude stale orders)
    const Order = mongoose.model('Order');
    const orders = await Order.find({
      seller: sellerId,
      isStale: { $ne: true },
      createdAt: dateFilter
    }).populate('buyer', 'firstName lastName email');

    // Get products data with ACTUAL views
    const Product = mongoose.model('Product');
    const products = await Product.find({
      seller: sellerId
    }).sort({ createdAt: -1 });

    // Get streams data with more details
    const Stream = mongoose.model('Stream');
    const streams = await Stream.find({
      seller: sellerId,
      createdAt: dateFilter
    }).populate({
      path: 'viewers',
      select: 'firstName lastName'
    });

    // Calculate order statistics
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const fulfilledOrders = orders.filter(order => !order.isOpen).length;
    const pendingOrders = orders.filter(order => order.isOpen).length;

    // Calculate average order value
    const averageOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0;

    // Get unique buyers
    const uniqueBuyers = [...new Set(orders.map(order => order.buyer?._id?.toString()))].filter(Boolean).length;

    // Calculate customer retention
    const customerIds = orders.map(order => order.buyer?._id?.toString()).filter(Boolean);
    const buyerFrequency = {};
    customerIds.forEach(id => {
      buyerFrequency[id] = (buyerFrequency[id] || 0) + 1;
    });

    const repeatCustomers = Object.values(buyerFrequency).filter(count => count > 1).length;
    const repeatCustomerRate = uniqueBuyers > 0 ? (repeatCustomers / uniqueBuyers * 100).toFixed(2) : 0;

    // Get top products with actual view counts
    const topProducts = products.slice(0, 10).map(product => ({
      _id: product._id,
      name: product.name,
      sold: product.stats?.soldCount || 0,
      views: product.stats?.views || 0,
      stock: product.stockQuantity,
      price: product.price,
      imageUrl: product.images && product.images.length > 0 ? product.images[0].url : null,
      lastUpdated: product.updatedAt
    }));

    // Get most sold products
    const mostSoldProducts = [...products]
      .sort((a, b) => (b.stats?.soldCount || 0) - (a.stats?.soldCount || 0))
      .slice(0, 5)
      .map(product => ({
        _id: product._id,
        name: product.name,
        sold: product.stats?.soldCount || 0,
        views: product.stats?.views || 0,
        price: product.price,
        imageUrl: product.images && product.images.length > 0 ? product.images[0].url : null
      }));

    // Get most viewed products
    const mostViewedProducts = [...products]
      .sort((a, b) => (b.stats?.views || 0) - (a.stats?.views || 0))
      .slice(0, 5)
      .map(product => ({
        _id: product._id,
        name: product.name,
        views: product.stats?.views || 0,
        sold: product.stats?.soldCount || 0,
        price: product.price,
        imageUrl: product.images && product.images.length > 0 ? product.images[0].url : null
      }));

    // Get low stock products
    const lowStockProducts = products
      .filter(p => p.stockQuantity < (p.lowStockAlert || 5) && p.stockQuantity > 0)
      .map(product => ({
        _id: product._id,
        name: product.name,
        stock: product.stockQuantity,
        lowStockThreshold: product.lowStockAlert || 5,
        sold: product.stats?.soldCount || 0,
        views: product.stats?.views || 0,
        price: product.price,
        imageUrl: product.images && product.images.length > 0 ? product.images[0].url : null
      }));

    // Get stream analytics with richer data
    const totalStreams = streams.length;
    const liveStreams = streams.filter(stream => stream.status === 'live').length;
    const endedStreams = streams.filter(stream => stream.status === 'ended').length;
    const scheduledStreams = streams.filter(stream => stream.status === 'scheduled').length;

    const totalStreamViewers = streams.reduce((sum, stream) => sum + (stream.viewers?.length || 0), 0);
    const averageViewersPerStream = totalStreams > 0 ? (totalStreamViewers / totalStreams).toFixed(2) : 0;

    // Get recent streams with viewer data
    const recentStreams = streams
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(stream => ({
        _id: stream._id,
        title: stream.title,
        status: stream.status,
        scheduledStartTime: stream.scheduledStartTime,
        actualStartTime: stream.actualStartTime,
        endTime: stream.endTime,
        viewerCount: stream.viewers?.length || 0,
        productCount: stream.products?.length || 0,
        bidCount: stream.bids?.length || 0,
        orderCount: stream.orders?.length || 0
      }));

    // Get top performing streams
    const topPerformingStreams = [...streams]
      .sort((a, b) => (b.viewers?.length || 0) - (a.viewers?.length || 0))
      .slice(0, 3)
      .map(stream => ({
        _id: stream._id,
        title: stream.title,
        viewerCount: stream.viewers?.length || 0,
        orderCount: stream.orders?.length || 0,
        scheduledStartTime: stream.scheduledStartTime
      }));

    // Calculate revenue by date for chart data
    const revenueByDate = {};
    orders.forEach(order => {
      const date = order.createdAt.toISOString().split('T')[0];
      revenueByDate[date] = (revenueByDate[date] || 0) + order.totalAmount;
    });

    const chartData = Object.keys(revenueByDate).sort().map(date => ({
      date,
      revenue: revenueByDate[date]
    }));

    // Orders by channel
    const ordersByChannel = orders.reduce((acc, order) => {
      const channel = order.channel || 'marketplace';
      acc[channel] = (acc[channel] || 0) + 1;
      return acc;
    }, {});

    // Revenue by channel
    const revenueByChannel = orders.reduce((acc, order) => {
      const channel = order.channel || 'marketplace';
      acc[channel] = (acc[channel] || 0) + order.totalAmount;
      return acc;
    }, {});

    // Get recent orders with enhanced data
    const recentOrders = orders
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(order => ({
        _id: order._id,
        order_id: order.order_id,
        buyerName: order.buyer ? `${order.buyer.firstName} ${order.buyer.lastName}` : 'Unknown',
        totalAmount: order.totalAmount,
        date: order.createdAt,
        status: order.isOpen ? 'Open' : 'Closed',
        items: order.items.length,
        channel: order.channel || 'marketplace',
        shippingStatus: order.shipping?.tracking?.status || 'pending'
      }));

    // Get followers info (but omit unnecessary details)
    const followersCount = seller.followers?.length || 0;
    const recentFollowers = seller.followers
      ?.filter(follower => follower.firstName && follower.lastName) // Filter out incomplete records
      ?.slice(0, 5)
      ?.map(follower => ({
        _id: follower.buyerId,
        name: `${follower.firstName} ${follower.lastName}`,
        email: follower.email,
        followDate: follower.followDate,
        orderCount: follower.totalOrders || 0
      })) || [];

    // Get store visit data
    const storeVisits = seller.storeVisits || 0;

    // Use properly formatted monthly stats
    const storeVisitsByMonth = {};
    if (seller.monthlyStats && seller.monthlyStats.storeVisits) {
      Object.entries(seller.monthlyStats.storeVisits).forEach(([key, value]) => {
        // Convert keys like '2025-3' to proper month names
        const [year, month] = key.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        const monthName = date.toLocaleString('default', { month: 'long' });
        storeVisitsByMonth[`${monthName} ${year}`] = value;
      });
    }

    // Generate insights and recommendations
    const insights = [];
    const recommendations = [];

    // Revenue insights
    if (totalOrders > 0) {
      insights.push(`Your average order value is ₦${parseFloat(averageOrderValue).toLocaleString()}.`);

      // Check if there's a significant portion of liveshows vs marketplace
      const liveshowOrders = ordersByChannel['liveshow'] || 0;
      const liveshowPercentage = (liveshowOrders / totalOrders) * 100;

      if (liveshowPercentage > 30) {
        insights.push(`${liveshowPercentage.toFixed(0)}% of your orders come from live shows.`);
        recommendations.push("Your live shows are performing well. Consider increasing the frequency of your streams.");
      } else if (liveStreams > 0 || endedStreams > 0) {
        recommendations.push("Consider featuring more products in your live streams to increase conversions.");
      }
    }

    // Customer insights
    if (uniqueBuyers > 0) {
      insights.push(`You have a ${repeatCustomerRate}% repeat customer rate.`);

      if (parseFloat(repeatCustomerRate) < 30) {
        recommendations.push("Your repeat customer rate is relatively low. Consider implementing a loyalty program or sending follow-up emails.");
      } else if (parseFloat(repeatCustomerRate) > 60) {
        insights.push("You have a strong loyal customer base!");
        recommendations.push("Leverage your loyal customers by introducing referral bonuses or exclusive products.");
      }
    }

    // Product insights
    if (lowStockProducts.length > 0) {
      insights.push(`You have ${lowStockProducts.length} products with low stock (below their threshold).`);
      recommendations.push("Restock your low inventory items soon to avoid missed sales opportunities.");
    }

    // Check for products with zero sales
    if (products.length > 0) {
      const productsWithZeroSales = products.filter(p => !p.stats?.soldCount || p.stats.soldCount === 0).length;
      const percentageZeroSales = (productsWithZeroSales / products.length) * 100;

      if (percentageZeroSales > 30) {
        insights.push(`${percentageZeroSales.toFixed(0)}% of your products have no sales.`);
        recommendations.push("Consider updating your product listings or running promotions for items that aren't selling.");
      }

      // Add insights for products with high views but low sales
      const productsWithViewsButNoSales = products.filter(p =>
        (p.stats?.views || 0) > 10 && (!p.stats?.soldCount || p.stats.soldCount === 0)
      ).length;

      if (productsWithViewsButNoSales > 0) {
        insights.push(`You have ${productsWithViewsButNoSales} products with significant views but no sales.`);
        recommendations.push("Review pricing or product details for items that get views but don't convert to sales.");
      }
    }

    // Stream insights
    if (totalStreams > 0) {
      insights.push(`Your streams average ${averageViewersPerStream} viewers per session.`);

      if (parseFloat(averageViewersPerStream) < 5) {
        recommendations.push("Promote your upcoming streams more actively to increase viewership.");
      }

      const conversionRate = streams.reduce((sum, stream) => {
        const viewers = stream.viewers?.length || 0;
        const orders = stream.orders?.length || 0;
        return viewers > 0 ? sum + (orders / viewers) : sum;
      }, 0) / totalStreams;

      if (conversionRate > 0) {
        insights.push(`Your stream-to-sale conversion rate is ${(conversionRate * 100).toFixed(1)}%.`);

        if (conversionRate < 0.05) {
          recommendations.push("Try more engaging sales techniques during your streams to improve conversion.");
        } else if (conversionRate > 0.2) {
          insights.push("Your stream conversion rate is excellent!");
        }
      }
    }

    // Prepare final response with enhanced data
    const analytics = {
      summary: {
        totalOrders,
        totalRevenue,
        averageOrderValue,
        uniqueBuyers,
        totalProducts: products.length,
        totalStreams,
        storeVisits,
        walletBalance: seller.walletBalance || 0,
        followersCount,
        ratingsAverage: seller.stats?.averageRating || 0,
        totalReviews: seller.stats?.totalReviews || 0
      },
      insights,
      recommendations,
      ordersData: {
        fulfilledOrders,
        pendingOrders,
        repeatCustomerRate,
        recentOrders,
        ordersByChannel,
        revenueByChannel
      },
      productsData: {
        topProducts,
        mostSoldProducts,
        mostViewedProducts,
        lowStockProducts,
        outOfStockCount: products.filter(p => p.stockQuantity === 0).length,
        totalProductsSold: products.reduce((sum, product) => sum + (product.stats?.soldCount || 0), 0),
        totalProductViews: products.reduce((sum, product) => sum + (product.stats?.views || 0), 0)
      },
      streamsData: {
        liveStreams,
        endedStreams,
        scheduledStreams,
        averageViewersPerStream,
        totalStreamViewers,
        recentStreams,
        topPerformingStreams,
        cancelledStreams: seller.cancelledStreamCount || 0
      },
      followersData: {
        totalFollowers: followersCount,
        recentFollowers
      },
      chartData,
      ratingsDistribution: seller.stats?.ratingDistribution || {
        1: 0, 2: 0, 3: 0, 4: 0, 5: 0
      },
      storeVisitsByMonth: Object.entries(storeVisitsByMonth).map(([month, count]) => ({
        month,
        count
      }))
    };

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching seller analytics:', error);
    res.status(500).json({
      message: 'Failed to fetch analytics',
      error: error.message
    });
  }
};

// Update warehouse details
exports.updateWarehouseDetails = async (req, res) => {
  try {
    if (!require('../services/serviceArea').inServiceArea(req.body.warehouseDetails?.address?.state)) return res.status(422).json({ code: 'out_of_area', message: require('../services/serviceArea').pickupMessage() });
    const { warehouseDetails } = req.body;
    const seller = await Seller.findById(req.user.id);

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    Object.assign(warehouseDetails.address, require('../services/areaDirectory').validateArea(warehouseDetails.address));
    seller.warehouseDetails = warehouseDetails;
    seller.hasFilledWarehouseAddress = true;

    const updatedSeller = await seller.save();
    res.json({ message: 'Warehouse details updated successfully', seller: updatedSeller });
  } catch (error) {
    if (error.code === 'invalid_area') return res.status(400).json({message:error.message});
    res.status(500).json({ message: 'Failed to update warehouse details', error: error.message });
  }
};

// Update business address
exports.updateBusinessAddress = async (req, res) => {
  try {
    if (!require('../services/serviceArea').inServiceArea(req.body.businessAddress?.state)) return res.status(422).json({ code: 'out_of_area', message: require('../services/serviceArea').pickupMessage() });
    const { businessAddress } = req.body;
    const seller = await Seller.findById(req.user.id);

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    Object.assign(businessAddress, require('../services/areaDirectory').validateArea(businessAddress));
    seller.businessAddress = businessAddress;
    seller.hasFilledBusinessAddress = true;

    const updatedSeller = await seller.save();
    res.json({ message: 'Business address updated successfully', seller: updatedSeller });
  } catch (error) {
    if (error.code === 'invalid_area') return res.status(400).json({message:error.message});
    res.status(500).json({ message: 'Failed to update business address', error: error.message });
  }
};

// Update notification preferences
exports.updateNotificationPreferences = async (req, res) => {
  try {
    const { emailNotifications, pushNotifications, notificationTypes } = req.body;
    const seller = await Seller.findById(req.user.id);

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    seller.notificationPreferences = {
      emailNotifications,
      pushNotifications,
      notificationTypes
    };

    const updatedSeller = await seller.save();
    res.json({ message: 'Notification preferences updated successfully', seller: updatedSeller });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update notification preferences', error: error.message });
  }
};

// Get seller's reviews
exports.getSellerReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'recent' } = req.query;
    const sellerId = req.user.id;

    const seller = await Seller.findById(sellerId)
      .populate({
        path: 'reviews.buyer',
        select: 'firstName lastName profileImage'
      });

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    // Sort reviews based on query parameter
    let sortedReviews = [...seller.reviews];
    switch (sort) {
      case 'rating-high':
        sortedReviews.sort((a, b) => b.rating - a.rating);
        break;
      case 'rating-low':
        sortedReviews.sort((a, b) => a.rating - b.rating);
        break;
      case 'recent':
      default:
        sortedReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedReviews = sortedReviews.slice(startIndex, endIndex);

    // Calculate total pages
    const totalReviews = seller.reviews.length;
    const totalPages = Math.ceil(totalReviews / limit);

    res.json({
      reviews: paginatedReviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalReviews,
        hasMore: endIndex < totalReviews
      },
      stats: seller.stats
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch reviews', error: error.message });
  }
};

// Reply to a review
exports.replyToReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { content } = req.body;
    const sellerId = req.user.id;

    // Validate input
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Reply content is required' });
    }

    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    // Find the review
    const review = seller.reviews.id(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Add or update reply
    review.reply = {
      content: content.trim(),
      createdAt: review.reply ? review.reply.createdAt : new Date(),
      updatedAt: new Date()
    };

    await seller.save();

    // If this is a new reply (not an update), send notification to buyer
    if (!review.reply.createdAt) {
      // Assuming you have a notification system
      try {
        await notificationController.createNotification({
          recipient: 'buyer',
          buyer: review.buyer,
          type: 'review_reply',
          title: 'Seller replied to your review',
          message: `${seller.storeName || seller.businessName} has replied to your review`,
          data: {
            sellerId: seller._id,
            reviewId: review._id
          }
        });
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
      }
    }

    res.json({
      message: 'Reply added successfully',
      review
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add reply', error: error.message });
  }
};

// Get seller's review statistics
exports.getReviewStats = async (req, res) => {
  try {
    const sellerId = req.user.id;

    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    const stats = {
      averageRating: seller.stats.averageRating,
      totalReviews: seller.stats.totalReviews,
      ratingDistribution: seller.stats.ratingDistribution,
      verifiedPurchaseCount: seller.reviews.filter(review => review.isVerifiedPurchase).length
    };

    res.json(stats);

  } catch (error) {
    console.error('Error in getReviewStats:', error);
    res.status(500).json({
      message: 'Failed to retrieve review statistics',
      error: error.message
    });
  }
};

// Get campaign metrics
exports.getCampaignMetrics = async (req, res) => {
  try {
    const seller = await Seller.findById(req.user.id)
      .select('campaignStats')
      .populate({
        path: 'campaigns',
        select: 'metrics status createdAt',
        options: { sort: { createdAt: -1 }, limit: 5 }
      });

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    // Calculate engagement rates
    const metrics = {
      ...seller.campaignStats,
      recentCampaigns: seller.campaigns,
      engagementRate: seller.campaignStats.totalRecipients > 0
        ? ((seller.campaignStats.totalOpens / seller.campaignStats.totalRecipients) * 100).toFixed(2)
        : 0,
      clickThroughRate: seller.campaignStats.totalOpens > 0
        ? ((seller.campaignStats.totalClicks / seller.campaignStats.totalOpens) * 100).toFixed(2)
        : 0
    };

    res.json(metrics);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to retrieve campaign metrics',
      error: error.message
    });
  }
};

// Get active followers for campaigns
exports.getActiveFollowers = async (req, res) => {
  try {
    const seller = await Seller.findById(req.user.id);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    const { audienceType = 'all' } = req.query;
    let followers;

    switch (audienceType) {
      case 'active':
        followers = seller.followers.filter(f =>
          f.lastInteraction &&
          new Date(f.lastInteraction) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) &&
          !f.optedOut
        );
        break;
      case 'inactive':
        followers = seller.followers.filter(f =>
          (!f.lastInteraction ||
            new Date(f.lastInteraction) <= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) &&
          !f.optedOut
        );
        break;
      default:
        followers = seller.followers.filter(f => !f.optedOut);
    }

    res.json({
      totalFollowers: followers.length,
      followers: followers.map(f => ({
        id: f.buyerId,
        name: `${f.firstName} ${f.lastName}`,
        email: f.email,
        followDate: f.followDate,
        lastInteraction: f.lastInteraction
      }))
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to retrieve followers',
      error: error.message
    });
  }
};

// Update campaign related notification preferences
exports.updateCampaignPreferences = async (req, res) => {
  try {
    const { campaignMetrics } = req.body;
    const seller = await Seller.findById(req.user.id);

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    seller.notificationPreferences.notificationTypes.campaignMetrics = campaignMetrics;
    await seller.save();

    res.json({
      message: 'Campaign preferences updated successfully',
      preferences: seller.notificationPreferences
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to update campaign preferences',
      error: error.message
    });
  }
};

exports.getAllReviews = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const {
      page = 1,
      limit = 20,
      type = 'all',
      sortBy = 'newest'
    } = req.query;

    // Validate seller exists
    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    // Build aggregation pipeline
    const matchSeller = { $match: { seller: new mongoose.Types.ObjectId(sellerId) } };

    // Get reviews from different sources based on type
    const [productReviews, postComments, storeReviews] = await Promise.all([
      type === 'all' || type === 'product' ?
        Product.aggregate([
          matchSeller,
          { $unwind: '$reviews' },
          {
            $replaceRoot: {
              newRoot: {
                $mergeObjects: [
                  '$reviews',
                  {
                    type: 'product',
                    source: {
                      type: 'product',
                      id: '$_id',
                      name: '$name',
                      image: { $arrayElemAt: ['$images.url', 0] }
                    }
                  }
                ]
              }
            }
          }
        ]) : [],

      type === 'all' || type === 'post' ?
        Post.aggregate([
          { $match: { 'author.userId': new mongoose.Types.ObjectId(sellerId) } },
          { $unwind: '$comments' },
          {
            $replaceRoot: {
              newRoot: {
                $mergeObjects: [
                  '$comments',
                  {
                    type: 'post',
                    source: {
                      type: 'post',
                      id: '$_id',
                      name: '$title',
                      image: { $arrayElemAt: ['$media.url', 0] }
                    }
                  }
                ]
              }
            }
          }
        ]) : [],

      type === 'all' || type === 'store' ?
        Seller.aggregate([
          { $match: { _id: new mongoose.Types.ObjectId(sellerId) } },
          { $unwind: '$reviews' },
          {
            $replaceRoot: {
              newRoot: {
                $mergeObjects: [
                  '$reviews',
                  { type: 'store' }
                ]
              }
            }
          }
        ]) : []
    ]);

    // Get blip comments (separate query due to nested structure)
    let blipComments = [];
    if (type === 'all' || type === 'blip') {
      const products = await Product.find({ seller: sellerId });
      for (const product of products) {
        if (product.blips && product.blips.length > 0) {
          for (const blip of product.blips) {
            if (blip.comments && blip.comments.length > 0) {
              const formattedComments = blip.comments.map(comment => ({
                ...comment.toObject(),
                type: 'blip',
                source: {
                  type: 'blip',
                  id: blip._id,
                  name: `${product.name} - Blip`,
                  image: blip.thumbnail || blip.url
                }
              }));
              blipComments.push(...formattedComments);
            }
          }
        }
      }
    }

    // Combine all reviews
    let allReviews = [
      ...productReviews,
      ...blipComments,
      ...postComments,
      ...storeReviews
    ];

    // Sort reviews
    switch (sortBy) {
      case 'oldest':
        allReviews.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'rating':
        allReviews.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      default: // newest
        allReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // Calculate stats
    const stats = {
      averageRating: calculateAverageRating(allReviews),
      totalReviews: allReviews.length,
      reviewsByType: {
        product: productReviews.length,
        blip: blipComments.length,
        post: postComments.length,
        store: storeReviews.length
      }
    };

    // Paginate results
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedReviews = allReviews.slice(startIndex, endIndex);

    res.json({
      reviews: paginatedReviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(allReviews.length / limit),
        totalReviews: allReviews.length
      },
      stats
    });

  } catch (error) {
    console.error('Error in getAllReviews:', error);
    res.status(500).json({
      message: 'Failed to retrieve reviews',
      error: error.message
    });
  }
};

// Helper function to calculate average rating
function calculateAverageRating(reviews) {
  const ratedReviews = reviews.filter(review => review.rating);
  if (ratedReviews.length === 0) return 0;

  const sum = ratedReviews.reduce((acc, review) => acc + review.rating, 0);
  return (sum / ratedReviews.length).toFixed(1);
}

// Follow a buyer
exports.followBuyer = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { buyerId } = req.params;

    const [buyer, seller] = await Promise.all([
      Buyer.findById(buyerId),
      Seller.findById(sellerId)
    ]);

    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }

    // Initialize followers array if it doesn't exist
    if (!buyer.followers) {
      buyer.followers = [];
    }

    // Check if already following
    const isAlreadyFollowing = buyer.followers.some(
      follower => follower.sellerId && follower.sellerId.toString() === sellerId
    );

    if (isAlreadyFollowing) {
      return res.status(400).json({ message: 'Already following this buyer' });
    }

    // Add to buyer's followers list
    buyer.followers.push({
      sellerId: seller._id,
      storeName: seller.storeName,
      businessName: seller.businessName,
      followDate: new Date(),
      lastInteraction: new Date()
    });

    await buyer.save();

    // Create notification for buyer using createBuyerNotification
    await notificationController.createBuyerNotification(
      buyerId,
      'new_follower',
      {
        sellerId: seller._id,
        sellerName: seller.storeName || seller.businessName || `${seller.firstName} ${seller.lastName}`,
        followDate: new Date()
      }
    );

    res.json({
      message: 'Successfully followed buyer',
      followData: buyer.followers[buyer.followers.length - 1]
    });
  } catch (error) {
    console.error('Follow buyer error:', error);
    res.status(500).json({
      message: 'Failed to follow buyer',
      error: error.message
    });
  }
};

// Unfollow a buyer
exports.unfollowBuyer = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { buyerId } = req.params;

    const buyer = await Buyer.findById(buyerId);
    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }

    // Remove from followers list
    buyer.followers = buyer.followers.filter(
      follower => follower.sellerId.toString() !== sellerId
    );

    await buyer.save();

    res.json({ message: 'Successfully unfollowed buyer' });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to unfollow buyer',
      error: error.message
    });
  }
};

// Get list of buyers that the seller follows
exports.getFollowedBuyers = async (req, res) => {
  try {
    const sellerId = req.user.id;

    const buyers = await Buyer.find({
      'followers.sellerId': sellerId
    }).select('firstName lastName email followers');

    const followedBuyers = buyers.map(buyer => {
      const followerData = buyer.followers.find(f => f.sellerId.toString() === sellerId);
      return {
        buyerId: buyer._id,
        firstName: buyer.firstName,
        lastName: buyer.lastName,
        email: buyer.email,
        followDate: followerData.followDate,
        lastInteraction: followerData.lastInteraction
      };
    });

    res.json(followedBuyers);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to get followed buyers',
      error: error.message
    });
  }
};

// Get seller's transactions
exports.getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const sellerId = req.user.id;

    // Get seller for wallet balance
    const seller = await Seller.findById(sellerId).select('walletBalance');
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    // Get total count for pagination
    const totalTransactions = await Transaction.countDocuments({ seller: sellerId });
    const totalPages = Math.ceil(totalTransactions / limit);

    // Get transactions with order details
    const transactions = await Transaction.find({ seller: sellerId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({
        path: 'orderId',
        select: 'items totalAmount order_id',
        populate: {
          path: 'items.product',
          select: 'name category'
        }
      });

    // Process transactions to include detailed information
    const processedTransactions = await Promise.all(transactions.map(async (transaction) => {
      const orderDetails = transaction.orderId ? {
        items: transaction.orderId.items.map(item => ({
          productName: item.product?.name || 'Product Unavailable',
          quantity: item.quantity,
          price: item.price,
          category: item.product?.category,
          platformFee: transaction.metadata?.categoryFee || 0
        })),
        totalAmount: transaction.orderId.totalAmount
      } : null;

      let description = transaction.description;
      let platformFee = 0;
      let processingFee = 0;
      let netAmount = transaction.amount;
      let deductions = 0;

      switch (transaction.type) {
        case 'platform_fee':
          const categoryFee = transaction.metadata?.categoryFee || 0;
          const categoryName = transaction.metadata?.categoryName || 'Unknown';
          description = `Platform fee for order #${transaction.orderId?.order_id} (${categoryFee}% for ${categoryName})`;
          deductions = transaction.amount;
          netAmount = -transaction.amount;
          break;

        case 'processing_fee':
          description = `Payment processing fee for order #${transaction.orderId?.order_id} (1.5%)`;
          deductions = transaction.amount;
          netAmount = -transaction.amount;
          break;

        case 'order_payment':
          // Get associated fees for this order
          const relatedFees = await Transaction.find({
            orderId: transaction.orderId?._id,
            seller: transaction.seller,
            type: { $in: ['platform_fee', 'processing_fee'] }
          });

          // Calculate fees
          platformFee = relatedFees
            .filter(fee => fee.type === 'platform_fee')
            .reduce((sum, fee) => sum + fee.amount, 0);

          processingFee = relatedFees
            .filter(fee => fee.type === 'processing_fee')
            .reduce((sum, fee) => sum + fee.amount, 0);

          deductions = platformFee + processingFee;
          netAmount = transaction.amount - deductions;

          description = `Payment received for order #${transaction.orderId?.order_id} (${transaction.amount.toLocaleString()} - ${deductions.toLocaleString()} in fees = ${netAmount.toLocaleString()})`;
          break;

        case 'withdrawal':
          netAmount = -transaction.amount;
          break;
      }

      return {
        _id: transaction._id,
        type: transaction.type,
        amount: transaction.amount,
        deductions,
        netAmount,
        orderId: transaction.orderId?.order_id,
        description,
        status: transaction.status,
        createdAt: transaction.createdAt,
        orderDetails,
        metadata: transaction.metadata,
        breakdown: transaction.type === 'order_payment' ? {
          grossAmount: transaction.amount,
          platformFee,
          processingFee,
          totalDeductions: deductions,
          netAmount
        } : null
      };
    }));



    // Calculate summary with more detailed breakdown
    const summary = await calculateTransactionSummary(sellerId);

    res.json({
      transactions: processedTransactions,
      summary: {
        ...summary,
        currentBalance: seller.walletBalance,
        breakdown: {
          grossEarnings: summary.totalEarnings,
          platformFees: summary.totalPlatformFees,
          processingFees: summary.totalProcessingFees,
          totalDeductions: summary.totalPlatformFees + summary.totalProcessingFees,
          netEarnings: summary.totalEarnings - (summary.totalPlatformFees + summary.totalProcessingFees),
          totalWithdrawals: summary.totalWithdrawals
        }
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalTransactions
      }
    });

  } catch (error) {
    console.error('Error getting transactions:', error);
    res.status(500).json({ message: 'Failed to get transactions', error: error.message });
  }
};


// Validate time format (HH:mm)
const isValidTimeFormat = (time) => {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

async function calculateTransactionSummary(sellerId) {
  const [orderPayments, platformFees, processingFees, withdrawals] = await Promise.all([
    Transaction.aggregate([
      { $match: { seller: new mongoose.Types.ObjectId(sellerId), type: 'order_payment' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Transaction.aggregate([
      { $match: { seller: new mongoose.Types.ObjectId(sellerId), type: 'platform_fee' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Transaction.aggregate([
      { $match: { seller: new mongoose.Types.ObjectId(sellerId), type: 'processing_fee' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Transaction.aggregate([
      { $match: { seller: new mongoose.Types.ObjectId(sellerId), type: 'withdrawal' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])
  ]);

  return {
    totalEarnings: orderPayments[0]?.total || 0,
    totalPlatformFees: platformFees[0]?.total || 0,
    totalProcessingFees: processingFees[0]?.total || 0,
    totalWithdrawals: withdrawals[0]?.total || 0
  };
}

// Update operating hours
exports.updateOperatingHours = async (req, res) => {
  try {
    const { operatingHours, timezone } = req.body;
    const seller = await Seller.findById(req.user.id);

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    // Validate time formats
    for (const day in operatingHours) {
      const { openTime, closeTime, isOpen } = operatingHours[day];

      if (isOpen && (!isValidTimeFormat(openTime) || !isValidTimeFormat(closeTime))) {
        return res.status(400).json({
          message: `Invalid time format for ${day}. Use HH:mm format (e.g., 09:00)`
        });
      }
    }

    seller.operatingHours = operatingHours;
    if (timezone) seller.timezone = timezone;

    await seller.save();

    res.json({
      message: 'Operating hours updated successfully',
      operatingHours: seller.operatingHours,
      timezone: seller.timezone
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to update operating hours',
      error: error.message
    });
  }
};

// Add special dates
exports.addSpecialDates = async (req, res) => {
  try {
    const { specialDates } = req.body;
    const seller = await Seller.findById(req.user.id);

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    // Validate dates and times
    for (const dateInfo of specialDates) {
      const { date, isOpen, openTime, closeTime } = dateInfo;

      if (!date || typeof isOpen !== 'boolean') {
        return res.status(400).json({
          message: 'Each special date must include a valid date and isOpen status'
        });
      }

      if (isOpen && openTime && closeTime) {
        if (!isValidTimeFormat(openTime) || !isValidTimeFormat(closeTime)) {
          return res.status(400).json({
            message: 'Invalid time format. Use HH:mm format (e.g., 09:00)'
          });
        }
      }
    }

    // Add new special dates
    seller.specialDates = [
      ...seller.specialDates,
      ...specialDates.map(date => ({
        ...date,
        date: new Date(date.date)
      }))
    ];

    // Sort special dates by date
    seller.specialDates.sort((a, b) => a.date - b.date);

    await seller.save()

    res.json({
      message: 'Special dates added successfully',
      specialDates: seller.specialDates
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to add special dates',
      error: error.message
    });
  }
};

// Update store policy
exports.updateStorePolicy = async (req, res) => {
  try {
    const {
      deliveryTimes,
      freeShippingPolicy,
      lostOrDamagedPolicy,
      refundPolicy,
      processingTime,
      refundMethod,
      nonRefundableItems,
      returnWindow,
      returnCondition,
      returnShipping,
      exchangePolicy,
      allowsCod
    } = req.body;

    const seller = await Seller.findById(req.user.id);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    seller.storePolicy = {
      deliveryTimes,
      freeShippingPolicy,
      lostOrDamagedPolicy,
      refundPolicy,
      processingTime,
      refundMethod,
      nonRefundableItems,
      returnWindow,
      returnCondition,
      returnShipping,
      exchangePolicy,
      allowsCod
    };

    const updatedSeller = await seller.save();
    res.json({ message: 'Store policy updated successfully', seller: updatedSeller });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update store policy', error: error.message });
  }
};

/**
 * Toggle store pickup availability
 * @route PUT /api/seller/store-pickup
 * @access Private
 */
exports.toggleStorePickup = async (req, res) => {
  try {
    const { offersStorePickup } = req.body;

    if (typeof offersStorePickup !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'offersStorePickup must be a boolean value'
      });
    }

    const seller = await Seller.findById(req.user.id);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    seller.offersStorePickup = offersStorePickup;
    await seller.save();

    return res.status(200).json({
      success: true,
      message: 'Store pickup setting updated successfully',
      offersStorePickup: seller.offersStorePickup
    });
  } catch (error) {
    console.error('Toggle store pickup error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update store pickup setting',
      error: error.message
    });
  }
};

/**
 * Update seller's social media information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateSocialMedia = async (req, res) => {
  try {
    const { instagram, facebook, tiktok } = req.body;
    const sellerId = req.user.id;

    // Find the seller
    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    // Update social media information
    seller.socialMedia = {
      instagram: instagram || seller.socialMedia?.instagram,
      facebook: facebook || seller.socialMedia?.facebook,
      tiktok: tiktok || seller.socialMedia?.tiktok
    };

    // Save the updated seller
    await seller.save();

    res.status(200).json({
      message: 'Social media information updated successfully',
      socialMedia: seller.socialMedia
    });
  } catch (error) {
    console.error('Error updating social media information:', error);
    res.status(500).json({ message: 'Error updating social media information', error: error.message });
  }
};

/**
 * Get all product reviews for a seller
 * @route GET /api/seller/:sellerId/product-reviews
 * @access Public
 */
exports.getAllProductReviews = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { page = 1, limit = 10, sort = 'recent' } = req.query;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);

    // Verify sellerId is valid and get seller information
    const Seller = require('../models/Seller');
    const seller = await Seller.findById(sellerId).select('firstName lastName businessName storeName storeAvatar');

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    // Get seller display information
    const sellerInfo = {
      _id: seller._id,
      name: seller.storeName || seller.businessName || `${seller.firstName} ${seller.lastName}`,
      avatar: seller.storeAvatar?.url || null
    };

    // Find all products by this seller
    const Product = require('../models/Product');

    // Get all products with reviews by this seller
    const products = await Product.find({
      seller: sellerId,
      'reviews.0': { $exists: true } // Only get products that have at least one review
    }).select('name price description images reviews');

    // Extract all reviews from all products with product info
    let allReviews = [];
    products.forEach(product => {
      const productInfo = {
        _id: product._id,
        name: product.name,
        price: product.price,
        description: product.description,
        image: product.images && product.images.length > 0 ? product.images[0].url : null
      };

      product.reviews.forEach(review => {
        // Add enhanced reply with seller info
        const enhancedReply = review.reply ? {
          ...review.reply.toObject(),
          seller: sellerInfo
        } : null;

        allReviews.push({
          reviewId: review._id,
          product: productInfo,
          buyer: {
            _id: review.buyer,
            firstName: review.firstName,
            lastName: review.lastName
          },
          rating: review.rating,
          title: review.title,
          comment: review.comment,
          images: review.images,
          createdAt: review.createdAt,
          reply: enhancedReply
        });
      });
    });

    // Apply sorting
    if (sort === 'recent') {
      allReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sort === 'rating-high') {
      allReviews.sort((a, b) => b.rating - a.rating);
    } else if (sort === 'rating-low') {
      allReviews.sort((a, b) => a.rating - b.rating);
    } else if (sort === 'replied') {
      allReviews.sort((a, b) => (b.reply?.content ? 1 : 0) - (a.reply?.content ? 1 : 0));
    } else if (sort === 'unreplied') {
      allReviews.sort((a, b) => (a.reply?.content ? 1 : 0) - (b.reply?.content ? 1 : 0));
    }

    // Apply pagination
    const totalReviews = allReviews.length;
    const totalPages = Math.ceil(totalReviews / limitNumber);
    const startIndex = (pageNumber - 1) * limitNumber;
    const endIndex = pageNumber * limitNumber;
    const paginatedReviews = allReviews.slice(startIndex, endIndex);

    // Calculate stats
    const averageRating = allReviews.length > 0
      ? allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length
      : 0;

    const ratingDistribution = {
      1: allReviews.filter(review => review.rating === 1).length,
      2: allReviews.filter(review => review.rating === 2).length,
      3: allReviews.filter(review => review.rating === 3).length,
      4: allReviews.filter(review => review.rating === 4).length,
      5: allReviews.filter(review => review.rating === 5).length
    };

    const repliedCount = allReviews.filter(review => review.reply && review.reply.content).length;

    res.json({
      sellerId,
      sellerInfo,
      reviews: paginatedReviews,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalReviews,
        hasMore: endIndex < totalReviews
      },
      stats: {
        averageRating,
        ratingDistribution,
        totalReviews,
        repliedCount,
        unrepliedCount: totalReviews - repliedCount
      }
    });
  } catch (error) {
    console.error('Error in getAllProductReviews:', error);
    res.status(500).json({ message: 'Failed to retrieve product reviews', error: error.message });
  }
};

/**
 * Get details of a specific review for a seller's product
 * @route GET /api/seller/product/:productId/review/:reviewId
 * @access Private (Seller only)
 */
exports.getSellerProductReviewDetails = async (req, res) => {
  try {
    const { productId, reviewId } = req.params;
    const sellerId = req.user.id;

    // Find the product and verify it belongs to this seller
    const Product = require('../models/Product');
    const product = await Product.findOne({
      _id: productId,
      seller: sellerId
    }).select('name price description images reviews seller');

    if (!product) {
      return res.status(404).json({
        message: 'Product not found or does not belong to you'
      });
    }

    // Find the specific review
    const review = product.reviews.id(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Get buyer details
    const Buyer = require('../models/Buyer');
    const buyer = await Buyer.findById(review.buyer)
      .select('firstName lastName profileImage');

    // Get seller details
    const Seller = require('../models/Seller');
    const seller = await Seller.findById(sellerId)
      .select('firstName lastName businessName storeName storeAvatar');

    const sellerInfo = {
      _id: seller._id,
      name: seller.storeName || seller.businessName || `${seller.firstName} ${seller.lastName}`,
      avatar: seller.storeAvatar?.url || null
    };

    // Format the response
    const reviewDetails = {
      reviewId: review._id,
      product: {
        _id: product._id,
        name: product.name,
        price: product.price,
        description: product.description,
        image: product.images && product.images.length > 0 ? product.images[0].url : null
      },
      buyer: {
        _id: buyer?._id || review.buyer,
        firstName: buyer?.firstName || review.firstName || 'Anonymous',
        lastName: buyer?.lastName || review.lastName || 'User',
        profileImage: buyer?.profileImage?.url || null
      },
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      images: review.images || [],
      purchasedVariant: review.purchasedVariant || {},
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      reply: review.reply ? {
        ...review.reply.toObject(),
        seller: sellerInfo
      } : null
    };

    res.json(reviewDetails);
  } catch (error) {
    console.error('Error in getSellerProductReviewDetails:', error);
    res.status(500).json({
      message: 'Failed to retrieve review details',
      error: error.message
    });
  }
};

/**
 * Get details of a specific review for a product (public access)
 * @route GET /api/seller/public/product/:productId/review/:reviewId
 * @access Public
 */
exports.getPublicProductReviewDetails = async (req, res) => {
  try {
    const { productId, reviewId } = req.params;

    // Find the product
    const Product = require('../models/Product');
    const product = await Product.findById(productId)
      .select('name price description images reviews seller');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Find the specific review
    const review = product.reviews.id(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Get buyer details
    const Buyer = require('../models/Buyer');
    const buyer = await Buyer.findById(review.buyer)
      .select('firstName lastName profileImage');

    // Get seller details
    const Seller = require('../models/Seller');
    const seller = await Seller.findById(product.seller)
      .select('firstName lastName businessName storeName storeAvatar');

    const sellerInfo = {
      _id: seller._id,
      name: seller.storeName || seller.businessName || `${seller.firstName} ${seller.lastName}`,
      avatar: seller.storeAvatar?.url || null
    };

    // Format the response
    const reviewDetails = {
      reviewId: review._id,
      product: {
        _id: product._id,
        name: product.name,
        price: product.price,
        description: product.description,
        image: product.images && product.images.length > 0 ? product.images[0].url : null
      },
      buyer: {
        _id: buyer?._id || review.buyer,
        firstName: buyer?.firstName || review.firstName || 'Anonymous',
        lastName: buyer?.lastName || review.lastName || 'User',
        profileImage: buyer?.profileImage?.url || null
      },
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      images: review.images || [],
      purchasedVariant: review.purchasedVariant || {},
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      reply: review.reply ? {
        ...review.reply.toObject(),
        seller: sellerInfo
      } : null
    };

    res.json(reviewDetails);
  } catch (error) {
    console.error('Error in getPublicProductReviewDetails:', error);
    res.status(500).json({
      message: 'Failed to retrieve review details',
      error: error.message
    });
  }
};

// Function to search sellers based on various criteria
exports.searchSellers = async (req, res) => {
  try {
    const {
      query = '',
      country,
      category,
      page = 1,
      limit = 10
    } = req.query;

    console.log('Search Sellers - Auth Info:', {
      userId: req.user?.id,
      userRole: req.user?.role,
      isAuthenticated: !!req.user
    });

    // Build search query
    const searchQuery = {
      isDisabled: false, // Only return active sellers
      'vacationMode.isOn': { $ne: true } // Exclude sellers with vacation mode ON
    };

    // Search by name (first name, last name), business name, or store name
    if (query) {
      searchQuery.$or = [
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } },
        { businessName: { $regex: query, $options: 'i' } },
        { storeName: { $regex: query, $options: 'i' } },
      ];
    }

    // Filter by country if provided
    if (country) {
      searchQuery.$or = [
        { 'sellerAddress.country': country },
        { 'businessAddress.country': country },
        { 'warehouseDetails.address.country': country }
      ];
    }

    // Filter by category if provided
    if (category) {
      searchQuery['categories.name'] = category;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Check if the user is authenticated (buyer) to determine if following
    const buyerId = req.user?.id;
    const isBuyer = req.user?.role === 'Buyer';

    console.log('Buyer authentication check:', { buyerId, isBuyer });

    // Find sellers matching criteria
    const sellers = await Seller.find(searchQuery)
      .select('firstName lastName businessName storeName storeAvatar socialMedia aboutStore businessAddress sellerAddress warehouseDetails.address categories followers')
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    console.log(`Found ${sellers.length} sellers matching criteria`);

    // Get total count for pagination
    const totalSellers = await Seller.countDocuments(searchQuery);

    // Get buyer document if authenticated
    let buyer = null;
    if (isBuyer && buyerId) {
      const Buyer = require('../models/Buyer');
      buyer = await Buyer.findById(buyerId).select('followers').lean();
      console.log('Buyer followers found:', buyer?.followers?.length || 0);
    }

    // Get additional data for sellers (isLive and itemsCount)
    const sellerIds = sellers.map(seller => seller._id);

    // Check for active streams (isLive)
    const Stream = require('../models/Stream');
    const activeStreams = await Stream.find({
      seller: { $in: sellerIds },
      status: 'live'
    }).select('seller').lean();

    const sellerLiveStatus = {};
    activeStreams.forEach(stream => {
      sellerLiveStatus[stream.seller.toString()] = true;
    });

    // Count active products (itemsCount)
    const Product = require('../models/Product');
    const productCounts = await Product.aggregate([
      {
        $match: {
          seller: { $in: sellerIds },
          status: 'active',
          visibility: 'visible'
        }
      },
      {
        $group: {
          _id: '$seller',
          count: { $sum: 1 }
        }
      }
    ]);

    const sellerItemCounts = {};
    productCounts.forEach(item => {
      sellerItemCounts[item._id.toString()] = item.count;
    });

    // Process sellers to add isFollowing property if user is authenticated
    const processedSellers = sellers.map(seller => {
      const sellerIdStr = seller._id.toString();

      // Create a clean seller object with only necessary information
      const cleanSeller = {
        _id: seller._id,
        businessName: seller.businessName,
        storeName: seller.storeName,
        storeAvatar: seller.storeAvatar?.url || null,
        followerCount: seller.followers?.length || 0,
        isLive: sellerLiveStatus[sellerIdStr] || false,
        itemsCount: sellerItemCounts[sellerIdStr] || 0,
        // Default isFollowing to false
        isFollowing: false
      };

      // Update isFollowing if user is authenticated as a buyer
      if (isBuyer && buyerId && buyer) {
        const sellerId = seller._id.toString();

        // Method 1: Check if buyer is in seller's followers list
        let isFollowing = false;

        if (Array.isArray(seller.followers)) {
          isFollowing = seller.followers.some(follower =>
            follower.buyerId && follower.buyerId.toString() === buyerId
          );
          console.log(`Method 1 - Seller followers check for buyer ${buyerId}: ${isFollowing}`);
        }

        // Method 2: If not found, check if seller is in buyer's followed list
        if (!isFollowing && Array.isArray(buyer.followers)) {
          isFollowing = buyer.followers.some(followed =>
            followed.sellerId && followed.sellerId.toString() === sellerId
          );
          console.log(`Method 2 - Buyer followed check for seller ${sellerId}: ${isFollowing}`);
        }

        cleanSeller.isFollowing = isFollowing;
        console.log(`Final isFollowing for seller ${sellerId}: ${isFollowing}`);
      }

      return cleanSeller;
    });

    res.status(200).json({
      success: true,
      sellers: processedSellers,
      pagination: {
        total: totalSellers,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalSellers / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Search sellers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search sellers',
      error: error.message
    });
  }
};

/**
 * @desc   Toggle seller account pending status
 * @route  PUT /api/seller/account-pending
 * @access Private
 */
exports.toggleAccountPending = async (req, res) => {
  try {
    const { status } = req.body;

    if (typeof status !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Status must be a boolean value (true or false)'
      });
    }

    const seller = await Seller.findById(req.user.id);

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    seller.accountPending = status;
    await seller.save();

    // Send email notification to admin if seller has completed onboarding (status = true)
    if (status === true) {
      try {
        const adminMsg = {
          to: 'admin@auqli.com',
          from: process.env.EMAIL_FROM,
          subject: `Seller Onboarding Completed - ${seller.storeName || seller.firstName + ' ' + seller.lastName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>New Seller Onboarding Completed</h2>
              <p>A seller has just completed their onboarding process and is ready for review.</p>
              <p><strong>Seller Details:</strong></p>
              <ul>
                <li>Name: ${seller.firstName} ${seller.lastName}</li>
                <li>Store Name: ${seller.storeName || 'N/A'}</li>
                <li>Email: ${seller.email}</li>
                <li>Phone: ${seller.phoneNumber}</li>
                <li>Account Type: ${seller.accountType || 'N/A'}</li>
                <li>Business Name: ${seller.businessName || 'N/A'}</li>
              </ul>
              <p>Please review this account at your earliest convenience.</p>
              <p>Best regards,<br>Auqli Team</p>
            </div>
          `
        };

        await termiiEmailService.sendRawHTMLEmail({
          email: adminMsg.to,
          subject: adminMsg.subject,
          html: adminMsg.html
        });
        console.log(`Onboarding completion notification email sent to admin for seller: ${seller._id}`);
      } catch (emailError) {
        console.error('Error sending onboarding notification email:', emailError);
        // Continue execution despite email error - don't block the API response
      }
    }

    return res.status(200).json({
      success: true,
      message: `Account pending status updated to ${status}`,
      accountPending: seller.accountPending
    });
  } catch (error) {
    console.error('Toggle account pending error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update account pending status',
      error: error.message
    });
  }
};

// Mark seller as verified
exports.markVerified = async (req, res) => {
  try {
    const sellerId = req.user.id;

    // Find the seller
    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    // Check if already verified
    if (seller.isVerified) {
      return res.status(200).json({
        success: true,
        message: 'Your store is already verified',
        seller: seller
      });
    }

    // Update verification status
    seller.isVerified = true;
    const updatedSeller = await seller.save();

    // Track seller verification in mixpanel
    try {
      mixpanel.track('seller_self_verification', {
        distinct_id: seller._id.toString(),
        sellerId: seller._id.toString(),
        sellerName: seller.firstName + " " + seller.lastName,
        storeName: seller.storeName,
        email: seller.email,
        accountType: seller.accountType
      });
    } catch (trackingError) {
      console.error('Failed to track verification event:', trackingError);
    }

    // Send verification confirmation email
    try {
      const msg = {
        to: seller.email,
        from: process.env.EMAIL_FROM,
        subject: 'Your Auqli Store is Now Verified',
        html: `
          <div style="background-color: #f8f8f8; color: #333333; padding: 20px; font-family: Arial, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
              <img src="https://res.cloudinary.com/dljgzevaj/image/upload/v1733928675/Group_178_iqez5h.png" alt="Auqli Logo" style="width: 150px; margin-bottom: 20px;">
              <h1 style="color: #4CAF50; margin-bottom: 20px;">Your Store is Now Verified!</h1>
              <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Congratulations ${seller.firstName}!</p>
              <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Your store "${seller.storeName}" is now verified on Auqli. This means your products can appear in featured listings and you'll have access to all seller features.</p>
              <div style="background-color: #f0f8ff; padding: 20px; border-radius: 5px; margin-bottom: 30px;">
                <h3 style="color: #4CAF50; margin-bottom: 15px;">What's Next:</h3>
                <ul style="color: #333333; margin-bottom: 0;">
                  <li style="margin-bottom: 10px;">✅ Add more products to your store</li>
                  <li style="margin-bottom: 10px;">✅ Schedule your first live stream</li>
                  <li style="margin-bottom: 10px;">✅ Promote your store on social media</li>
                </ul>
              </div>
              <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Need help? Contact our seller support team at <a href="mailto:support@auqli.com">support@auqli.com</a>.</p>
              <hr style="border: 1px solid #eeeeee; margin: 30px 0;">
              <p style="font-size: 12px; color: #999999; text-align: center;">© ${new Date().getFullYear()} Auqli Nigeria. All rights reserved.</p>
            </div>
          </div>
        `
      };

      await termiiEmailService.sendRawHTMLEmail({
        email: msg.to,
        subject: msg.subject,
        html: msg.html
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Continue execution even if email sending fails
    }

    return res.status(200).json({
      success: true,
      message: 'Your store has been successfully verified',
      seller: updatedSeller
    });
  } catch (error) {
    console.error('Error in markVerified:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify store',
      error: error.message
    });
  }
};

// Check seller verification status
exports.checkVerificationStatus = async (req, res) => {
  try {
    const sellerId = req.user.id;

    const seller = await Seller.findById(sellerId);

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    return res.status(200).json({
      success: true,
      verification: {
        isVerified: seller.isVerified,
        emailVerified: seller.emailVerified,
        accountPending: seller.accountPending,
        storeName: seller.storeName
      },
      seller: seller
    });
  } catch (error) {
    console.error('Error checking verification status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check verification status',
      error: error.message
    });
  }
};
// Inactive legacy handlers above are retained for reference; resets always use the hardened service.
const resetService=require('../services/auth/passwordReset');
const resetHandler=fn=>async(req,res)=>{try{res.json(await fn(req.body||{}));}catch(e){res.status(e.status||500).json({message:e.status?e.message:'Couldn’t reset your password. Please try again.'});}};
exports.forgotPassword=resetHandler(b=>resetService.issue('Seller',b.email));
exports.requestPasswordReset=resetHandler(b=>resetService.issue('Seller',b.email,{link:true}));
exports.resetPassword=resetHandler(b=>resetService.reset('Seller',b));
exports.verifyResetToken=resetHandler(b=>resetService.verifyLink('Seller',b.token));
exports.resetPasswordWithToken=resetHandler(b=>resetService.reset('Seller',b));
