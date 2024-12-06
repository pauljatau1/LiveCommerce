const Product = require('../models/Product');
const cloudinary = require('../config/cloudinary');
const Buyer = require('../models/Buyer');
const Seller = require('../models/Seller');
const s3 = require('../config/awsConfig')
const { v4: uuidv4 } = require('uuid');
const Category = require('../models/Category');

// Create a new product
exports.createProduct = async (req, res) => {
  const sellerId = req.user.id;
  const { category, subCategory, ...productData } = req.body;
  const images = req.files['images'];
  const blips = req.files['blips'];

  try {
    // Validate category and subCategory
    const categoryDoc = await Category.findOne({ name: category });
    if (!categoryDoc) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    if (subCategory) {
      const validSubCategory = categoryDoc.subCategories.some(sub => 
        sub.name === subCategory
      );
      if (!validSubCategory) {
        return res.status(400).json({ message: 'Invalid subcategory for the selected category' });
      }
    }

    let imagesLinks = [];
    if (images && images.length > 0) {
      for (let image of images) {
        const params = {
          Bucket: 'auqli-uploads',
          Key: `${uuidv4()}-${image.originalname}`,
          Body: image.buffer,
          ContentType: image.mimetype,
          
        };
        const data = await s3.upload(params).promise();
        imagesLinks.push({ url: data.Location });
      }
    }

    let blipsLinks = [];
    if (blips && blips.length > 0) {
      for (let blip of blips) {
        const params = {
          Bucket: 'auqli-uploads',
          Key: `${uuidv4()}-${blip.originalname}`,
          Body: blip.buffer,
          ContentType: blip.mimetype,
          
        };
        const data = await s3.upload(params).promise();
        blipsLinks.push({ url: data.Location });
      }
    }

    const newProduct = new Product({
      ...productData,
      category,
      subCategory,
      seller: sellerId,
      images: imagesLinks,
      blips: blipsLinks,
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
  const { category, subCategory, ...updateData } = req.body;
  const images = req.files['images'];
  const blips = req.files['blips'];

  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Validate category and subCategory if they're being updated
    if (category) {
      const categoryDoc = await Category.findOne({ name: category });
      if (!categoryDoc) {
        return res.status(400).json({ message: 'Invalid category' });
      }

      if (subCategory) {
        const validSubCategory = categoryDoc.subCategories.some(sub => 
          sub.name === subCategory
        );
        if (!validSubCategory) {
          return res.status(400).json({ message: 'Invalid subcategory for the selected category' });
        }
      }
    }

    let imagesLinks = [];
    if (images && images.length > 0) {
      for (let image of images) {
        const params = {
          Bucket: 'auqli-uploads',
          Key: `${uuidv4()}-${image.originalname}`,
          Body: image.buffer,
          ContentType: image.mimetype,
          
        };
        const data = await s3.upload(params).promise();
        imagesLinks.push({ url: data.Location });
      }
    }

    let blipsLinks = [];
    if (blips && blips.length > 0) {
      for (let blip of blips) {
        const params = {
          Bucket: 'auqli-uploads',
          Key: `${uuidv4()}-${blip.originalname}`,
          Body: blip.buffer,
          ContentType: blip.mimetype,
          
        };
        const data = await s3.upload(params).promise();
        blipsLinks.push({ url: data.Location });
      }
    }

    // Merge updateData with the existing product data
    Object.assign(product, updateData, {
      category: category || product.category,
      subCategory: subCategory || product.subCategory,
      images: [...product.images, ...imagesLinks],
      blips: [...product.blips, ...blipsLinks],
      updatedAt: Date.now()
    });

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

// Get products for buyer's feed based on selected categories and subcategories
exports.getBuyerFeedProducts = async (req, res) => {
  try {
    const buyer = await Buyer.findById(req.user.id);
    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }

    // Extract all subcategory names from buyer's selected categories
    const subcategoryNames = buyer.selectedCategories.flatMap(category => 
      category.subCategories.map(sub => sub.name)
    );

    const products = await Product.find({
      $or: [
        { category: { $in: buyer.selectedCategories.map(cat => cat.name) } },
        { subCategory: { $in: subcategoryNames } }
      ]
    })
    .sort({ createdAt: -1 })
    .populate('seller', 'name avatarUrl about')
    .populate('reviews.buyer', 'firstName lastName');

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve feed products', error: error.message });
  }
};

// Get trending products based on review count and ratings
exports.getTrendingProducts = async (req, res) => {
  try {
    const products = await Product.aggregate([
      { 
        $addFields: {
          reviewCount: { $size: "$reviews" },
          averageRating: { $avg: "$reviews.rating" }
        }
      },
      {
        $sort: {
          reviewCount: -1,
          averageRating: -1
        }
      },
      { $limit: 20 }
    ]);

    await Product.populate(products, {
      path: 'seller',
      select: 'name avatarUrl about'
    });

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve trending products', error: error.message });
  }
};

// Get trending products by category
exports.getTrendingProductsByCategory = async (req, res) => {
  const { category } = req.params;

  try {
    const products = await Product.aggregate([
      { $match: { category } },
      { 
        $addFields: {
          reviewCount: { $size: "$reviews" },
          averageRating: { $avg: "$reviews.rating" }
        }
      },
      {
        $sort: {
          reviewCount: -1,
          averageRating: -1
        }
      },
      { $limit: 10 }
    ]);

    await Product.populate(products, {
      path: 'seller',
      select: 'name avatarUrl about'
    });

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve trending products by category', error: error.message });
  }
};

// Get products by main category
exports.getProductsByCategory = async (req, res) => {
  const { category } = req.params;
  const { limit = 20, page = 1 } = req.query;

  try {
    const products = await Product.find({ category })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('seller', 'name avatarUrl about')
      .populate('reviews.buyer', 'firstName lastName');

    const total = await Product.countDocuments({ category });

    res.json({
      products,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalProducts: total
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve products by category', error: error.message });
  }
};

// Add to wishlist
exports.addToWishlist = async (req, res) => {
  const buyerId = req.user.id;
  const { productId } = req.params;

  try {
    const buyer = await Buyer.findById(buyerId);
    const product = await Product.findById(productId);

    if (!buyer || !product) {
      return res.status(404).json({ 
        message: !buyer ? 'Buyer not found' : 'Product not found' 
      });
    }

    // Check if product is already in wishlist
    const isInWishlist = buyer.wishlist.some(item => 
      item.product.toString() === productId
    );

    if (isInWishlist) {
      return res.status(400).json({ message: 'Product already in wishlist' });
    }

    // Add to wishlist
    buyer.wishlist.push({ product: productId });
    await buyer.save();

    res.json({ message: 'Product added to wishlist successfully' });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to add product to wishlist', 
      error: error.message 
    });
  }
};

// Remove from wishlist
exports.removeFromWishlist = async (req, res) => {
  const buyerId = req.user.id;
  const { productId } = req.params;

  try {
    const buyer = await Buyer.findById(buyerId);
    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }

    // Remove from wishlist
    buyer.wishlist = buyer.wishlist.filter(item => 
      item.product.toString() !== productId
    );
    await buyer.save();

    res.json({ message: 'Product removed from wishlist successfully' });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to remove product from wishlist', 
      error: error.message 
    });
  }
};

// Get wishlist
exports.getWishlist = async (req, res) => {
  const buyerId = req.user.id;

  try {
    const buyer = await Buyer.findById(buyerId)
      .populate({
        path: 'wishlist.product',
        select: 'name description price images category brand',
        populate: {
          path: 'seller',
          select: 'name avatarUrl about'
        }
      });

    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }

    res.json(buyer.wishlist);
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to retrieve wishlist', 
      error: error.message 
    });
  }
};
