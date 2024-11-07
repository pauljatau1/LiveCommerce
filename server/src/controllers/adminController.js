const Admin = require('../models/Admin');
const Buyer = require('../models/Buyer');
const Seller = require('../models/Seller');
const Product = require('../models/Product');
const Category = require('../models/Category'); // Assuming you have a Category model
const jwt = require('jsonwebtoken');

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
