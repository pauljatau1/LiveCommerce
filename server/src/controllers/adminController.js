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
    const seller = await Seller.findByIdAndUpdate(sellerId, { isDisabled: false }, { new: true });
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }
    res.json(seller);
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

    // if (seller.accountType !== 'business') {
    //   return res.status(400).json({ message: 'Seller is not a business account' });
    // }

    seller.isVerified = true;
    await seller.save();

    res.json({ message: 'Business account verified successfully', seller });
  } catch (error) {
    res.status(500).json({ message: 'Failed to verify business account', error: error.message });
  }
};




