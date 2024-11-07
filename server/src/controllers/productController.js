const Product = require('../models/Product');
const cloudinary = require('../config/cloudinary');
const Buyer = require('../models/Buyer');
const Seller = require('../models/Seller');

// Create a new product
exports.createProduct = async (req, res) => {
  const { name, description, price, category, brand, stock, sku, tags, images } = req.body;
  const sellerId = req.user.id;

  try {
    let imagesLinks = [];
    if (images && images.length > 0) {
      for (let image of images) {
        const uploadResult = await cloudinary.uploader.upload(image, { folder: 'products' });
        imagesLinks.push({ url: uploadResult.secure_url, public_id: uploadResult.public_id });
      }
    }

    const newProduct = new Product({
      name,
      description,
      price,
      category,
      brand,
      seller: sellerId,
      images: imagesLinks,
      stock,
      sku,
      tags,
    });

    await newProduct.save();

    // Populate the seller field with seller details after saving the product
    const populatedProduct = await Product.findById(newProduct._id).populate('seller', 'name avatarUrl about');

    res.status(201).json(populatedProduct);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create product', error: error.message });
  }
};

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().populate('seller', 'name avatarUrl about').populate('reviews.buyer', 'firstName lastName');
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve products', error: error.message });
  }
};

// Get a single product
exports.getProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findById(id).populate('seller', 'name avatarUrl about').populate('reviews.buyer', 'firstName lastName');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve product', error: error.message });
  }
};

// Update a product
exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, description, price, category, brand, stock, sku, tags, images } = req.body;

  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (images && images.length > 0) {
      for (let image of images) {
        const uploadResult = await cloudinary.uploader.upload(image, { folder: 'products' });
        product.images.push({ url: uploadResult.secure_url, public_id: uploadResult.public_id });
      }
    }

    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price || product.price;
    product.category = category || product.category;
    product.brand = brand || product.brand;
    product.stock = stock || product.stock;
    product.sku = sku || product.sku;
    product.tags = tags || product.tags;
    product.updatedAt = Date.now();

    const updatedProduct = await product.save();

    // Populate the seller field with seller details after updating the product
    const populatedProduct = await Product.findById(updatedProduct._id).populate('seller', 'name avatarUrl about');

    res.json(populatedProduct);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update product', error: error.message });
  }
};

// Delete a product
exports.deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Delete images from Cloudinary
    for (let image of product.images) {
      await cloudinary.uploader.destroy(image.public_id);
    }

    await product.remove();
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete product', error: error.message });
  }
};

// Search products
exports.searchProducts = async (req, res) => {
  const { query } = req.query;

  try {
    const products = await Product.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } },
        { brand: { $regex: query, $options: 'i' } },
        { tags: { $regex: query, $options: 'i' } },
      ],
    }).populate('seller', 'name avatarUrl about').populate('reviews.buyer', 'firstName lastName');

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Failed to search products', error: error.message });
  }
};

// Update product price
exports.updateProductPrice = async (req, res) => {
  const { id } = req.params;
  const { price } = req.body;

  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.price = price || product.price;
    product.updatedAt = Date.now();

    const updatedProduct = await product.save();

    // Populate the seller field with seller details after updating the product
    const populatedProduct = await Product.findById(updatedProduct._id).populate('seller', 'name avatarUrl about');

    res.json(populatedProduct);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update product price', error: error.message });
  }
};

// Update product stock
exports.updateProductStock = async (req, res) => {
  const { id } = req.params;
  const { stock } = req.body;

  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.stock = stock || product.stock;
    product.updatedAt = Date.now();

    const updatedProduct = await product.save();

    // Populate the seller field with seller details after updating the product
    const populatedProduct = await Product.findById(updatedProduct._id).populate('seller', 'name avatarUrl about');

    res.json(populatedProduct);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update product stock', error: error.message });
  }
};

// Deep search products
exports.deepSearchProducts = async (req, res) => {
  const { query } = req.query;

  try {
    const products = await Product.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } },
        { brand: { $regex: query, $options: 'i' } },
        { tags: { $regex: query, $options: 'i' } },
        { sku: { $regex: query, $options: 'i' } },
      ],
    }).populate('seller', 'name avatarUrl about').populate('reviews.buyer', 'firstName lastName');

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Failed to deep search products', error: error.message });
  }
};

// Get products that just arrived
exports.getJustArrivedProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 }).limit(10).populate('seller', 'name avatarUrl about').populate('reviews.buyer', 'firstName lastName');
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve just arrived products', error: error.message });
  }
};

// Get best selling products
exports.getBestSellingProducts = async (req, res) => {
  try {
    const products = await Product.aggregate([
      { $unwind: '$reviews' },
      { $group: { _id: '$_id', totalRevenue: { $sum: '$price' }, count: { $sum: 1 } } },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
      { $replaceRoot: { newRoot: '$product' } },
      { $lookup: { from: 'sellers', localField: 'seller', foreignField: '_id', as: 'seller' } },
      { $unwind: '$seller' },
      { $project: { 'seller.password': 0 } },
    ]);

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve best selling products', error: error.message });
  }
};


// Get products under selected categories
exports.getProductsBySelectedCategories = async (req, res) => {
  const buyer = await Buyer.findById(req.user.id);
  if (!buyer) {
    return res.status(404).json({ message: 'Buyer not found.' });
  }

  try {
    const products = await Product.find({ category: { $in: buyer.selectedCategories } })
      .populate('seller', 'name avatarUrl about')
      .populate('reviews.buyer', 'firstName lastName');

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve products', error: error.message });
  }
};

