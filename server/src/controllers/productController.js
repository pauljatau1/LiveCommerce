const Product = require('../models/Product');
const cloudinary = require('../config/cloudinary');
const Buyer = require('../models/Buyer');
const Seller = require('../models/Seller');
const s3 = require('../config/awsConfig')
const { v4: uuidv4 } = require('uuid');
const Category = require('../models/Category');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const NotificationController = require('../controllers/notificationController');

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

// Get all product blips
exports.getAllBlips = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  try {
    const blips = await Product.aggregate([
      // Match products that have at least one blip
      { 
        $match: { 
          blips: { $exists: true, $ne: [] },
          seller: { $exists: true, $ne: null } // Ensure seller exists
        } 
      },
      // Unwind the blips array
      { $unwind: '$blips' },
      // Project needed fields including seller ID
      {
        $project: {
          blipUrl: '$blips.url',
          productId: '$_id',
          productName: '$name',
          price: '$price',
          sellerId: '$seller',
          images: { $first: '$images.url' },
          averageRating: {
            $cond: {
              if: { $isArray: '$reviews' },
              then: { $avg: '$reviews.rating' },
              else: null
            }
          },
          reviewCount: {
            $cond: {
              if: { $isArray: '$reviews' },
              then: { $size: '$reviews' },
              else: 0
            }
          }
        }
      },
      // Sort by newest first
      { $sort: { _id: -1 } },
      // Skip and limit for pagination
      { $skip: (page - 1) * limit },
      { $limit: limit }
    ]);

    const total = await Product.countDocuments({
      blips: { $exists: true, $ne: [] }
    });

    res.json({
      blips,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalBlips: total
    });
  } catch (error) {
    console.error('Error in getAllBlips:', error);
    res.status(500).json({ message: 'Failed to retrieve blips', error: error.message });
  }
};

// Get seller's blips
exports.getSellerBlips = async (req, res) => {
  const { sellerId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  try {
    // Validate sellerId
    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({ message: 'Invalid seller ID' });
    }

    // Get seller info first
    const seller = await Seller.findById(sellerId, {
      firstName: 1,
      lastName: 1,
      businessName: 1,
      storeName: 1
    });

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    // Check if seller has any blips before aggregation
    const hasBlips = await Product.exists({
      seller: new mongoose.Types.ObjectId(sellerId),
      blips: { $exists: true, $ne: [] }
    });

    if (!hasBlips) {
      return res.json({
        message: 'Seller has no blips',
        seller,
        blips: [],
        currentPage: page,
        totalPages: 0,
        totalBlips: 0
      });
    }

    const blips = await Product.aggregate([
      // Match products from this seller that have blips
      { 
        $match: { 
          seller: new mongoose.Types.ObjectId(sellerId),
          blips: { $exists: true, $ne: [] }
        } 
      },
      // Unwind the blips array
      { $unwind: '$blips' },
      // Project needed fields
      {
        $project: {
          blipUrl: '$blips.url',
          productId: '$_id',
          productName: '$name',
          price: '$price',
          sellerId: '$seller',
          images: { $first: '$images.url' },
          averageRating: {
            $cond: {
              if: { $isArray: '$reviews' },
              then: { $avg: '$reviews.rating' },
              else: null
            }
          },
          reviewCount: {
            $cond: {
              if: { $isArray: '$reviews' },
              then: { $size: '$reviews' },
              else: 0
            }
          }
        }
      },
      // Sort by newest first
      { $sort: { _id: -1 } },
      // Skip and limit for pagination
      { $skip: (page - 1) * limit },
      { $limit: limit }
    ]);

    const total = await Product.countDocuments({
      seller: sellerId,
      blips: { $exists: true, $ne: [] }
    });

    res.json({
      blips,
      seller,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalBlips: total
    });
  } catch (error) {
    console.error('Error in getSellerBlips:', error);
    res.status(500).json({ message: 'Failed to retrieve seller blips', error: error.message });
  }
};

