const Admin = require('../models/Admin');
const Buyer = require('../models/Buyer');
const Seller = require('../models/Seller');
const Product = require('../models/Product');
const Category = require('../models/Category'); 
const Banner = require('../models/Banner'); 
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const Order = require('../models/Order');
const Announcement = require('../models/Annoucement');
const Withdrawal = require('../models/Withdrawal');

const sgMail = require('@sendgrid/mail');
const mongoose = require('mongoose');
const axios = require('axios');
const paystack = axios.create({
  baseURL: 'https://api.paystack.co',
  headers: {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json'
  }
});

sgMail.setApiKey('SG.REDACTED');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const newAdmin = new Admin({ username, email, password });
    await newAdmin.save();
    res.status(201).json({ message: 'Admin registered successfully!' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const admin = await Admin.findOne({ username });
    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



exports.getProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id);
    res.json(admin);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.getAllUsers = async (req, res) => {
  try {
    const users = await Buyer.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllSellers = async (req, res) => {
  try {
    const sellers = await Seller.find();
    res.json(sellers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.disableSeller = async (req, res) => {
  const { sellerId } = req.params;

  try {
    const seller = await Seller.findByIdAndUpdate(
      sellerId, 
      { isDisabled: true }, 
      { new: true }
    );

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    // Send notification emails
    const emailMsg = {
      to: seller.email,
      from: 'Auqli Admin <joseph@auqli.com>',
      subject: 'Important: Your Auqli Account Has Been Disabled',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Account Status Update</h2>
          <p>Dear ${seller.firstName},</p>
          <p>Your Auqli seller account has been temporarily disabled. This may be due to:</p>
          <ul>
            <li>Violation of our terms of service</li>
            <li>Suspicious activity detected</li>
            <li>Multiple customer complaints</li>
            <li>Non-compliance with seller policies</li>
          </ul>
          <p>If you believe this is an error or would like to appeal this decision, please contact our support team at support@auqli.com</p>
          <p>Best regards,<br>Auqli Trust & Safety Team</p>
        </div>
      `
    };

    // Send to business email if it exists
    if (seller.businessEmail) {
      const businessEmailMsg = {
        to: seller.businessEmail,
        from: 'Auqli Admin <joseph@auqli.com>',
        subject: 'Important: Business Account Status Update - Auqli',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Business Account Disabled</h2>
            <p>Dear ${seller.businessName || seller.firstName},</p>
            <p>This is to inform you that your business account on Auqli has been disabled.</p>
            <p>While your account is disabled:</p>
            <ul>
              <li>Your products will not be visible in the marketplace</li>
              <li>You cannot process new orders</li>
              <li>Access to seller dashboard is restricted</li>
            </ul>
            <p>For immediate assistance or to appeal this decision, please contact our business support team.</p>
            <p>Best regards,<br>Auqli Business Support Team</p>
          </div>
        `
      };
      await sgMail.send(businessEmailMsg);
    }

    await sgMail.send(emailMsg);

    res.json({
      success: true,
      message: 'Seller account disabled successfully',
      seller
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to disable seller account',
      error: error.message
    });
  }
};

exports.disableBuyer = async (req, res) => {
  const { buyerId } = req.params;

  try {
    const buyer = await Buyer.findByIdAndUpdate(buyerId, { isDisabled: true }, { new: true });
    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }
    res.json(buyer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.enableBuyer = async (req, res) => {
  const { buyerId } = req.params;

  try {
    const buyer = await Buyer.findByIdAndUpdate(buyerId, { isDisabled: false }, { new: true });
    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }
    res.json(buyer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.enableSeller = async (req, res) => {
  const { sellerId } = req.params;

  try {
    const seller = await Seller.findByIdAndUpdate(
      sellerId, 
      { isDisabled: false }, 
      { new: true }
    );

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    // Send notification email
    const emailMsg = {
      to: seller.email,
      from: 'Auqli Admin <joseph@auqli.com>',
      subject: 'Good News! Your Auqli Account Has Been Reactivated 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Account Reactivated</h2>
          <p>Dear ${seller.firstName},</p>
          <p>We're pleased to inform you that your Auqli seller account has been reactivated. You now have full access to:</p>
          <ul>
            <li>List and manage products</li>
            <li>Process orders</li>
            <li>Access your seller dashboard</li>
            <li>Receive payments</li>
          </ul>
          <p><a href="${process.env.FRONTEND_URL}/seller/login" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login to Your Account</a></p>
          <p>Thank you for your patience during this process.</p>
          <p>Best regards,<br>The Auqli Team</p>
        </div>
      `
    };

    // Send to business email if it exists
    if (seller.businessEmail) {
      const businessEmailMsg = {
        to: seller.businessEmail,
        from: 'Auqli Admin <joseph@auqli.com>',
        subject: 'Business Account Reactivated - Auqli',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Business Account Reactivated</h2>
            <p>Dear ${seller.businessName || seller.firstName},</p>
            <p>Your business account on Auqli has been reactivated with full functionality restored.</p>
            <p>You can now:</p>
            <ul>
              <li>Access all business features</li>
              <li>List and manage products</li>
              <li>Process customer orders</li>
              <li>Access business analytics</li>
            </ul>
            <p>Thank you for your continued partnership with Auqli.</p>
            <p>Best regards,<br>Auqli Business Team</p>
          </div>
        `
      };
      await sgMail.send(businessEmailMsg);
    }

    await sgMail.send(emailMsg);

    res.json({
      success: true,
      message: 'Seller account enabled successfully',
      seller
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to enable seller account',
      error: error.message
    });
  }
};


exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().populate('seller');
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createCategory = async (req, res) => {
  const { name, image, subCategories } = req.body;

  try {
    let imageData = {};
    if (image) {
      const uploadResult = await cloudinary.uploader.upload(image, { folder: 'categories' });
      imageData = { url: uploadResult.secure_url, public_id: uploadResult.public_id };
    }

    const newCategory = new Category({ name, image: imageData, subCategories });
    await newCategory.save();
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};



exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.updateCategory = async (req, res) => {
  const { name, image, subCategories } = req.body;
  const { id } = req.params;

  try {
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (name) category.name = name;

    if (image) {
      if (category.image.public_id) {
        await cloudinary.uploader.destroy(category.image.public_id);
      }
      const uploadResult = await cloudinary.uploader.upload(image, { folder: 'categories' });
      category.image = { url: uploadResult.secure_url, public_id: uploadResult.public_id };
    }

    if (subCategories) {
      category.subCategories = subCategories;
    }

    const updatedCategory = await category.save();
    res.json({ message: 'Category updated successfully', category: updatedCategory });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update category', error: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  const { id } = req.params;

  try {
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (category.image.public_id) {
      await cloudinary.uploader.destroy(category.image.public_id);
    }

    await category.remove();
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete category', error: error.message });
  }
};

exports.getSubCategories = async (req, res) => {
  const { categoryId } = req.params;

  try {
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json(category.subCategories);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve subcategories', error: error.message });
  }
};



exports.markSellerAsFeatured = async (req, res) => {
  const { sellerId } = req.params;

  try {
    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    seller.isFeatured = !seller.isFeatured; // Toggle the isFeatured status
    await seller.save();

    res.json(seller);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.createBanner = async (req, res) => {
  const { title, description, mainImage, category, callToActionLink } = req.body;

  try {
    // Find the category by name (case-insensitive)
    const categoryDoc = await Category.findOne({ name: { $regex: new RegExp(category, 'i') } });
    if (!categoryDoc) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Upload mainImage if provided
    let mainImageData = { url: '', public_id: '' };
    if (mainImage) {
      const uploadResult = await cloudinary.uploader.upload(mainImage, { folder: 'banners' });
      mainImageData = { url: uploadResult.secure_url, public_id: uploadResult.public_id };
    }

    const newBanner = new Banner({
      title,
      description,
      mainImage: mainImageData,
      category: categoryDoc._id,
      callToActionLink,
    });
    await newBanner.save();

    // Populate the category field to get the category name
    const populatedBanner = await newBanner.populate('category').execPopulate();

    // Transform the response to include the category name
    const responseBanner = {
      ...populatedBanner.toObject(),
      category: populatedBanner.category.name,
    };

    res.status(201).json(responseBanner);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateBanner = async (req, res) => {
  const { bannerId } = req.params;
  const { title, description, mainImage, category, callToActionLink } = req.body;

  try {
    const banner = await Banner.findById(bannerId);
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }

    // Find the category by name if provided
    if (category) {
      const categoryDoc = await Category.findOne({ name: { $regex: new RegExp(category, 'i') } });
      if (!categoryDoc) {
        return res.status(404).json({ message: 'Category not found' });
      }
      banner.category = categoryDoc._id;
    }

    // Upload mainImage if provided
    if (mainImage) {
      const uploadResult = await cloudinary.uploader.upload(mainImage, { folder: 'banners' });
      banner.mainImage = { url: uploadResult.secure_url, public_id: uploadResult.public_id };
    }

    banner.title = title || banner.title;
    banner.description = description || banner.description;
    banner.callToActionLink = callToActionLink || banner.callToActionLink;

    await banner.save();

    // Populate the category field to get the category name
    const populatedBanner = await banner.populate('category').execPopulate();

    // Transform the response to include the category name
    const responseBanner = {
      ...populatedBanner.toObject(),
      category: populatedBanner.category.name,
    };

    res.json(responseBanner);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteBanner = async (req, res) => {
  const { bannerId } = req.params;

  try {
    const banner = await Banner.findByIdAndDelete(bannerId);
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }

    // Delete the image from Cloudinary
    if (banner.mainImage.public_id) {
      await cloudinary.uploader.destroy(banner.mainImage.public_id);
    }

    res.json({ message: 'Banner deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.find().populate('category');

    // Transform the response to include the category name
    const responseBanners = banners.map(banner => ({
      ...banner.toObject(),
      category: banner.category.name,
    }));

    res.json(responseBanners);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getBannersByCategory = async (req, res) => {
  const { categoryId } = req.params;

  try {
    const banners = await Banner.find({ category: categoryId }).populate('category');

    // Transform the response to include the category name
    const responseBanners = banners.map(banner => ({
      ...banner.toObject(),
      category: banner.category.name,
    }));

    res.json(responseBanners);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Get all orders for admin
exports.getAllOrdersAdmin = async (req, res) => {
  try {
    const orders = await Order.find().populate('user', 'firstName lastName').populate('seller', 'name');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve orders', error: error.message });
  }
};

// Update order status by admin
exports.updateOrderStatusAdmin = async (req, res) => {
  const { id } = req.params;
  const { status, deliveredAt } = req.body;

  try {
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = status || order.status;
    order.deliveredAt = deliveredAt || order.deliveredAt;

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update order', error: error.message });
  }
};

// Create a new announcement
exports.createAnnouncement = async (req, res) => {
  const { title, description } = req.body;

  try {
    const newAnnouncement = new Announcement({ title, description });
    await newAnnouncement.save();
    res.status(201).json({ message: 'Announcement created successfully!', announcement: newAnnouncement });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all announcements
exports.getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find();
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a single announcement by ID
exports.getAnnouncement = async (req, res) => {
  const { announcementId } = req.params;

  try {
    const announcement = await Announcement.findById(announcementId);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    res.json(announcement);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update an announcement by ID
exports.updateAnnouncement = async (req, res) => {
  const { announcementId } = req.params;
  const { title, description } = req.body;

  try {
    const announcement = await Announcement.findByIdAndUpdate(announcementId, { title, description }, { new: true });
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    res.json(announcement);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete an announcement by ID
exports.deleteAnnouncement = async (req, res) => {
  const { announcementId } = req.params;

  try {
    const announcement = await Announcement.findByIdAndDelete(announcementId);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    res.json({ message: 'Announcement deleted successfully!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Verify a seller's business account
exports.verifyBusinessAccount = async (req, res) => {
  const { sellerId } = req.params;

  try {
    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    seller.isVerified = true;
    await seller.save();

    // Send verification emails
    const personalEmailMsg = {
      to: seller.email,
      from: 'Auqli Admin <joseph@auqli.com>',
      subject: 'Your Auqli Account Has Been Verified! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Congratulations ${seller.firstName}!</h2>
          <p>Your Auqli seller account has been verified successfully. You can now:</p>
          <ul>
            <li>List products on the marketplace</li>
            <li>Access all seller features</li>
            <li>Process orders and receive payments</li>
          </ul>
          <p>Start selling today by logging into your account!</p>
          <p><a href="${process.env.FRONTEND_URL}/seller/login" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login to Your Account</a></p>
          <p>If you have any questions, please don't hesitate to contact our support team.</p>
          <p>Best regards,<br>The Auqli Team</p>
        </div>
      `
    };

    // Send to business email if it exists
    if (seller.businessEmail) {
      const businessEmailMsg = {
        to: seller.businessEmail,
        from: 'Auqli Admin <joseph@auqli.com>',
        subject: 'Business Account Verification Confirmed - Auqli',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Business Account Verified</h2>
            <p>Dear ${seller.businessName || seller.firstName},</p>
            <p>Your business account on Auqli has been verified. Here's what this means for your business:</p>
            <ul>
              <li>Full access to seller dashboard</li>
              <li>Ability to process unlimited orders</li>
              <li>Access to business analytics</li>
              <li>Priority customer support</li>
            </ul>
            <p>Business Details:</p>
            <ul>
              <li>Business Name: ${seller.businessName}</li>
              <li>Account Type: ${seller.accountType}</li>
              <li>Verification Status: Verified</li>
            </ul>
            <p>You can now start managing your business through our platform.</p>
            <p>Best regards,<br>Auqli Business Team</p>
          </div>
        `
      };
      await sgMail.send(businessEmailMsg);
    }

    await sgMail.send(personalEmailMsg);

    res.json({ 
      success: true,
      message: 'Account verified successfully', 
      seller 
    });

  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to verify account', 
      error: error.message 
    });
  }
};



// Get all orders with advanced filtering and search
exports.getAllOrders = async (req, res) => {
  try {
    const {
      status,
      startDate,
      endDate,
      sellerId,
      buyerId,
      minAmount,
      maxAmount,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    // Apply filters
    if (status) query['items.status'] = status;
    if (sellerId) query['items.seller'] = sellerId;
    if (buyerId) query.buyer = buyerId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    if (minAmount || maxAmount) {
      query.totalAmount = {};
      if (minAmount) query.totalAmount.$gte = Number(minAmount);
      if (maxAmount) query.totalAmount.$lte = Number(maxAmount);
    }

    const orders = await Order.find(query)
      .populate('buyer', 'firstName lastName email phoneNumber')
      .populate('items.seller', 'firstName lastName businessName email')
      .populate('items.product', 'name price')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      totalOrders: total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
};

// Get platform analytics
exports.getPlatformAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateQuery = {};
    if (startDate || endDate) {
      dateQuery.createdAt = {};
      if (startDate) dateQuery.createdAt.$gte = new Date(startDate);
      if (endDate) dateQuery.createdAt.$lte = new Date(endDate);
    }

    const analytics = {
      orders: {
        total: 0,
        byStatus: {},
        byDay: {},
      },
      revenue: {
        total: 0,
        byDay: {},
        commission: 0
      },
      sellers: {
        total: await Seller.countDocuments(),
        active: 0,
        topPerformers: []
      },
      products: {
        total: await Product.countDocuments(),
        topSelling: []
      },
      disputes: {
        total: 0,
        open: 0,
        resolved: 0
      }
    };

    // Aggregate order data
    const orderStats = await Order.aggregate([
      { $match: dateQuery },
      { $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          avgOrderValue: { $avg: '$totalAmount' }
        }
      }
    ]);

    if (orderStats.length > 0) {
      analytics.orders.total = orderStats[0].totalOrders;
      analytics.revenue.total = orderStats[0].totalRevenue;
      analytics.revenue.commission = orderStats[0].totalRevenue * 0.1; // Assuming 10% commission
    }

    // Get order status distribution
    const statusStats = await Order.aggregate([
      { $match: dateQuery },
      { $unwind: '$items' },
      { $group: {
          _id: '$items.status',
          count: { $sum: 1 }
        }
      }
    ]);

    statusStats.forEach(stat => {
      analytics.orders.byStatus[stat._id] = stat.count;
    });

    // Get top performing sellers
    analytics.sellers.topPerformers = await Order.aggregate([
      { $match: dateQuery },
      { $unwind: '$items' },
      { $group: {
          _id: '$items.seller',
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 }
    ]);

    await Seller.populate(analytics.sellers.topPerformers, {
      path: '_id',
      select: 'firstName lastName businessName email'
    });

    // Get top selling products
    analytics.products.topSelling = await Order.aggregate([
      { $match: dateQuery },
      { $unwind: '$items' },
      { $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 }
    ]);

    await Product.populate(analytics.products.topSelling, {
      path: '_id',
      select: 'name price images'
    });

    // Get dispute statistics
    const disputeStats = await Order.aggregate([
      { $match: { 'dispute.status': { $exists: true } } },
      { $group: {
          _id: '$dispute.status',
          count: { $sum: 1 }
        }
      }
    ]);

    disputeStats.forEach(stat => {
      if (stat._id === 'opened') analytics.disputes.open = stat.count;
      if (stat._id === 'resolved') analytics.disputes.resolved = stat.count;
      analytics.disputes.total += stat.count;
    });

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching platform analytics', error: error.message });
  }
};

// Fraud detection and monitoring
exports.getFlaggedOrders = async (req, res) => {
  try {
    const flaggedOrders = await Order.find({
      $or: [
        { 'paymentInfo.status': 'failed' },
        { 'paymentInfo.gateway_response': { $in: [
          'fraudulent', 
          'suspicious',
          'declined',
          'timeout'
        ]}}, // Paystack specific responses
        { 'dispute.status': 'opened' },
        { 'refund.status': { $in: ['requested', 'approved'] } },
        { 'paymentInfo.attempts': { $gt: 3 } } // Multiple payment attempts
      ]
    })
    .populate('buyer', 'firstName lastName email phoneNumber')
    .populate('items.seller', 'firstName lastName businessName email')
    .populate('items.product', 'name price')
    .sort({ createdAt: -1 });

    res.json(flaggedOrders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching flagged orders', error: error.message });
  }
};

// Manual order intervention
exports.updateOrderManually = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderId } = req.params;
    const { status, note, refundAmount } = req.body;

    const order = await Order.findById(orderId).session(session);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update order status
    if (status) {
      order.items.forEach(item => {
        item.status = status;
        item.statusHistory.push({
          status,
          timestamp: new Date(),
          note: `Admin update: ${note || status}`
        });
      });
    }

    // Process refund if specified
    if (refundAmount) {
      // Process refund through Paystack
      const refundResponse = await paystack.post('/refund', {
        transaction: order.paymentInfo.reference,
        amount: Math.round(refundAmount * 100) // Amount in kobo
      });

      if (refundResponse.data.status) {
        order.refund = {
          status: 'processed',
          amount: refundAmount,
          processedAt: new Date(),
          processedBy: req.user.id,
          reference: refundResponse.data.data.reference
        };
      } else {
        throw new Error('Refund failed through Paystack');
      }
    }

    // Add admin note
    order.notes.push({
      type: 'admin',
      content: note || `Manual update by admin: ${status}`,
      createdAt: new Date()
    });

    await order.save({ session });
    await session.commitTransaction();

    res.json({ message: 'Order updated successfully', order });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ message: 'Error updating order', error: error.message });
  } finally {
    session.endSession();
  }
};

// Add method to verify Paystack transactions
exports.verifyPaystackTransaction = async (req, res) => {
  try {
    const { reference } = req.params;
    
    const verificationResponse = await paystack.get(`/transaction/verify/${reference}`);
    
    if (!verificationResponse.data.status) {
      return res.status(400).json({ 
        message: 'Transaction verification failed',
        data: verificationResponse.data 
      });
    }

    const transactionData = verificationResponse.data.data;
    const order = await Order.findOne({ 'paymentInfo.reference': reference });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update order payment status based on verification
    order.paymentInfo.status = transactionData.status === 'success' ? 'completed' : 'failed';
    order.paymentInfo.gateway_response = transactionData.gateway_response;
    order.paymentInfo.verifiedAt = new Date();

    await order.save();

    res.json({ 
      message: 'Transaction verified successfully',
      order 
    });

  } catch (error) {
    res.status(500).json({ 
      message: 'Error verifying transaction', 
      error: error.message 
    });
  }
};

// Add method to get Paystack transaction logs
exports.getPaystackTransactionLogs = async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    let url = '/transaction';
    
    const params = new URLSearchParams();
    if (startDate) params.append('from', startDate);
    if (endDate) params.append('to', endDate);
    if (status) params.append('status', status);

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await paystack.get(url);
    
    res.json(response.data.data);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching transaction logs', 
      error: error.message 
    });
  }
};

// Get all withdrawals
exports.getAllWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find()
      .populate('seller', 'firstName lastName email storeName')
      .sort({ requestDate: -1 });

    res.json(withdrawals);
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to fetch withdrawals', 
      error: error.message 
    });
  }
};

// Update withdrawal status
exports.updateWithdrawalStatus = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { withdrawalId } = req.params;
    const { status, note } = req.body;

    const withdrawal = await Withdrawal.findById(withdrawalId)
      .populate('seller')
      .session(session);

    if (!withdrawal) {
      return res.status(404).json({ message: 'Withdrawal request not found' });
    }

    withdrawal.status = status;
    withdrawal.notes.push({
      content: note || `Status updated to ${status}`,
      addedBy: 'admin'
    });

    if (status === 'completed') {
      withdrawal.processedDate = new Date();
      
      // Update seller's wallet balance
      const seller = withdrawal.seller;
      seller.walletBalance -= withdrawal.amount;
      await seller.save({ session });
    }

    await withdrawal.save({ session });
    await session.commitTransaction();

    // Send email notification
    const emailMsg = {
      to: withdrawal.seller.email,
      from: 'Auqli Admin <joseph@auqli.com>',
      subject: 'Withdrawal Request Update',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Withdrawal Request Update</h2>
          <p>Dear ${withdrawal.seller.firstName},</p>
          <p>Your withdrawal request (Ref: ${withdrawal.reference}) has been ${status}.</p>
          <p>Amount: ${withdrawal.amount}</p>
          ${note ? `<p>Note: ${note}</p>` : ''}
          <p>Best regards,<br>The Auqli Team</p>
        </div>
      `
    };

    await sgMail.send(emailMsg);

    res.json({ 
      message: 'Withdrawal status updated successfully', 
      withdrawal 
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ 
      message: 'Failed to update withdrawal status', 
      error: error.message 
    });
  } finally {
    session.endSession();
  }
};




