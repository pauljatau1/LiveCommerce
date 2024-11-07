const Admin = require('../models/Admin');
const Buyer = require('../models/Buyer');
const Seller = require('../models/Seller');
const Product = require('../models/Product');
const Category = require('../models/Category'); // Assuming you have a Category model
const Banner = require('../models/Banner'); // Import the Banner model
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2; // Import Cloudinary
const Order = require('../models/Order');


// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.register = async (req, res) => {
  const { username, password } = req.body;

  try {
    const newAdmin = new Admin({ username, password });
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
    const seller = await Seller.findByIdAndUpdate(sellerId, { isDisabled: true }, { new: true });
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }
    res.json(seller);
  } catch (error) {
    res.status(500).json({ error: error.message });
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

exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().populate('seller');
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createCategory = async (req, res) => {
  const { name } = req.body;

  try {
    const newCategory = new Category({ name });
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
      category,
      callToActionLink,
    });
    await newBanner.save();
    res.status(201).json(newBanner);
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

    // Upload mainImage if provided
    if (mainImage) {
      const uploadResult = await cloudinary.uploader.upload(mainImage, { folder: 'banners' });
      banner.mainImage = { url: uploadResult.secure_url, public_id: uploadResult.public_id };
    }

    banner.title = title || banner.title;
    banner.description = description || banner.description;
    banner.category = category || banner.category;
    banner.callToActionLink = callToActionLink || banner.callToActionLink;

    await banner.save();
    res.json(banner);
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
    res.json(banners);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getBannersByCategory = async (req, res) => {
  const { categoryId } = req.params;

  try {
    const banners = await Banner.find({ category: categoryId }).populate('category');
    res.json(banners);
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