// Get seller's products
exports.getSellerProducts = async (req, res) => {
  const { sellerId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  try {
    // Validate sellerId
    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({ message: 'Invalid seller ID' });
    }

    const products = await Product.find({ seller: sellerId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('name description price images category brand reviews');

    const total = await Product.countDocuments({ seller: sellerId });

    // Get seller info
    const seller = await Seller.findById(sellerId, {
      firstName: 1,
      lastName: 1,
      businessName: 1,
      storeName: 1
    });

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    // Check if seller has any products
    if (products.length === 0) {
      return res.json({
        message: 'Seller has no products',
        seller,
        products: [],
        currentPage: page,
        totalPages: 0,
        totalProducts: 0
      });
    }

    res.json({
      products,
      seller,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalProducts: total
    });
  } catch (error) {
    console.error('Error in getSellerProducts:', error);
    res.status(500).json({ message: 'Failed to retrieve seller products', error: error.message });
  }
};

// Get seller's product reviews
exports.getSellerReviews = async (req, res) => {
  const { sellerId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  try {
    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    const reviews = await Product.aggregate([
      { $match: { seller: mongoose.Types.ObjectId(sellerId) }},
      { $unwind: '$reviews' },
      {
        $lookup: {
          from: 'buyers',
          localField: 'reviews.buyer',
          foreignField: '_id',
          as: 'buyerInfo'
        }
      },
      { $unwind: '$buyerInfo' },
      {
        $project: {
          productId: '$_id',
          productName: '$name',
          review: '$reviews',
          'buyerInfo.firstName': 1,
          'buyerInfo.lastName': 1,
          'buyerInfo.profileImage': 1
        }
      },
      { $sort: { 'review.createdAt': -1 }},
      { $skip: (page - 1) * limit },
      { $limit: limit }
    ]);

    const total = await Product.aggregate([
      { $match: { seller: mongoose.Types.ObjectId(sellerId) }},
      { $unwind: '$reviews' },
      { $count: 'total' }
    ]);

    res.json({
      reviews,
      sellerInfo: {
        name: seller.name,
        businessName: seller.businessName
      },
      currentPage: page,
      totalPages: Math.ceil((total[0]?.total || 0) / limit),
      totalReviews: total[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve seller reviews', error: error.message });
  }
};

// Inventory Management
exports.updateInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, lowStockThreshold, sku, barcode } = req.body;
    
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Verify seller ownership
    if (product.seller.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }

    // Update inventory fields
    if (quantity !== undefined) product.inventory.quantity = quantity;
    if (lowStockThreshold !== undefined) product.inventory.lowStockThreshold = lowStockThreshold;
    if (sku) product.inventory.sku = sku;
    if (barcode) product.inventory.barcode = barcode;

    await product.save();

    // Check if stock is low and notify seller
    if (product.inventory.quantity <= product.inventory.lowStockThreshold) {
      await NotificationController.createNotification({
        recipient: req.user.id,
        type: 'LOW_STOCK',
        title: 'Low Stock Alert',
        message: `${product.name} is running low on stock (${product.inventory.quantity} remaining)`,
        reference: product._id
      });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update inventory', error: error.message });
  }
};

// Variant Management
exports.addVariant = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, options } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Verify seller ownership
    if (product.seller.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }

    // Validate variant data
    if (!name || !options || !Array.isArray(options) || options.length === 0) {
      return res.status(400).json({ message: 'Invalid variant data' });
    }

    // Generate SKUs for variant options
    const variantOptions = options.map(option => ({
      ...option,
      sku: `${product.inventory.sku}-${option.value.toLowerCase().replace(/\s+/g, '-')}`
    }));

    // Add new variant
    product.variants.push({
      name,
      options: variantOptions
    });

    await product.save();
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Failed to add variant', error: error.message });
  }
};

exports.removeVariant = async (req, res) => {
  try {
    const { id, variantId } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Verify seller ownership
    if (product.seller.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }

    // Find and remove the variant
    const variantIndex = product.variants.findIndex(v => v._id.toString() === variantId);
    if (variantIndex === -1) {
      return res.status(404).json({ message: 'Variant not found' });
    }

    product.variants.splice(variantIndex, 1);
    await product.save();

    res.json({ message: 'Variant removed successfully', product });
  } catch (error) {
    res.status(500).json({ message: 'Failed to remove variant', error: error.message });
  }
};

// Analytics Controllers
exports.getProductAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Get orders containing this product
    const orders = await Order.find({
      'cart.product': id,
      createdAt: {
        $gte: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        $lte: endDate ? new Date(endDate) : new Date()
      }
    });

    const analytics = {
      totalViews: product.analytics.views,
      totalSales: orders.length,
      revenue: orders.reduce((sum, order) => {
        const item = order.cart.find(item => item.product.toString() === id);
        return sum + (item ? item.price * item.quantity : 0);
      }, 0),
      conversionRate: (orders.length / product.analytics.views * 100).toFixed(2),
      averageOrderValue: orders.length ? (revenue / orders.length).toFixed(2) : 0
    };

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get analytics', error: error.message });
  }
};

// SEO Controllers
exports.updateSEO = async (req, res) => {
  try {
    const { id } = req.params;
    const { metaTitle, metaDescription, metaKeywords, slug } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Verify seller ownership
    if (product.seller.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }

    product.seo = {
      ...product.seo,
      metaTitle: metaTitle || product.seo.metaTitle,
      metaDescription: metaDescription || product.seo.metaDescription,
      metaKeywords: metaKeywords || product.seo.metaKeywords,
      slug: slug || product.seo.slug
    };

    await product.save();
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update SEO', error: error.message });
  }
};

// Bulk Operations Controllers
exports.bulkUpdate = async (req, res) => {
  try {
    const { products } = req.body;
    const sellerId = req.user.id;

    // Verify ownership of all products
    const productIds = products.map(p => p.id);
    const existingProducts = await Product.find({
      _id: { $in: productIds },
      seller: sellerId
    });

    if (existingProducts.length !== productIds.length) {
      return res.status(403).json({ message: 'Not authorized to update some products' });
    }

    const bulkOps = products.map(product => ({
      updateOne: {
        filter: { _id: product.id },
        update: { $set: product.updates }
      }
    }));

    const result = await Product.bulkWrite(bulkOps);
    res.json({
      message: 'Products updated successfully',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to bulk update products', error: error.message });
  }
};

exports.bulkDelete = async (req, res) => {
  try {
    const { productIds } = req.body;
    const sellerId = req.user.id;

    // Verify ownership of all products
    const products = await Product.find({
      _id: { $in: productIds },
      seller: sellerId
    });

    if (products.length !== productIds.length) {
      return res.status(403).json({ message: 'Not authorized to delete some products' });
    }

    // Delete images from S3
    for (const product of products) {
      for (const image of product.images) {
        const key = image.url.split('/').pop();
        await s3.deleteObject({
          Bucket: 'auqli-uploads',
          Key: key
        }).promise();
      }
    }

    const result = await Product.deleteMany({ _id: { $in: productIds } });
    res.json({
      message: 'Products deleted successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to bulk delete products', error: error.message });
  }
};

// Analytics and Reporting Controllers
exports.getLowStockProducts = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const products = await Product.find({
      seller: sellerId,
      $expr: {
        $lte: ['$inventory.quantity', '$inventory.lowStockThreshold']
      }
    }).populate('seller', 'name avatarUrl about');

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get low stock products', error: error.message });
  }
};

exports.getProductPerformance = async (req, res) => {
  try {
    const { id } = req.params;
    const { period = '30d' } = req.query;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    const orders = await Order.find({
      'cart.product': id,
      createdAt: { $gte: startDate, $lte: endDate }
    });

    const performance = {
      period,
      sales: {
        total: orders.length,
        revenue: orders.reduce((sum, order) => {
          const item = order.cart.find(item => item.product.toString() === id);
          return sum + (item ? item.price * item.quantity : 0);
        }, 0)
      },
      views: product.analytics.views,
      conversionRate: (orders.length / product.analytics.views * 100).toFixed(2)
    };

    res.json(performance);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get product performance', error: error.message });
  }
};

// Review Management Controllers
exports.addReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const buyerId = req.user.id;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if buyer has purchased the product
    const order = await Order.findOne({
      user: buyerId,
      'cart.product': id,
      'tracking.status': 'delivered'
    });

    if (!order) {
      return res.status(403).json({ message: 'You must purchase and receive the product before reviewing' });
    }

    // Check if buyer has already reviewed
    const existingReview = product.reviews.find(review => 
      review.buyer.toString() === buyerId
    );

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }

    product.reviews.push({
      buyer: buyerId,
      rating,
      comment,
      createdAt: Date.now()
    });

    await product.save();
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Failed to add review', error: error.message });
  }
};

exports.getProductReviews = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const product = await Product.findById(id)
      .populate({
        path: 'reviews.buyer',
        select: 'firstName lastName profileImage'
      })
      .select('reviews');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const reviews = product.reviews
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(startIndex, endIndex);

    res.json({
      reviews,
      currentPage: page,
      totalPages: Math.ceil(product.reviews.length / limit),
      totalReviews: product.reviews.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get product reviews', error: error.message });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const { id, reviewId } = req.params;
    const { rating, comment } = req.body;
    const buyerId = req.user.id;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const review = product.reviews.id(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.buyer.toString() !== buyerId) {
      return res.status(403).json({ message: 'Not authorized to update this review' });
    }

    review.rating = rating || review.rating;
    review.comment = comment || review.comment;
    review.updatedAt = Date.now();

    await product.save();
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update review', error: error.message });
  }
};

// Visibility Management
exports.updateVisibility = async (req, res) => {
  try {
    const { id } = req.params;
    const { visibility } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.seller.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }

    product.visibility = visibility;
    await product.save();
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update visibility', error: error.message });
  }
};
