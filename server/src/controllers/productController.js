const Product = require('../models/Product');
const Buyer = require('../models/Buyer');
const Seller = require('../models/Seller');
const { s3 } = require('../config/awsConfig')
const { v4: uuidv4 } = require('uuid');
const Category = require('../models/Category');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const NotificationController = require('../controllers/notificationController');
const agenda = require('../config/agenda').agenda;
const { ProductDeleteS3ObjectsByUrls } = require('../services/products/images');
const { ExtractAllImageUrlsFromVariants } = require('../services/products/variants/utils');
const { ProductVariantDeleteS3ObjectsByUrls } = require('../services/products/variants/images');
const productBlips = require('../services/products/blips');
const Fuse = require('fuse.js');
const { uploadResizedImages } = require('../utils/imageProcessor');
const baseUrl = process.env.STORE_URL;

// Create a new product
exports.createProduct = async (req, res) => {
  try {
    const sellerId = req.user.id;

    // Validate required fields
    const requiredFields = ['name', 'description', 'price', 'category', 'stock',];
    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Parse JSON fields with error handling
    const parseJsonField = (field, fieldName) => {
      if (!field) return undefined;
      try {
        return typeof field === 'string' ? JSON.parse(field) : field;
      } catch (error) {
        throw new Error(`Invalid JSON format for ${fieldName}: ${error.message}`);
      }
    };

    // Parse JSON strings for objects with error handling
    const parsedBody = {
      ...req.body,
      returnPolicy: parseJsonField(req.body.returnPolicy, 'returnPolicy'),
      shippingInfo: parseJsonField(req.body.shippingInfo, 'shippingInfo'),
      seo: parseJsonField(req.body.seo, 'seo'),
    };

    // Convert comma-separated strings to arrays
    if (typeof req.body.tags === 'string') {
      parsedBody.tags = req.body.tags.split(',').map(tag => tag.trim());
    }
    if (typeof req.body.colors === 'string') {
      parsedBody.colors = req.body.colors.split(',').map(color => color.trim());
    }

    // Validate category and subcategory
    const categoryDoc = await Category.findOne({ name: parsedBody.category });
    if (!categoryDoc) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    if (parsedBody.subCategory) {
      const validSubCategory = categoryDoc.subCategories.some(
        sub => sub.name === parsedBody.subCategory
      );
      if (!validSubCategory) {
        return res.status(400).json({
          message: 'Invalid subcategory for the selected category'
        });
      }
    }

    // Handle main product images - will be processed after product is saved
    let imagesLinks = [];
    let imagesToProcess = [];
    if (req.body.images && Array.isArray(req.body.images)) {
      imagesToProcess = req.body.images;
    }

    // Process variant images - will be processed after product is saved
    let variantsToProcess = [];
    if (req.body.variants && Array.isArray(req.body.variants)) {
      variantsToProcess = req.body.variants;
    }

    // Create new product
    const newProduct = new Product({
      ...parsedBody,
      seller: sellerId,
      images: imagesLinks,
    });

    await newProduct.save();

    // Process main product images with resizing after product is saved
    if (imagesToProcess.length > 0) {
      const imageProcessingPromises = imagesToProcess.map(async (image) => {
        // Handle base64 data with optional prefix (like variant images)
        const base64Data = image.data.split(',')[1] || image.data;
        if (!base64Data) {
          console.error('Invalid base64 data for main product image:', image);
          throw new Error('Invalid base64 data');
        }

        const buffer = Buffer.from(base64Data, 'base64');
        const fileName = uuidv4();
        const basePath = `sellers/${sellerId}/products/${newProduct._id}/images`;

        // Upload original and resized versions using the utility function
        const uploadResults = await uploadResizedImages(buffer, basePath, fileName);

        return {
          url: uploadResults.original.url,
          resizedImages: uploadResults.resizedImages
        };
      });

      imagesLinks = await Promise.all(imageProcessingPromises);

      // Update product with processed image URLs
      newProduct.images = imagesLinks;
      await newProduct.save();
    }

    // Process variant images with resizing after product is saved
    if (variantsToProcess.length > 0) {
      // Save variants to get their auto-generated IDs
      newProduct.variants = variantsToProcess;
      await newProduct.save();

      // Now process images with the auto-generated variant IDs
      const processedVariants = await Promise.all(newProduct.variants.map(async (variant) => {
        // Process main variant images
        let variantImages = [];
        if (variant?.images?.length > 0 && Array.isArray(variant.images)) {
          const variantImagePromises = variant.images.map(async (image) => {
            if (!image?.data) {
              console.log('Skipping variant image processing - no image data');
              return null;
            }

            // Handle base64 data with optional prefix
            const base64Data = image.data.split(',')[1] || image.data;
            if (!base64Data) {
              console.error('Invalid base64 data for variant image:', image);
              return null;
            }

            const buffer = Buffer.from(base64Data, 'base64');
            const fileName = uuidv4();
            const basePath = `sellers/${sellerId}/products/${newProduct._id}/variants/${variant._id}/images`;

            // Upload original and resized versions using the utility function
            const uploadResults = await uploadResizedImages(buffer, basePath, fileName);

            return {
              data: uploadResults.original.url,
              contentType: image.contentType,
              isDefault: image.isDefault || false,
              resizedImages: uploadResults.resizedImages
            };
          });

          variantImages = (await Promise.all(variantImagePromises)).filter(img => img !== null);
        }

        // Process subvariants
        const processedSubVariants = await Promise.all((variant.subVariants || []).map(async (subVariant) => {

          let subVariantImages = [];
          if (subVariant?.images?.length > 0 && Array.isArray(subVariant.images)) {
            const subVariantImagePromises = subVariant.images.map(async (image) => {
              if (!image?.data) {
                console.log('Skipping subvariant image processing - no image data');
                return null;
              }

              const base64Data = image.data.split(',')[1] || image.data;
              if (!base64Data) {
                console.error('Invalid base64 data for subvariant image:', image);
                return null;
              }

              const buffer = Buffer.from(base64Data, 'base64');
              const fileName = uuidv4();
              const basePath = `sellers/${sellerId}/products/${newProduct._id}/variants/${subVariant._id}/images`;

              // Upload original and resized versions using the utility function
              const uploadResults = await uploadResizedImages(buffer, basePath, fileName);

              return {
                data: uploadResults.original.url,
                contentType: image.contentType,
                isDefault: image.isDefault || false,
                resizedImages: uploadResults.resizedImages
              };
            });

            subVariantImages = (await Promise.all(subVariantImagePromises)).filter(img => img !== null);
          }

          // Process subsubvariants
          const processedSubSubVariants = await Promise.all((subVariant.subSubVariants || []).map(async (subSubVariant) => {

            let subSubVariantImages = [];
            if (subSubVariant?.images?.length > 0 && Array.isArray(subSubVariant.images)) {
              const subSubVariantImagePromises = subSubVariant.images.map(async (image) => {
                if (!image?.data) {
                  console.log('Skipping subsubvariant image processing - no image data');
                  return null;
                }

                const base64Data = image.data.split(',')[1] || image.data;
                if (!base64Data) {
                  console.error('Invalid base64 data for subsubvariant image:', image);
                  return null;
                }

                const buffer = Buffer.from(base64Data, 'base64');
                const fileName = uuidv4();
                const basePath = `sellers/${sellerId}/products/${newProduct._id}/variants/${subSubVariant._id}/images`;

                // Upload original and resized versions using the utility function
                const uploadResults = await uploadResizedImages(buffer, basePath, fileName);

                return {
                  data: uploadResults.original.url,
                  contentType: image.contentType,
                  isDefault: image.isDefault || false,
                  resizedImages: uploadResults.resizedImages
                };
              });

              subSubVariantImages = (await Promise.all(subSubVariantImagePromises)).filter(img => img !== null);
            }

            return {
              ...subSubVariant,
              images: subSubVariantImages
            };
          }));

          return {
            ...subVariant,
            images: subVariantImages,
            subSubVariants: processedSubSubVariants
          };
        }));

        return {
          ...variant,
          images: variantImages,
          subVariants: processedSubVariants
        };
      }));

      // Update product with processed variants
      newProduct.variants = processedVariants;
      await newProduct.save();
    }

    // Populate seller details
    const populatedProduct = await Product.findById(newProduct._id)
      .populate('seller', 'name avatarUrl about');

    // Schedule auction end if it's an auction product
    if (newProduct.status === 'offline_auction') {
      const agenda = require('../config/agenda').agenda;

      // Schedule auction start
      await agenda.schedule(newProduct.auction.startDate, 'update-auction-status', {
        productId: newProduct._id,
        newStatus: 'ongoing'
      });

      // Schedule auction end
      await agenda.schedule(newProduct.auction.endDate, 'update-auction-status', {
        productId: newProduct._id,
        newStatus: 'ended'
      });

      // Also schedule the order creation job to run a minute after the auction ends
      // This ensures the auction is fully ended and the winner is saved before creating the order
      const orderCreationTime = new Date(newProduct.auction.endDate.getTime() + 60000); // 1 minute after end
      await agenda.schedule(orderCreationTime, 'create-auction-winner-order', {
        productId: newProduct._id
      });
    }

    res.status(201).json(populatedProduct);
  } catch (error) {
    console.error('Product creation error:', error);

    if (error.message.includes('Invalid JSON format')) {
      return res.status(400).json({
        message: 'Data format error',
        error: error.message
      });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        error: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      message: 'Failed to create product',
      error: error.message,
      details: error.stack
    });
  }
};



// Helper function to generate SKU for variants
function generateVariantSKU(...parts) {
  const timestamp = Date.now().toString().slice(-4);
  const processedParts = parts
    .filter(Boolean)
    .map(part => part.toLowerCase().replace(/\s+/g, '-'));

  return `${processedParts.join('-')}-${timestamp}`;
}

// Common seller population fields array
const sellerPopulationFields = [
  'firstName',
  'lastName',
  'businessName',
  'storeName',
  'stats.averageRating',
  'stats.totalReviews',
  'storeAvatar',
  'isVerified',
  'email',
  'phoneNumber',
  'businessAddress',
  'warehouseDetails',
  'sellerAddress',
  'offersStorePickup'
];

exports.getAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category = '',
      minPrice = 0,
      maxPrice = Number.MAX_SAFE_INTEGER,
      sortBy = 'newest',
      status = 'active',
      visibility = 'visible'
    } = req.query;

    // Build query - start with base query that excludes offline_auction and draft products, and out of stock products
    let query = {
      status: { $nin: ['offline_auction', 'draft'] },
      stock: { $gt: 0 } // Only fetch products with stock greater than 0
    };

    // Only add additional status filter if specifically provided in the query
    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.visibility) {
      query.visibility = req.query.visibility;
    }
    if (category) {
      query.category = category;
    }
    // Add price range filter
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {
        $gte: Number(minPrice),
        $lte: Number(maxPrice)
      };
    }
    // Build sort options with a default
    let sortOptions = {};
    switch (sortBy) {
      case 'price_asc':
        sortOptions = { price: 1 };
        break;
      case 'price_desc':
        sortOptions = { price: -1 };
        break;
      case 'oldest':
        sortOptions = { createdAt: 1 };
        break;
      case 'popular':
        sortOptions = { 'analytics.views': -1 };
        break;
      case 'best_selling':
        sortOptions = { soldCount: -1 };
        break;
      case 'newest':
      default:
        sortOptions = { createdAt: -1 };
    }
    // Execute query with pagination and updated seller population
    const products = await Product.find(query)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('seller', sellerPopulationFields)
      .select('-__v');
    // Get total count for pagination
    const totalProducts = await Product.countDocuments(query);
    // Calculate pagination info
    const totalPages = Math.ceil(totalProducts / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    // Make sure stats and review data are included in the response
    const productsWithStats = products.map(product => {
      const productObj = product.toObject();
      return {
        ...productObj,
        averageRating: productObj.stats?.averageRating || null,
        reviewCount: productObj.stats?.totalReviews || 0,
        soldCount: Math.max(0, productObj.stats?.soldCount || 0)
      };
    });
    res.json({
      success: true,
      data: {
        products: productsWithStats,
        pagination: {
          currentPage: Number(page),
          totalPages,
          totalProducts,
          hasNextPage,
          hasPrevPage,
          limit: Number(limit)
        },
        filters: {
          category,
          priceRange: {
            min: minPrice,
            max: maxPrice !== Number.MAX_SAFE_INTEGER ? maxPrice : 'no limit'
          },
          sortBy,
          status,
          visibility
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving products',
      error: error.message
    });
  }
};


// Get discounted products (only products with currently active discounts)
exports.getDiscountedProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category = '',
      minPrice = 0,
      maxPrice = Number.MAX_SAFE_INTEGER,
      sortBy = 'newest',
      visibility = 'visible'
    } = req.query;

    const now = new Date();

    // Base query: active, visible, in stock, not offline auction, and discount active in current time window
    let query = {
      status: 'active',
      visibility: visibility || 'visible',
      stock: { $gt: 0 },
      $and: [
        { 'discount.isActive': true },
        { $or: [{ 'discount.startDate': { $exists: false } }, { 'discount.startDate': { $lte: now } }] },
        { $or: [{ 'discount.endDate': { $exists: false } }, { 'discount.endDate': { $gte: now } }] }
      ],
      status: { $ne: 'offline_auction' }
    };

    if (category) {
      query.category = category;
    }

    // Optional price filter (based on base price, consistent with other endpoints)
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {
        $gte: Number(minPrice),
        $lte: Number(maxPrice)
      };
    }

    // Sorting options (consistent with getAllProducts)
    let sortOptions = {};
    switch (sortBy) {
      case 'price_asc':
        sortOptions = { price: 1 };
        break;
      case 'price_desc':
        sortOptions = { price: -1 };
        break;
      case 'oldest':
        sortOptions = { createdAt: 1 };
        break;
      case 'popular':
        sortOptions = { 'analytics.views': -1 };
        break;
      case 'best_selling':
        sortOptions = { soldCount: -1 };
        break;
      case 'newest':
      default:
        sortOptions = { createdAt: -1 };
    }

    // Execute query
    let products = await Product.find(query)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('seller', sellerPopulationFields)
      .select('-__v');

    // Apply de-clustering to avoid consecutive products from the same seller
    products = reorderToAvoidSellerClusters(products);

    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Attach stats fields for convenience
    const productsWithStats = products.map(product => {
      const productObj = product.toObject();
      return {
        ...productObj,
        averageRating: productObj.stats?.averageRating || null,
        reviewCount: productObj.stats?.totalReviews || 0,
        soldCount: Math.max(0, productObj.stats?.soldCount || 0)
      };
    });

    res.json({
      success: true,
      data: {
        products: productsWithStats,
        pagination: {
          currentPage: Number(page),
          totalPages,
          totalProducts,
          hasNextPage,
          hasPrevPage,
          limit: Number(limit)
        },
        filters: {
          category,
          priceRange: {
            min: minPrice,
            max: maxPrice !== Number.MAX_SAFE_INTEGER ? maxPrice : 'no limit'
          },
          sortBy,
          visibility,
          discountedOnly: true
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving discounted products',
      error: error.message
    });
  }
};

// Get a single product
exports.getProduct = async (req, res) => {
  try {
    console.log('Fetching product with ID:', req.params.id);

    // First find the product to check if it's an auction
    const productCheck = await Product.findById(req.params.id);

    if (!productCheck) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // If it's an auction product, we need to populate the buyer fields
    if (productCheck.status === 'offline_auction') {
      const product = await Product.findById(req.params.id)
        .populate({
          path: 'seller',
          // NOTE: We explicitly select rating stats so that the seller object
          // on the product details response has complete review/rating info.
          // This mirrors how other endpoints expose seller rating data and
          // keeps the legacy response shape intact while enriching it.
          select: `
            firstName lastName email phoneNumber businessName 
            businessType businessEmail businessNumber businessAddress 
            storeName aboutStore storeAvatar storeBanner 
            shippingOptions warehouseDetails categories followers
            isVerified accountType storeVisits products customers
            offersStorePickup
            stats.averageRating stats.totalReviews stats.ratingDistribution
          `
        })
        .populate({
          path: 'auction.bids.buyer',
          select: 'firstName lastName profileImage'
        })
        .populate({
          path: 'auction.currentHighestBid.buyer',
          select: 'firstName lastName profileImage'
        })
        .populate({
          path: 'auction.winner.buyer',
          select: 'firstName lastName profileImage'
        });

      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      // Format the product for response
      const formattedProduct = product.toObject();

      // Format seller information
      if (formattedProduct.seller) {
        formattedProduct.seller = {
          _id: formattedProduct.seller._id,
          personalInfo: {
            firstName: formattedProduct.seller.firstName,
            lastName: formattedProduct.seller.lastName,
            email: formattedProduct.seller.email,
            phoneNumber: formattedProduct.seller.phoneNumber
          },
          businessInfo: {
            businessName: formattedProduct.seller.businessName,
            businessType: formattedProduct.seller.businessType,
            businessEmail: formattedProduct.seller.businessEmail,
            businessNumber: formattedProduct.seller.businessNumber,
            businessAddress: formattedProduct.seller.businessAddress,
            taxInformation: formattedProduct.seller.taxInformation
          },
          storeInfo: {
            storeName: formattedProduct.seller.storeName,
            aboutStore: formattedProduct.seller.aboutStore,
            storeAvatar: formattedProduct.seller.storeAvatar,
            storeBanner: formattedProduct.seller.storeBanner,
            categories: formattedProduct.seller.categories,
            followerCount: formattedProduct.seller.followers ? formattedProduct.seller.followers.length : 0
          },
          shippingInfo: {
            shippingOptions: formattedProduct.seller.shippingOptions,
            warehouseDetails: formattedProduct.seller.warehouseDetails,
            offersStorePickup: formattedProduct.seller.offersStorePickup
          },
          addresses: {
            businessAddress: formattedProduct.seller.businessAddress,
            warehouseAddress: formattedProduct.seller.warehouseDetails?.address,
            sellerAddress: formattedProduct.seller.sellerAddress
          },
          verification: {
            isVerified: formattedProduct.seller.isVerified,
            accountType: formattedProduct.seller.accountType
          },
          stats: {
            // Store/storefront level stats
            storeVisits: formattedProduct.seller.storeVisits || 0,
            totalProducts: formattedProduct.seller.products ? formattedProduct.seller.products.length : 0,
            totalCustomers: formattedProduct.seller.customers ? formattedProduct.seller.customers.length : 0,
            // Review/rating stats aggregated from the seller's products.
            // These are read from the Seller.stats sub-document so that
            // product details consumers can show store rating information.
            averageRating: formattedProduct.seller.stats?.averageRating || 0,
            totalReviews: formattedProduct.seller.stats?.totalReviews || 0,
            ratingDistribution: formattedProduct.seller.stats?.ratingDistribution || {
              1: 0,
              2: 0,
              3: 0,
              4: 0,
              5: 0
            }
          }
        };
      }

      // Format auction data
      if (formattedProduct.auction) {
        // Format bids
        if (formattedProduct.auction.bids) {
          formattedProduct.auction.bids = formattedProduct.auction.bids.map(bid => ({
            _id: bid._id,
            buyer: bid.buyer ? {
              _id: bid.buyer._id,
              firstName: bid.buyer.firstName,
              lastName: bid.buyer.lastName,
              profileImage: bid.buyer.profileImage
            } : bid.buyer,
            amount: bid.amount,
            status: bid.status,
            createdAt: bid.createdAt
          }));
        }

        // Format current highest bid
        if (formattedProduct.auction.currentHighestBid && formattedProduct.auction.currentHighestBid.buyer) {
          formattedProduct.auction.currentHighestBid = {
            amount: formattedProduct.auction.currentHighestBid.amount,
            buyer: {
              _id: formattedProduct.auction.currentHighestBid.buyer._id,
              firstName: formattedProduct.auction.currentHighestBid.buyer.firstName,
              lastName: formattedProduct.auction.currentHighestBid.buyer.lastName,
              profileImage: formattedProduct.auction.currentHighestBid.buyer.profileImage
            }
          };
        }

        // Format winner
        if (formattedProduct.auction.winner && formattedProduct.auction.winner.buyer) {
          formattedProduct.auction.winner = {
            bidAmount: formattedProduct.auction.winner.bidAmount,
            winningDate: formattedProduct.auction.winner.winningDate,
            buyer: {
              _id: formattedProduct.auction.winner.buyer._id,
              firstName: formattedProduct.auction.winner.buyer.firstName,
              lastName: formattedProduct.auction.winner.buyer.lastName,
              profileImage: formattedProduct.auction.winner.buyer.profileImage
            }
          };
        }
      }

      // Add inventory information
      formattedProduct.inventory = {
        currentStock: formattedProduct.stock,
        lowStockAlert: formattedProduct.lowStockAlert,
        sku: formattedProduct.sku,
        quantity: formattedProduct.inventory?.quantity || 0,
        lowStockThreshold: formattedProduct.inventory?.lowStockThreshold || 5
      };

      // Add pricing information
      formattedProduct.pricing = {
        originalPrice: formattedProduct.price,
        discountInfo: formattedProduct.discount,
        taxable: formattedProduct.pricing?.taxable || true,
        taxRate: formattedProduct.pricing?.taxRate || 0
      };

      // Add shipping information
      formattedProduct.shippingDetails = {
        weight: formattedProduct.shippingInfo?.weight || null,
        dimensions: formattedProduct.shippingInfo?.dimensions || null,
        methods: formattedProduct.shippingInfo?.shippingMethods || []
      };

      // Increment view count
      await Product.findByIdAndUpdate(req.params.id, {
        $inc: { 'stats.views': 1 },
        $set: { 'stats.lastViewed': new Date() }
      });

      // // Update seller stats
      // const seller = await Seller.findById(formattedProduct.seller._id);
      // if (seller) {
      //   // Increment total store visits
      //   seller.storeVisits = (seller.storeVisits || 0) + 0;

      //   // Update monthly stats for store visits
      //   const currentDate = new Date();
      //   const monthKey = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}`;

      //   // Get current month's visits or initialize to 0
      //   const currentMonthVisits = seller.monthlyStats.storeVisits.get(monthKey) || 0;
      //   seller.monthlyStats.storeVisits.set(monthKey, currentMonthVisits + 1);

      //   await seller.save();
      // }

      console.log('Auction product retrieved successfully');
      return res.json(formattedProduct);
    }

    // For non-auction products, use the existing aggregation pipeline
    const product = await Product.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(req.params.id)
        }
      },
      {
        $lookup: {
          from: 'sellers',
          localField: 'seller',
          foreignField: '_id',
          as: 'sellerInfo'
        }
      },
      { $unwind: '$sellerInfo' },
      {
        $addFields: {
          seller: {
            _id: '$sellerInfo._id',
            personalInfo: {
              firstName: '$sellerInfo.firstName',
              lastName: '$sellerInfo.lastName',
              email: '$sellerInfo.email',
              phoneNumber: '$sellerInfo.phoneNumber'
            },
            businessInfo: {
              businessName: '$sellerInfo.businessName',
              businessType: '$sellerInfo.businessType',
              businessEmail: '$sellerInfo.businessEmail',
              businessNumber: '$sellerInfo.businessNumber',
              businessAddress: '$sellerInfo.businessAddress',
              taxInformation: '$sellerInfo.taxInformation'
            },
            storeInfo: {
              storeName: '$sellerInfo.storeName',
              aboutStore: '$sellerInfo.aboutStore',
              storeAvatar: '$sellerInfo.storeAvatar',
              storeBanner: '$sellerInfo.storeBanner',
              categories: '$sellerInfo.categories',
              followerCount: { $size: { $ifNull: ['$sellerInfo.followers', []] } }
            },
            shippingInfo: {
              shippingOptions: '$sellerInfo.shippingOptions',
              warehouseDetails: '$sellerInfo.warehouseDetails',
              offersStorePickup: '$sellerInfo.offersStorePickup'
            },
            addresses: {
              businessAddress: '$sellerInfo.businessAddress',
              warehouseAddress: '$sellerInfo.warehouseDetails.address',
              sellerAddress: '$sellerInfo.sellerAddress'
            },
            verification: {
              isVerified: '$sellerInfo.isVerified',
              accountType: '$sellerInfo.accountType'
            },
            stats: {
              // Store/storefront level stats
              storeVisits: '$sellerInfo.storeVisits',
              totalProducts: { $size: { $ifNull: ['$sellerInfo.products', []] } },
              totalCustomers: { $size: { $ifNull: ['$sellerInfo.customers', []] } },
              // Review/rating stats from Seller.stats (computed from product reviews)
              averageRating: { $ifNull: ['$sellerInfo.stats.averageRating', 0] },
              totalReviews: { $ifNull: ['$sellerInfo.stats.totalReviews', 0] },
              ratingDistribution: {
                $ifNull: [
                  '$sellerInfo.stats.ratingDistribution',
                  {
                    1: 0,
                    2: 0,
                    3: 0,
                    4: 0,
                    5: 0
                  }
                ]
              }
            }
          },
          // Calculate stats based on embedded reviews
          stats: {
            averageRating: {
              $cond: {
                if: { $isArray: '$reviews' },
                then: {
                  $cond: {
                    if: { $gt: [{ $size: '$reviews' }, 0] },
                    then: { $avg: '$reviews.rating' },
                    else: null
                  }
                },
                else: null
              }
            },
            reviewCount: {
              $cond: {
                if: { $isArray: '$reviews' },
                then: { $size: '$reviews' },
                else: 0
              }
            },
            viewCount: '$stats.views',
            soldCount: { $max: [0, { $ifNull: ['$stats.soldCount', 0] }] },
            lastViewed: '$stats.lastViewed',
            lastRestocked: '$stats.lastRestocked'
          },
          // Add inventory information
          inventory: {
            currentStock: '$stock',
            lowStockAlert: '$lowStockAlert',
            sku: '$sku'
          },
          // Add pricing information
          pricing: {
            originalPrice: '$price',
            discountInfo: '$discount',
            compareAtPrice: '$pricing.compareAtPrice',
            costPerItem: '$pricing.costPerItem'
          },
          // Add shipping information
          shippingDetails: {
            weight: '$shippingInfo.weight',
            dimensions: '$shippingInfo.dimensions',
            methods: '$shippingInfo.shippingMethods'
          }
        }
      },
      {
        $project: {
          sellerInfo: 0,
          'seller.password': 0,
          'seller.otp': 0,
          'seller.passwordResetToken': 0,
          'seller.passwordResetExpires': 0,
          'seller.bankDetails.accountNumber': 0,
          'seller.bankDetails.swiftCode': 0,
          'seller.bankDetails.bankIdentifierCode': 0,
          // Keep other sensitive fields hidden
          'pricing.costPerItem': 0
        }
      }
    ]);

    if (!product || product.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Increment view count and update last viewed
    await Product.findByIdAndUpdate(req.params.id, {
      $inc: { 'stats.views': 1 },
      $set: { 'stats.lastViewed': new Date() }
    });

    const seller = await Seller.findById(product[0].seller._id);
    if (seller) {
      // Increment total store visits
      seller.storeVisits = (seller.storeVisits || 0) + 1;

      // Update monthly stats for store visits
      const currentDate = new Date();
      const monthKey = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}`;

      // Get current month's visits or initialize to 0
      const currentMonthVisits = seller.monthlyStats.storeVisits.get(monthKey) || 0;
      seller.monthlyStats.storeVisits.set(monthKey, currentMonthVisits + 1);

      await seller.save();
    }

    console.log('Product retrieved successfully');
    res.json(product[0]);
  } catch (error) {
    console.error('Error in getProduct:', error);
    res.status(500).json({
      message: 'Failed to retrieve product',
      error: error.message
    });
  }
};

// Update a single product
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const sellerId = req.user.id;

    // Find the product and verify ownership
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Add debug logging
    console.log('Product Seller ID:', product.seller);
    console.log('Request User ID:', sellerId);

    // Compare seller ID, handling both object and string cases
    const productSellerId = product.seller._id || product.seller;
    if (productSellerId.toString() !== sellerId.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }

    const cdnPrefix = 'https://' + process.env.CDN_URL;
    // this array will contain product images to be deleted
    let deletedProductImageUrls = [];
    // this array will contain product variant images to be deleted
    let deletedProductVariantImageUrls = [];
    // Handle main product images
    if (updates.images && Array.isArray(updates.images)) {
      // Get existing image URLs
      const existingProductImageUrls = (product.images || []).map(img => img.url);
      // Extract new image URLs
      const newProductImageUrls = (updates.images || []).map(img => img.data);

      // Find images that were removed
      deletedProductImageUrls = existingProductImageUrls
        .filter(url => url.startsWith(cdnPrefix)) // only keep images from your CDN
        .filter(url => !newProductImageUrls.includes(url)); // then check which are not in the new list

      const imagesLinks = [];
      for (let image of updates.images) {
        if (image.data.startsWith(cdnPrefix)) {
          imagesLinks.push({ url: image.data }); // Keep existing S3 image
        } else {
          // Process new base64 image with resizing
          const buffer = Buffer.from(image.data, 'base64');
          const fileName = uuidv4();
          const basePath = `sellers/${sellerId}/products/${id}/images`;

          // Upload original and resized versions using the utility function
          const uploadResults = await uploadResizedImages(buffer, basePath, fileName);

          imagesLinks.push({
            url: uploadResults.original.url,
            resizedImages: uploadResults.resizedImages
          });
        }
      }
      updates.images = imagesLinks;
    }

    // Process variant images if they exist
    if (updates.variants && Array.isArray(updates.variants)) {
      const existingImageUrls = ExtractAllImageUrlsFromVariants(product.variants || []);
      const updatedImageUrls = ExtractAllImageUrlsFromVariants(updates.variants || []);

      // Images that are in DB but not in the update request
      deletedProductVariantImageUrls = existingImageUrls
        .filter(url => url.startsWith(cdnPrefix)) // only keep images from your CDN
        .filter(url => !updatedImageUrls.includes(url));

      // Preserve existing variant IDs and generate new ones only for new variants
      const variantsWithIds = updates.variants.map(variant => {
        // If variant has an id, keep it (existing variant) - frontend sends 'id' not '_id'
        // If no id, generate a new one (new variant)
        const variantWithId = {
          ...variant,
          _id: variant.id || new mongoose.Types.ObjectId()
        };

        // Preserve existing subvariant IDs and generate new ones only for new subvariants
        if (variantWithId.subVariants && Array.isArray(variantWithId.subVariants)) {
          variantWithId.subVariants = variantWithId.subVariants.map(subVariant => {
            const subVariantWithId = {
              ...subVariant,
              _id: subVariant.id || new mongoose.Types.ObjectId()
            };

            // Preserve existing subsubvariant IDs and generate new ones only for new subsubvariants
            if (subVariantWithId.subSubVariants && Array.isArray(subVariantWithId.subSubVariants)) {
              subVariantWithId.subSubVariants = subVariantWithId.subSubVariants.map(subSubVariant => ({
                ...subSubVariant,
                _id: subSubVariant.id || new mongoose.Types.ObjectId()
              }));
            }

            return subVariantWithId;
          });
        }

        return variantWithId;
      });

      // Save the product with variants that have proper IDs
      product.variants = variantsWithIds;
      await product.save();

      // Now process images with the proper variant IDs
      updates.variants = await Promise.all(variantsWithIds.map(async (variant) => {
        // Process main variant images
        let variantImages = [];
        if (variant?.images?.length > 0 && Array.isArray(variant.images)) {
          for (let image of variant.images) {
            if (!image?.data) {
              console.log('Skipping variant image processing - no image data');
              continue;
            }

            if (image.data.startsWith('https://')) {
              variantImages.push(image);
            } else {
              // Handle base64 data with or without prefix
              const base64Data = image.data.split(',')[1] || image.data;
              if (!base64Data) {
                console.error('Invalid base64 data for variant image:', image);
                continue;
              }

              const buffer = Buffer.from(base64Data, 'base64');
              const fileName = uuidv4();
              const basePath = `sellers/${sellerId}/products/${id}/variants/${variant._id}/images`;

              // Upload original and resized versions using the utility function
              const uploadResults = await uploadResizedImages(buffer, basePath, fileName);

              variantImages.push({
                data: uploadResults.original.url,
                contentType: image.contentType,
                isDefault: image.isDefault || false,
                resizedImages: uploadResults.resizedImages
              });
            }
          }
        }

        // Process subvariants
        const processedSubVariants = await Promise.all((variant.subVariants || []).map(async (subVariant) => {
          const subVariantImages = [];
          if (subVariant?.images?.length > 0 && Array.isArray(subVariant.images)) {
            for (let image of subVariant.images) {
              if (!image?.data) {
                console.log('Skipping subvariant image processing - no image data');
                continue;
              }

              if (image.data.startsWith('https://')) {
                subVariantImages.push(image);
              } else {
                const base64Data = image.data.split(',')[1] || image.data;
                if (!base64Data) {
                  console.error('Invalid base64 data for subvariant image:', image);
                  continue;
                }

                const buffer = Buffer.from(base64Data, 'base64');
                const fileName = uuidv4();
                const basePath = `sellers/${sellerId}/products/${id}/variants/${subVariant._id}/images`;

                // Upload original and resized versions using the utility function
                const uploadResults = await uploadResizedImages(buffer, basePath, fileName);

                subVariantImages.push({
                  data: uploadResults.original.url,
                  contentType: image.contentType,
                  isDefault: image.isDefault || false,
                  resizedImages: uploadResults.resizedImages
                });
              }
            }
          }

          // Process subsubvariants
          const processedSubSubVariants = await Promise.all((subVariant.subSubVariants || []).map(async (subSubVariant) => {
            const subSubVariantImages = [];
            if (subSubVariant?.images?.length > 0 && Array.isArray(subSubVariant.images)) {
              for (let image of subSubVariant.images) {
                if (!image?.data) {
                  console.log('Skipping subsubvariant image processing - no image data');
                  continue;
                }

                if (image.data.startsWith('https://')) {
                  subSubVariantImages.push(image);
                } else {
                  const base64Data = image.data.split(',')[1] || image.data;
                  if (!base64Data) {
                    console.error('Invalid base64 data for subsubvariant image:', image);
                    continue;
                  }

                  const buffer = Buffer.from(base64Data, 'base64');
                  const fileName = uuidv4();
                  const basePath = `sellers/${sellerId}/products/${id}/variants/${subSubVariant._id}/images`;

                  // Upload original and resized versions using the utility function
                  const uploadResults = await uploadResizedImages(buffer, basePath, fileName);

                  subSubVariantImages.push({
                    data: uploadResults.original.url,
                    contentType: image.contentType,
                    isDefault: image.isDefault || false,
                    resizedImages: uploadResults.resizedImages
                  });
                }
              }
            }

            return {
              ...subSubVariant,
              images: subSubVariantImages.length > 0 ? subSubVariantImages : []
            };
          }));

          return {
            ...subVariant,
            images: subVariantImages.length > 0 ? subVariantImages : [],
            subSubVariants: processedSubSubVariants
          };
        }));

        return {
          ...variant,
          images: variantImages.length > 0 ? variantImages : [],
          subVariants: processedSubVariants
        };
      }));
    }

    // Protected fields that shouldn't be updated directly
    const protectedFields = ['_id', 'seller', 'createdAt', 'reviews', 'analytics', 'stats'];

    // Remove protected fields from updates
    protectedFields.forEach(field => {
      delete updates[field];
    });

    // If blips aren't being updated, remove it from updates to preserve existing blips
    if (!updates.blips) {
      delete updates.blips;
    }

    // Update all fields except protected ones
    Object.assign(product, {
      ...updates,
      updatedAt: Date.now()
    });

    // save product
    await product.save();
    // delete product images if any
    if (deletedProductImageUrls.length > 0) {
      const s3Response = await ProductDeleteS3ObjectsByUrls(deletedProductImageUrls);
      if (s3Response.Errors.length > 0) {
        console.error('Failed to delete some objects:', s3Response.Errors);
      }
    }
    // delete produc variant images if any
    if (deletedProductVariantImageUrls.length > 0) {
      const s3Response = await ProductVariantDeleteS3ObjectsByUrls(deletedProductVariantImageUrls);
      if (s3Response.Errors.length > 0) {
        console.error('Failed to delete some objects:', s3Response.Errors);
      }
    }

    // Populate seller information before sending response
    const updatedProduct = await Product.findById(id)
      .populate('seller', 'businessName storeName');

    res.json({
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct
    });

  } catch (error) {
    console.error('Update Product Error:', error);
    res.status(500).json({
      message: 'Failed to update product',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Delete a product
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user.id;

    // Find the product and verify ownership
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Compare seller ID, handling both object and string cases
    const productSellerId = product.seller._id || product.seller;
    if (productSellerId.toString() !== sellerId.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this product' });
    }

    // Get existing product image URLs
    const existingProductImageUrls = (product.images || []).map(img => img.url);
    // Get existing product variatn image URLs
    const existingProductVariantImageUrls = ExtractAllImageUrlsFromVariants(product.variants || []);

    const allExistingImageUrls = [
      ...existingProductImageUrls,
      ...existingProductVariantImageUrls
    ];

    // delete product images and product variant images if any
    if (allExistingImageUrls.length > 0) {
      const s3Response = await ProductDeleteS3ObjectsByUrls(allExistingImageUrls);
      if (s3Response.Errors.length > 0) {
        console.error('Failed to delete some objects:', s3Response.Errors);
      }
    }

    // Delete the product
    await Product.findByIdAndDelete(id);

    res.json({
      message: 'Product deleted successfully',
      deletedProduct: {
        id: product._id,
        name: product.name
      }
    });

  } catch (error) {
    res.status(500).json({
      message: 'Failed to delete product',
      error: error.message
    });
  }
};

// Search products
exports.searchProducts = async (req, res) => {
  const { query, minPrice, maxPrice, condition } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  try {
    const queryFilter = {
      status: 'active',
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } },
        { subCategory: { $regex: query, $options: 'i' } },
        { subSubCategory: { $regex: query, $options: 'i' } },
        { brand: { $regex: query, $options: 'i' } },
        { tags: { $regex: query, $options: 'i' } },
      ],
    };

    // Get total count for pagination info
    const totalProducts = await Product.countDocuments(queryFilter);

    // Get paginated results
    const products = await Product.find(queryFilter)
      .populate('seller', 'name avatarUrl about')
      .populate('reviews.buyer', 'firstName lastName')
      .skip(skip)
      .limit(limit);

    // Clamp soldCount
    const productsWithStats = products.map(product => {
      const productObj = product.toObject();
      return {
        ...productObj,
        stats: {
          ...productObj.stats,
          soldCount: Math.max(0, productObj.stats?.soldCount || 0)
        }
      };
    });

    res.json({
      products: productsWithStats,
      pagination: {
        total: totalProducts,
        page,
        limit,
        pages: Math.ceil(totalProducts / limit)
      }
    });
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

    // Compare seller ID, handling both object and string cases
    const productSellerId = product.seller._id || product.seller;
    if (productSellerId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }

    product.stock = stock || product.stock;
    product.updatedAt = Date.now();

    const updatedProduct = await product.save();

    // Populate the seller field with seller details after updating the product
    const populatedProduct = await Product.findById(updatedProduct._id)
      .populate('seller', 'name avatarUrl about');

    res.json(populatedProduct);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to update product stock',
      error: error.message
    });
  }
};

// Deep search products
exports.deepSearchProducts = async (req, res) => {
  const {
    query = '',
    minPrice,
    maxPrice,
    condition,
    sortBy = 'newest',
    order = 'desc',
  } = req.query;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  try {
    const filter = { status: 'active' };

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice !== undefined) filter.price.$lte = parseFloat(maxPrice);
    }

    // Condition filter
    if (condition) {
      filter.condition = new RegExp(`^${condition}$`, 'i');
    }

    let searchResults = [];
    let total = 0;

    if (query.trim()) {
      const rawTerms = query.trim().split(/\s+/).filter(term => term.length > 0);

      // Helper: generate general spacing variations
      function generateSpacingVariants(term) {
        const variants = [term];
        if (term.length > 3) {
          for (let i = 1; i < term.length; i++) {
            const left = term.slice(0, i);
            const right = term.slice(i);
            // Only insert space between alphabetic characters
            if (/^[a-zA-Z]+$/.test(left) && /^[a-zA-Z]+$/.test(right)) {
              variants.push(left + ' ' + right);
            }
          }
        }
        return variants;
      }

      // Helper: generate reverse spacing (remove spaces from multi-word terms)
      function generateReverseSpacing(term) {
        const variants = [term];
        // If term contains spaces, create version without spaces
        if (term.includes(' ')) {
          variants.push(term.replace(/\s+/g, ''));
        }
        return variants;
      }

      // Expand search terms: plural/singular + spacing variations + reverse spacing
      let expandedTerms = [...rawTerms];
      rawTerms.forEach(term => {
        if (term.length > 2) {
          // plural/singular
          if (term.endsWith('s') && term.length > 3) {
            expandedTerms.push(term.slice(0, -1));
          } else if (!term.endsWith('s')) {
            expandedTerms.push(`${term}s`);
          }
        }
        // add spacing variations
        expandedTerms.push(...generateSpacingVariants(term));
        // add reverse spacing variations
        expandedTerms.push(...generateReverseSpacing(term));
      });

      // Deduplicate
      const uniqueTerms = [...new Set(expandedTerms)];

      const orConditions = [];

      if (query.trim().length === 1) {
        const singleChar = query.trim();
        orConditions.push(
          { name: { $regex: singleChar, $options: 'i' } },
          { category: { $regex: singleChar, $options: 'i' } },
          { subCategory: { $regex: singleChar, $options: 'i' } },
          { brand: { $regex: singleChar, $options: 'i' } }
        );
      } else {
        // Exact matches
        orConditions.push(
          { name: { $regex: query, $options: 'i' } },
          { category: { $regex: `^${query}$`, $options: 'i' } },
          { subCategory: { $regex: `^${query}$`, $options: 'i' } },
          { subSubCategory: { $regex: `^${query}$`, $options: 'i' } }
        );

        // Partial matches for all expanded terms
        uniqueTerms.forEach(term => {
          orConditions.push(
            { name: { $regex: term, $options: 'i' } },
            { description: { $regex: term, $options: 'i' } },
            { category: { $regex: term, $options: 'i' } },
            { subCategory: { $regex: term, $options: 'i' } },
            { subSubCategory: { $regex: term, $options: 'i' } },
            { brand: { $regex: term, $options: 'i' } },
            { tags: { $regex: term, $options: 'i' } },
            { sku: { $regex: term, $options: 'i' } }
          );
        });
      }

      const mongoSearchQuery = {
        ...filter,
        $or: orConditions,
      };

      const MAX_SEARCH_RESULTS = 200;
      total = await Product.countDocuments(mongoSearchQuery);

      const dbResults = await Product.find(mongoSearchQuery)
        .populate('seller', 'name avatarUrl about')
        .populate('reviews.buyer', 'firstName lastName')
        .sort({ createdAt: -1 })
        .limit(MAX_SEARCH_RESULTS);

      if (dbResults.length > 0) {
        const fuse = new Fuse(dbResults, {
          keys: [
            { name: 'name', weight: 2.0 },
            { name: 'category', weight: 1.8 },
            { name: 'subCategory', weight: 1.5 },
            { name: 'subSubCategory', weight: 1.2 },
            { name: 'description', weight: 1.0 },
            { name: 'brand', weight: 0.8 },
            { name: 'tags', weight: 0.7 },
            { name: 'sku', weight: 0.5 }
          ],
          threshold: 0.45,
          distance: 200,
          includeScore: true,
          findAllMatches: true,
          ignoreLocation: true,
          minMatchCharLength: query.trim().length === 1 ? 1 : 2,
        });

        const fuzzyResults = fuse.search(query);

        const boostedResults = fuzzyResults.map(result => {
          const item = result.item;
          let score = result.score;
          let boostFactor = 1.0;

          if (item.name && item.name.toLowerCase().includes(query.toLowerCase())) {
            boostFactor *= 0.7;
          }

          return { ...result, score: score * boostFactor };
        });

        boostedResults.sort((a, b) => a.score - b.score);
        const mappedResults = boostedResults.map(r => r.item);

        const sortOptions = getSortOptions(sortBy, order);
        mappedResults.sort((a, b) => {
          const sortKey = Object.keys(sortOptions)[0];
          const sortDirection = sortOptions[sortKey];
          const getValue = (obj, path) =>
            path.split('.').reduce((o, key) => (o && o[key] !== undefined ? o[key] : null), obj);

          const aValue = getValue(a, sortKey);
          const bValue = getValue(b, sortKey);

          if (aValue === null && bValue === null) return 0;
          if (aValue === null) return sortDirection > 0 ? -1 : 1;
          if (bValue === null) return sortDirection > 0 ? 1 : -1;

          return sortDirection * (aValue > bValue ? 1 : aValue < bValue ? -1 : 0);
        });

        searchResults = mappedResults.slice(skip, skip + limit);
        if (fuzzyResults.length < total) {
          total = fuzzyResults.length;
        }
      } else {
        searchResults = [];
        total = 0;
      }
    } else {
      total = await Product.countDocuments(filter);
      searchResults = await Product.find(filter)
        .sort(getSortOptions(sortBy, order))
        .populate('seller', 'name avatarUrl about')
        .populate('reviews.buyer', 'firstName lastName')
        .skip(skip)
        .limit(limit);
    }

    const productsWithStats = searchResults.map(product => {
      const productObj = product.toObject ? product.toObject() : product;
      if (productObj.stats) {
        productObj.stats.soldCount = Math.max(0, productObj.stats.soldCount || 0);
      }
      return productObj;
    });

    return res.json({
      products: productsWithStats,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      filters: {
        query,
        priceRange: { min: minPrice, max: maxPrice },
        condition,
        sortBy,
        order,
      },
    });
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({
      message: 'Failed to deep search products',
      error: error.message,
    });
  }
};

// Helper: Get sort options
function getSortOptions(sortBy, order) {
  const direction = order === 'asc' ? 1 : -1;
  switch (sortBy) {
    case 'price_asc':
      return { price: 1 };
    case 'price_desc':
      return { price: -1 };
    case 'oldest':
      return { createdAt: 1 };
    case 'popular':
      return { 'analytics.views': -1 };
    case 'best_selling':
      return { 'stats.soldCount': -1 };
    case 'rating':
      return { 'stats.averageRating': -1 };
    case 'newest':
    default:
      return { createdAt: direction };
  }
}

// Get products that just arrived
// Get just arrived products
exports.getJustArrivedProducts = async (req, res) => {
  try {
    const products = await Product.find({
      status: 'active',
      visibility: 'visible'
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('seller', sellerPopulationFields);

    // Add review stats data to each product
    const productsWithStats = products.map(product => {
      const productObj = product.toObject();
      return {
        ...productObj,
        averageRating: productObj.stats?.averageRating || null,
        reviewCount: productObj.stats?.totalReviews || 0
      };
    });

    res.json({
      success: true,
      data: productsWithStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving just arrived products',
      error: error.message
    });
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

    // Clamp soldCount
    const productsWithStats = products.map(product => {
      return {
        ...product, // Aggregation result is POJO, not Mongoose doc
        stats: {
          ...product.stats,
          soldCount: Math.max(0, product.stats?.soldCount || 0)
        }
      };
    });

    res.json(productsWithStats);
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

    // Clamp soldCount
    const productsWithStats = products.map(product => {
      const productObj = product.toObject();
      return {
        ...productObj,
        stats: {
          ...productObj.stats,
          soldCount: Math.max(0, productObj.stats?.soldCount || 0)
        }
      };
    });

    res.json(productsWithStats);
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
      status: 'active',
      $or: [
        { category: { $in: buyer.selectedCategories.map(cat => cat.name) } },
        { subCategory: { $in: subcategoryNames } }
      ]
    })
      .sort({ createdAt: -1 })
      .populate('seller', 'name avatarUrl about offersStorePickup')
      .populate('reviews.buyer', 'firstName lastName');

    // Clamp soldCount
    const productsWithStats = products.map(product => {
      const productObj = product.toObject();
      return {
        ...productObj,
        stats: {
          ...productObj.stats,
          soldCount: Math.max(0, productObj.stats?.soldCount || 0)
        }
      };
    });

    res.json(productsWithStats);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve feed products', error: error.message });
  }
};

// Get trending products based on orders and view count with randomization
exports.getTrendingProducts = async (req, res) => {
  try {
    // Define the trending product query
    const trendingQuery = {
      status: 'active',
      visibility: 'visible',
      $or: [
        { 'analytics.views': { $gt: 10 } },
        { 'analytics.orderCount': { $gt: 0 } }
      ]
    };

    // Define the fallback query for any active and visible products
    const fallbackQuery = {
      status: 'active',
      visibility: 'visible'
    };

    // First, try to get the count of trending products
    let productCount = await Product.countDocuments(trendingQuery);

    // Decide which query to use
    let queryToUse = trendingQuery;
    if (productCount === 0) {
      // If no trending products, use the fallback query
      queryToUse = fallbackQuery;
      productCount = await Product.countDocuments(fallbackQuery);
    }

    // Limit to max 20 products
    const limit = Math.min(20, productCount);

    // Skip a random number of documents for randomization
    const skip = productCount > limit ?
      Math.floor(Math.random() * (productCount - limit)) : 0;

    // Fetch the products
    const products = await Product.find(queryToUse)
      .skip(skip)
      .limit(limit)
      .populate('seller', sellerPopulationFields);

    // Shuffle the results for additional randomization
    const shuffledProducts = products.sort(() => 0.5 - Math.random());

    // Add review stats data to each product
    const productsWithStats = shuffledProducts.map(product => {
      const productObj = product.toObject();
      return {
        ...productObj,
        averageRating: productObj.stats?.averageRating || null,
        reviewCount: productObj.stats?.totalReviews || 0,
        soldCount: Math.max(0, productObj.stats?.soldCount || 0)
      };
    });

    res.json({
      success: true,
      data: productsWithStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving trending products',
      error: error.message
    });
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
      select: 'name avatarUrl about offersStorePickup'
    });

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve trending products by category', error: error.message });
  }
};

// Get products by main category
exports.getProductsByCategory = async (req, res) => {
  const { category } = req.params;
  const { limit = 20, page = 1, minPrice, maxPrice, condition, sortBy = 'newest', order = 'desc' } = req.query;

  try {
    // Build query object
    const query = {
      category,
      status: 'active',
      visibility: 'visible'
    };

    // Add price filter if min or max price is provided
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);
    }

    // Add condition filter if provided (case-insensitive)
    if (condition) {
      query.condition = { $regex: new RegExp(`^${condition}$`, 'i') };
    }

    // Build sort options
    let sortOptions = {};
    switch (sortBy) {
      case 'price_asc':
        sortOptions = { price: 1 };
        break;
      case 'price_desc':
        sortOptions = { price: -1 };
        break;
      case 'oldest':
        sortOptions = { createdAt: 1 };
        break;
      case 'newest':
      default:
        sortOptions = { createdAt: -1 };
    }

    const products = await Product.find(query)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('seller', 'name avatarUrl about offersStorePickup')
      .populate('reviews.buyer', 'firstName lastName');

    const total = await Product.countDocuments(query);

    // Clamp soldCount
    const productsWithStats = products.map(product => {
      const productObj = product.toObject();
      return {
        ...productObj,
        stats: {
          ...productObj.stats,
          soldCount: Math.max(0, productObj.stats?.soldCount || 0)
        }
      };
    });

    res.json({
      products: productsWithStats,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalProducts: total,
      filters: {
        category,
        priceRange: {
          min: minPrice,
          max: maxPrice
        },
        condition,
        sortBy,
        order
      }
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
          select: 'name avatarUrl about offersStorePickup'
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


// Get seller's products
exports.getSellerProducts = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const {
      page = 1,
      limit = 10,
      status,
      visibility,
      minPrice,
      maxPrice,
      condition,
      sortBy = 'newest'
    } = req.query;

    // Build query with base condition to exclude offline_auction products
    const query = {
      seller: sellerId,
      status: { $ne: 'offline_auction' }
    };

    // Add additional status filter if provided
    if (status) {
      query.status = status;
    }
    if (visibility) {
      query.visibility = visibility;
    }

    // Add price filter if min or max price is provided
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);
    }

    // Add condition filter if provided (case-insensitive)
    if (condition) {
      query.condition = { $regex: new RegExp(`^${condition}$`, 'i') };
    }

    // Build sort options
    let sortOptions = {};
    switch (sortBy) {
      case 'oldest':
        sortOptions = { createdAt: 1 };
        break;
      case 'price_asc':
        sortOptions = { price: 1 };
        break;
      case 'price_desc':
        sortOptions = { price: -1 };
        break;
      case 'best_selling':
        sortOptions = { 'stats.soldCount': -1 };
        break;
      default: // 'newest'
        sortOptions = { createdAt: -1 };
    }

    // Get products with all necessary fields
    const products = await Product.find(query)
      .select(`
        name 
        description
        price 
        category 
        images 
        status
        variants
        stock
        inventory
        stats
        discount
        pricing
        createdAt
        brand
        sku
        condition
        blips
      `)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(limit);

    // Get total count for pagination
    const totalProducts = await Product.countDocuments(query);

    // Calculate additional statistics based on base query (seller products excluding offline_auction)
    const baseQuery = {
      seller: sellerId,
      status: { $ne: 'offline_auction' }
    };

    // Get statistics
    const [
      totalSellerProducts,
      productsWithBlips,
      productsWithoutBlips,
      activeProducts,
      draftProducts
    ] = await Promise.all([
      // Total number of products (excluding offline_auction)
      Product.countDocuments(baseQuery),

      // Number of products with blips
      Product.countDocuments({
        ...baseQuery,
        blips: { $exists: true, $not: { $size: 0 } }
      }),

      // Number of products without blips
      Product.countDocuments({
        ...baseQuery,
        $or: [
          { blips: { $exists: false } },
          { blips: { $size: 0 } }
        ]
      }),

      // Number of active products
      Product.countDocuments({
        ...baseQuery,
        status: 'active'
      }),

      // Number of draft products
      Product.countDocuments({
        ...baseQuery,
        status: 'draft'
      })
    ]);

    // Fetch seller's vacation mode status
    const seller = await Seller.findById(sellerId).select('vacationMode');
    const isSellerOnVacation = seller?.vacationMode?.isOn === true;

    res.json({
      products: products.map(product => {
        // Get the first blip if available
        const firstBlip = product.blips && product.blips.length > 0 ? product.blips[0] : null;

        // Add blip links to each blip in the array
        const blipsWithLinks = product.blips ? product.blips.map(blip => ({
          ...blip.toObject(),
          blipLink: `${baseUrl}/products/${product._id}/blips/${blip._id}`
        })) : [];

        return {
          ...product.toObject(),
          isLowStock: product.stock <= product.inventory.lowStockThreshold,
          hasDiscount: product.discount?.isActive || false,
          discountedPrice: product.discountedPrice,
          blips: blipsWithLinks,
          stock: product.stock,
          stats: {
            ...product.stats,
            soldCount: Math.max(0, product.stats?.soldCount || 0)
          },
          // Add product and blip links
          productLink: `${baseUrl}/products/${product._id}`,
          blipLink: firstBlip ? `${baseUrl}/products/${product._id}/blips/${firstBlip._id}` : null,
          // Add additional product information
          productInfo: {
            stock: product.stock,
            sku: product.inventory.sku,
            lowStockThreshold: product.inventory.lowStockThreshold,
            isOutOfStock: product.stock === 0,
            variantsInfo: product.variants?.map(variant => ({
              ...variant.toObject(),
              stock: variant.totalStock,
              isOutOfStock: variant.totalStock === 0,
              isLowStock: variant.totalStock <= product.inventory.lowStockThreshold
            })) || []
          }
        };
      }),
      totalPages: Math.ceil(totalProducts / limit),
      currentPage: parseInt(page),
      totalProducts,
      statistics: {
        totalProducts: totalSellerProducts,
        productsWithBlips,
        productsWithoutBlips,
        activeProducts,
        draftProducts,
        activeDraftProducts: activeProducts + draftProducts
      },
      filters: {
        minPrice,
        maxPrice,
        condition,
        status,
        visibility,
        sortBy
      },
      sellerVacationMode: isSellerOnVacation
    });

  } catch (error) {
    res.status(500).json({
      message: 'Failed to retrieve seller products',
      error: error.message
    });
  }
};

// Get seller's product reviews
exports.getSellerInfo = async (req, res) => {
  const { sellerId } = req.params;

  try {
    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    res.json({
      sellerInfo: {
        name: seller.name,
        businessName: seller.businessName,
        accountPending: seller.accountPending || false
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve seller information', error: error.message });
  }
};

// Inventory Management
exports.updateInventory = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { productId } = req.params;
    const { quantity, operation = 'set' } = req.body;

    console.log('Update Inventory Debug:', {
      productId,
      requestUserId: req.user.id,
      userRole: req.user.role,
      quantity,
      operation
    });

    if (!quantity || isNaN(parseInt(quantity))) {
      throw new Error('Valid quantity is required');
    }

    const product = await Product.findById(productId).session(session);
    console.log('Found Product:', {
      productId: product?._id,
      sellerId: product?.seller,
      sellerIdType: typeof product?.seller
    });

    if (!product) {
      throw new Error('Product not found');
    }

    // Verify seller ownership with detailed logging
    const productSellerId = product.seller._id || product.seller;
    console.log('Seller ID Comparison:', {
      productSellerId: productSellerId?.toString(),
      requestUserId: req.user.id?.toString(),
      isMatch: productSellerId?.toString() === req.user.id?.toString()
    });

    if (productSellerId?.toString() !== req.user.id?.toString()) {
      throw new Error('Not authorized to update this product');
    }

    // Update the stock
    await product.updateStock(parseInt(quantity), operation);

    // Check if low stock notification needed
    if (product.isLowStock()) {
      // Notify seller (if you have notification system)
      await NotificationController.createNotification({
        recipient: product.seller,
        type: 'low_stock',
        title: 'Low Stock Alert',
        message: `${product.name} is running low on stock (${product.stock} remaining)`,
        data: { productId: product._id }
      }).catch(err => console.error('Failed to send notification:', err));
    }

    await session.commitTransaction();

    res.json({
      message: 'Inventory updated successfully',
      product: {
        id: product._id,
        name: product.name,
        stock: product.stock,
        lowStockAlert: product.lowStockAlert,
        isLowStock: product.isLowStock()
      }
    });

  } catch (error) {
    console.error('Update Inventory Error:', error);
    await session.abortTransaction();
    res.status(400).json({
      message: 'Failed to update inventory',
      error: error.message
    });
  } finally {
    session.endSession();
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
    const { startDate, endDate, productId } = req.query;
    const query = { seller: req.user.id };

    if (productId) {
      query._id = productId;
    }

    const dateRange = {
      $gte: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      $lte: endDate ? new Date(endDate) : new Date()
    };

    const products = await Product.find(query);
    const productIds = products.map(p => p._id);

    const orders = await Order.find({
      'items.product': { $in: productIds },
      createdAt: dateRange
    });

    const analytics = products.map(product => {
      const productOrders = orders.filter(order =>
        order.items.some(item => item.product.toString() === product._id.toString())
      );

      const revenue = productOrders.reduce((sum, order) => {
        const item = order.items.find(item =>
          item.product.toString() === product._id.toString()
        );
        return sum + (item ? item.price * item.quantity : 0);
      }, 0);

      return {
        productId: product._id,
        name: product.name,
        totalViews: product.stats.views,
        totalSales: product.soldCount,
        revenue,
        averageRating: product.stats.averageRating,
        reviewCount: product.stats.reviewCount,
        conversionRate: product.stats.views ?
          ((product.soldCount / product.stats.views) * 100).toFixed(2) : 0
      };
    });

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
          Bucket: process.env.CDN_S3_BUCKET,
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
    const products = await Product.find({
      seller: req.user.id,
      $or: [
        { stock: { $lte: '$lowStockAlert' } },
        { 'variants.options.inventory': { $lte: '$lowStockAlert' } }
      ]
    });

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
    const buyerId = req.user.id;
    const { rating, title, comment, purchasedVariant } = req.body;

    // Validate required fields
    if (!rating || !title || !comment) {
      return res.status(400).json({
        message: 'Rating, title and comment are required'
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user has already reviewed
    // const existingReview = product.reviews.find(
    //   review => review.buyer.toString() === buyerId
    // );
    // if (existingReview) {
    //   return res.status(400).json({ 
    //     message: 'You have already reviewed this product' 
    //   });
    // }

    // Upload images to S3
    const reviewImages = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const params = {
          Bucket: process.env.CDN_S3_BUCKET,
          Key: `reviews/${uuidv4()}-${file.originalname}`,
          Body: file.buffer,
          ContentType: file.mimetype,
        };
        const uploadResult = await s3.upload(params).promise();
        reviewImages.push({
          url: `https://` + process.env.CDN_URL + `/${uploadResult.Key}`,
          contentType: file.mimetype
        });
      }
    }

    // Get buyer info
    const buyer = await Buyer.findById(buyerId)
      .select('firstName lastName');

    // Create review object
    const review = {
      buyer: buyerId,
      firstName: buyer.firstName,
      lastName: buyer.lastName,
      title,
      rating,
      comment,
      images: reviewImages,
      purchasedVariant: purchasedVariant ? JSON.parse(purchasedVariant) : undefined,
      createdAt: new Date()
    };

    // Add review and update product stats
    product.reviews.push(review);

    // Update product stats
    const allRatings = product.reviews.map(r => r.rating);
    product.stats.averageRating = allRatings.reduce((a, b) => a + b, 0) / allRatings.length;
    product.stats.reviewCount = product.reviews.length;

    await product.save();

    res.status(201).json({
      message: 'Review added successfully',
      review
    });
  } catch (error) {
    console.error('Error in addReview:', error);
    res.status(500).json({
      message: 'Failed to add review',
      error: error.message
    });
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

    // Sort reviews by date and include all fields
    const reviews = product.reviews
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(startIndex, endIndex)
      .map(review => ({
        ...review.toObject(),
        images: review.images || [],
        purchasedVariant: review.purchasedVariant || {}
      }));

    res.json({
      reviews,
      currentPage: page,
      totalPages: Math.ceil(product.reviews.length / limit),
      totalReviews: product.reviews.length
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to get product reviews',
      error: error.message
    });
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

// Update shipping information
exports.updateShipping = async (req, res) => {
  try {
    const { id } = req.params;
    const { shippingMethods, weight, dimensions } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.seller.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }

    product.shippingInfo = {
      ...product.shippingInfo,
      weight: weight || product.shippingInfo.weight,
      dimensions: dimensions || product.shippingInfo.dimensions,
      shippingMethods: shippingMethods || product.shippingInfo.shippingMethods
    };

    await product.save();
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update shipping info', error: error.message });
  }
};

// Update return policy
exports.updateReturnPolicy = async (req, res) => {
  try {
    const { id } = req.params;
    const { allowed, periodInDays, conditions } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.seller.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }

    product.returnPolicy = {
      allowed: allowed !== undefined ? allowed : product.returnPolicy.allowed,
      periodInDays: periodInDays || product.returnPolicy.periodInDays,
      conditions: conditions || product.returnPolicy.conditions
    };

    await product.save();
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update return policy', error: error.message });
  }
};

// Bulk update products
exports.bulkUpdateProducts = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { products } = req.body;
    const updatedProducts = [];

    for (const { id, updates } of products) {
      const product = await Product.findById(id).session(session);

      if (!product || product.seller.toString() !== req.user.id) {
        continue;
      }

      Object.assign(product, updates);
      await product.save({ session });
      updatedProducts.push(product);
    }

    await session.commitTransaction();
    res.json({ message: 'Products updated successfully', products: updatedProducts });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ message: 'Failed to update products', error: error.message });
  } finally {
    session.endSession();
  }
};

// Get product statistics
exports.getProductStats = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const stats = {
      views: product.stats.views,
      averageRating: product.stats.averageRating,
      reviewCount: product.stats.reviewCount,
      soldCount: product.soldCount,
      lastRestocked: product.stats.lastRestocked,
      currentStock: product.stock,
      isLowStock: product.isLowStock()
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get product stats', error: error.message });
  }
};

// Get product's sold count
exports.getProductSoldCount = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id).select('stats.soldCount');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ soldCount: product.stats.soldCount });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to get product sold count',
      error: error.message
    });
  }
};


function reorderToAvoidSellerClusters(products, maxConsecutive = 1) {
  if (!products.length) return [];

  // Group products by seller
  const productsBySeller = {};
  products.forEach(product => {
    const sellerId = product.seller._id.toString();
    if (!productsBySeller[sellerId]) {
      productsBySeller[sellerId] = [];
    }
    productsBySeller[sellerId].push(product);
  });

  const sellerIds = Object.keys(productsBySeller);
  if (sellerIds.length <= 1) return products;

  const result = [];
  let lastUsedSellerIndices = [];

  // Keep selecting products until we've used them all or reached the limit
  while (result.length < products.length && sellerIds.some(id => productsBySeller[id].length > 0)) {
    // Find sellers that still have products and weren't recently used
    const availableSellers = sellerIds.filter((id, index) =>
      productsBySeller[id].length > 0 && !lastUsedSellerIndices.includes(index)
    );

    // If no available sellers that weren't recently used, reset the tracking
    if (availableSellers.length === 0) {
      lastUsedSellerIndices = [];
      continue;
    }

    // Pick a random available seller
    const randomIndex = Math.floor(Math.random() * availableSellers.length);
    const selectedSellerId = availableSellers[randomIndex];
    const sellerIndex = sellerIds.indexOf(selectedSellerId);

    // Add the seller to recently used (keep track of last N sellers)
    lastUsedSellerIndices.push(sellerIndex);
    if (lastUsedSellerIndices.length > sellerIds.length / 2) {
      lastUsedSellerIndices.shift();
    }

    // Take a product from this seller
    const product = productsBySeller[selectedSellerId].shift();
    result.push(product);
  }

  return result;
}

// Ensure we have a good mix of preferred and non-preferred products
// by interspersing them if possible
function mixPreferredAndGeneral(products) {
  if (products.length <= 1) return products;

  const preferred = products.filter(p => p.isPreferred);
  const general = products.filter(p => !p.isPreferred);

  // If we don't have both types, just return the original array
  if (preferred.length === 0 || general.length === 0) return products;

  const result = [];
  let preferredIndex = 0;
  let generalIndex = 0;

  // Start with preferred if available
  let usePreferred = true;

  while (preferredIndex < preferred.length || generalIndex < general.length) {
    if (usePreferred && preferredIndex < preferred.length) {
      result.push(preferred[preferredIndex++]);
    } else if (generalIndex < general.length) {
      result.push(general[generalIndex++]);
    } else if (preferredIndex < preferred.length) {
      // If we've exhausted general products, add remaining preferred
      result.push(preferred[preferredIndex++]);
    }

    // Toggle between preferred and general
    usePreferred = !usePreferred;
  }

  return result;
}

/**
 * Fisher-Yates shuffle algorithm to randomize array elements
 * @param {Array} array The array to shuffle
 * @returns {Array} The shuffled array
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}





// Helper function to get general products without personalization
async function getGeneralProducts(req, res) {
  try {
    const { page = 1, limit = 20 } = req.query;

    // Build base query for active and visible products
    const baseQuery = {
      status: { $nin: ['offline_auction', 'draft'] },
      visibility: 'visible',
      stock: { $gt: 0 }
    };

    // Get total count of all available products
    const totalProducts = await Product.countDocuments(baseQuery);

    // Calculate how many products to skip for random sampling
    // Using a random skip value to ensure different products each time
    const maxSkip = Math.max(0, totalProducts - parseInt(limit));
    const randomSkip = Math.floor(Math.random() * (maxSkip + 1));

    // Get a random sample of products
    let products = await Product.find(baseQuery)
      .skip(randomSkip)
      .limit(parseInt(limit))
      .populate('seller', sellerPopulationFields)
      .populate('reviews.buyer', 'firstName lastName');

    // If we didn't get enough products (edge case), get the remaining from the beginning
    if (products.length < parseInt(limit) && randomSkip > 0) {
      const remainingLimit = parseInt(limit) - products.length;
      const remainingProducts = await Product.find(baseQuery)
        .limit(remainingLimit)
        .populate('seller', sellerPopulationFields)
        .populate('reviews.buyer', 'firstName lastName');

      products = [...products, ...remainingProducts];
    }

    // Shuffle the products for extra randomization
    products = shuffleArray(products);

    // Apply the reordering algorithm to avoid seller clusters
    products = reorderToAvoidSellerClusters(products);

    // Add review stats data to each product
    const productsWithStats = products.map(product => {
      const productObj = product.toObject();
      return {
        ...productObj,
        averageRating: productObj.stats?.averageRating || null,
        reviewCount: productObj.stats?.totalReviews || 0
      };
    });

    res.json({
      products: productsWithStats,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalProducts / limit),
      totalProducts,
      hasMore: page * limit < totalProducts,
      isPersonalized: false
    });
  } catch (error) {
    console.error('Error retrieving general products:', error);
    res.status(500).json({
      message: 'Failed to retrieve products',
      error: error.message
    });
  }
}

exports.getPersonalizedProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    // Check if user is authenticated
    if (!req.user) {
      // If not authenticated, return general products instead of personalized
      return await getGeneralProducts(req, res);
    }

    const buyerId = req.user.id;
    console.log('Buyer ID:', buyerId);
    if (!mongoose.Types.ObjectId.isValid(buyerId)) {
      return res.status(400).json({ message: 'Invalid buyer ID format' });
    }
    const buyer = await Buyer.findById(buyerId);
    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }

    // Build base query for active and visible products
    const baseQuery = {
      status: { $nin: ['offline_auction', 'draft'] },
      visibility: 'visible',
      stock: { $gt: 0 }
    };

    // Get total count of all available products
    const totalProducts = await Product.countDocuments(baseQuery);

    // Calculate how many products to skip for random sampling
    // Using a random skip value to ensure different products each time
    const maxSkip = Math.max(0, totalProducts - parseInt(limit));
    const randomSkip = Math.floor(Math.random() * (maxSkip + 1));

    // Get a random sample of products
    let products = await Product.find(baseQuery)
      .skip(randomSkip)
      .limit(parseInt(limit))
      .populate('seller', sellerPopulationFields)
      .populate('reviews.buyer', 'firstName lastName');

    // If we didn't get enough products (edge case), get the remaining from the beginning
    if (products.length < parseInt(limit) && randomSkip > 0) {
      const remainingLimit = parseInt(limit) - products.length;
      const remainingProducts = await Product.find(baseQuery)
        .limit(remainingLimit)
        .populate('seller', sellerPopulationFields)
        .populate('reviews.buyer', 'firstName lastName');

      products = [...products, ...remainingProducts];
    }

    // Shuffle the products for extra randomization
    products = shuffleArray(products);

    // Apply the reordering algorithm to avoid seller clusters
    products = reorderToAvoidSellerClusters(products);

    // Add review stats data to each product
    const productsWithStats = products.map(product => {
      const productObj = product.toObject();
      return {
        ...productObj,
        averageRating: productObj.stats?.averageRating || null,
        reviewCount: productObj.stats?.totalReviews || 0
      };
    });

    res.json({
      products: productsWithStats,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalProducts / limit),
      totalProducts,
      hasMore: page * limit < totalProducts,
      isPersonalized: true
    });
  } catch (error) {
    console.error('Error retrieving personalized products:', error);
    res.status(500).json({
      message: 'Failed to retrieve personalized products',
      error: error.message
    });
  }
};


// Add a new controller method for updating product discount
exports.updateProductDiscount = async (req, res) => {
  const { id } = req.params;
  const { isActive, type, value, startDate, endDate } = req.body;

  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Update discount fields
    product.discount = {
      isActive: isActive ?? product.discount.isActive,
      type: type ?? product.discount.type,
      value: value ?? product.discount.value,
      startDate: startDate ? new Date(startDate) : product.discount.startDate,
      endDate: endDate ? new Date(endDate) : product.discount.endDate
    };

    const updatedProduct = await product.save();
    const populatedProduct = await Product.findById(updatedProduct._id)
      .populate('seller', 'name avatarUrl about');

    res.json(populatedProduct);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to update product discount',
      error: error.message
    });
  }
};

// Get single product by ID
exports.getProductById = async (req, res) => {
  try {
    console.log('Fetching product with ID:', req.params.id);

    const product = await Product.findById(req.params.id)
      .populate({
        path: 'seller',
        select: `
          firstName lastName email phoneNumber businessName 
          businessType businessEmail businessNumber businessAddress 
          storeName aboutStore storeAvatar storeBanner 
          shippingOptions warehouseDetails categories followers
          bankDetails.accountName bankDetails.bankName
          stats.totalProducts stats.totalOrders stats.totalRevenue
          stats.averageRating stats.reviewCount
        `
      });

    console.log('Raw product after populate:', JSON.stringify(product, null, 2));
    console.log('Seller data:', JSON.stringify(product.seller, null, 2));

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if seller is populated
    if (!product.seller || typeof product.seller === 'string') {
      console.error('Seller not properly populated:', product.seller);
      return res.status(500).json({
        message: 'Failed to load seller details',
        sellerId: product.seller
      });
    }

    // Format seller information for better organization
    const formattedProduct = {
      ...product.toObject(),
      seller: {
        id: product.seller._id,
        personalInfo: {
          firstName: product.seller.firstName,
          lastName: product.seller.lastName,
          email: product.seller.email,
          phoneNumber: product.seller.phoneNumber
        },
        businessInfo: {
          businessName: product.seller.businessName,
          businessType: product.seller.businessType,
          businessEmail: product.seller.businessEmail,
          businessNumber: product.seller.businessNumber,
          businessAddress: product.seller.businessAddress
        },
        storeInfo: {
          storeName: product.seller.storeName,
          aboutStore: product.seller.aboutStore,
          storeAvatar: product.seller.storeAvatar,
          storeBanner: product.seller.storeBanner,
          categories: product.seller.categories,
          followerCount: product.seller.followers?.length || 0
        },
        shippingInfo: {
          shippingOptions: product.seller.shippingOptions,
          warehouseDetails: product.seller.warehouseDetails
        },
        stats: {
          totalProducts: product.seller.stats?.totalProducts || 0,
          totalOrders: product.seller.stats?.totalOrders || 0,
          totalRevenue: product.seller.stats?.totalRevenue || 0,
          averageRating: product.seller.stats?.averageRating || 0,
          reviewCount: product.seller.stats?.reviewCount || 0
        },
        bankInfo: {
          bankName: product.seller.bankDetails?.bankName,
          accountName: product.seller.bankDetails?.accountName
        }
      }
    };

    console.log('Formatted product:', JSON.stringify(formattedProduct, null, 2));

    res.json(formattedProduct);
  } catch (error) {
    console.error('Error in getProductById:', error);
    res.status(500).json({
      message: 'Failed to retrieve product',
      error: error.message
    });
  }
};


/**
 * Get products by seller and category
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - JSON response with products
 */
exports.getProductsBySellerAndCategory = async (req, res) => {
  try {
    const { sellerId, category } = req.params;

    // Validate sellerId
    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({ success: false, message: 'Invalid seller ID format' });
    }

    // Find products that match both seller and category (case insensitive)
    const products = await Product.find({
      seller: sellerId,
      category: { $regex: new RegExp(`^${category}$`, 'i') }
    }).sort({ createdAt: -1 });
    // Check if seller exists
    const seller = await mongoose.model('Seller').findById(sellerId);
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller not found' });
    }

    return res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Error fetching seller products by category:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get all categories where a seller has products
exports.getSellerProductCategories = async (req, res) => {
  try {
    const { sellerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({ message: 'Invalid seller ID format' });
    }

    // Find all products by this seller
    const products = await Product.find({ seller: sellerId });

    if (!products || products.length === 0) {
      return res.status(404).json({ message: 'No products found for this seller' });
    }

    // Extract unique categories from the products
    const categories = [...new Set(products.map(product => product.category))];

    // Get full category details from the Category model
    const categoryDetails = await Category.find({ name: { $in: categories } });

    return res.status(200).json({
      success: true,
      count: categoryDetails.length,
      data: categoryDetails
    });
  } catch (error) {
    console.error('Error fetching seller product categories:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};



// Add auction bid controller functions
exports.placeBid = async (req, res) => {
  try {
    const { productId } = req.params;
    const { amount } = req.body;
    const buyerId = req.user.id;

    console.log('Debug - Incoming bid request:', {
      productId,
      amount,
      buyerId
    });

    // Validate bid amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid bid amount' });
    }

    // Get product information first
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.status !== 'offline_auction') {
      return res.status(400).json({ message: 'This product is not an auction item' });
    }

    // Check if auction has started
    const now = new Date();
    if (now < product.auction.startDate) {
      return res.status(400).json({ message: 'Auction has not started yet' });
    }

    // Check if auction has ended
    if (now > product.auction.endDate) {
      return res.status(400).json({ message: 'Auction has ended' });
    }

    // Check minimum bid
    if (amount < product.auction.minBid) {
      return res.status(400).json({
        message: `Bid amount must be at least ${product.auction.minBid}`
      });
    }

    // Check if bid is higher than current highest bid
    if (product.auction.currentHighestBid &&
      product.auction.currentHighestBid.amount &&
      amount <= product.auction.currentHighestBid.amount) {
      return res.status(400).json({
        message: `Bid amount must be higher than current highest bid of ${product.auction.currentHighestBid.amount}`
      });
    }

    // Get buyer and check wallet balance before allowing bid
    const Buyer = mongoose.model('Buyer');
    const buyer = await Buyer.findById(buyerId);

    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }

    // Calculate shipping fee for the check
    const shippingFee = 1000; // Default shipping fee
    const totalRequired = amount + shippingFee;

    // Check if buyer has enough balance including what's already on hold
    // Ensure we handle cases where wallet might not be fully initialized
    const walletBalance = buyer.wallet && typeof buyer.wallet.balance === 'number' ? buyer.wallet.balance : 0;
    const onHoldAmount = buyer.wallet && typeof buyer.wallet.onHoldAmount === 'number' ? buyer.wallet.onHoldAmount : 0;
    const buyerAvailableBalance = walletBalance - onHoldAmount;

    if (buyerAvailableBalance < totalRequired) {
      return res.status(400).json({
        message: `Insufficient funds. You need ₦${totalRequired.toLocaleString()} in your wallet to place this bid. You have ₦${buyerAvailableBalance.toLocaleString()} available.`
      });
    }

    // Convert buyerId to ObjectId properly
    const buyerObjectId = new mongoose.Types.ObjectId(buyerId);

    // Check if buyer already has an active bid on this auction
    const existingActiveBid = product.auction.bids && product.auction.bids.find(
      bid => bid.buyer && bid.buyer.toString() === buyerObjectId.toString() && bid.status === 'active'
    );

    // Step 1: Process the buyer's own wallet hold first
    // If buyer already has a bid, release the hold on that amount
    if (existingActiveBid) {
      const existingHoldIndex = buyer.wallet.onHoldItems && buyer.wallet.onHoldItems.findIndex(
        item => item.productId && item.productId.toString() === productId
      );

      if (existingHoldIndex !== -1) {
        const oldHoldAmount = buyer.wallet.onHoldItems[existingHoldIndex].amount;
        // Ensure onHoldAmount never goes below zero
        buyer.wallet.onHoldAmount = Math.max(0, buyer.wallet.onHoldAmount - oldHoldAmount);
        buyer.wallet.onHoldItems.splice(existingHoldIndex, 1);

        // Save buyer immediately after releasing the hold
        await buyer.save();
        console.log(`Released previous hold of ₦${oldHoldAmount} for buyer ${buyerId} on product ${productId}`);
      }
    }

    // Step 2: Handle previous highest bidder if it's a different buyer
    let previousBuyerId = null;

    if (product.auction.currentHighestBid &&
      product.auction.currentHighestBid.buyer &&
      product.auction.currentHighestBid.buyer.toString() !== buyerObjectId.toString()) {

      previousBuyerId = product.auction.currentHighestBid.buyer;

      // Get the previous bidder
      const previousBidder = await Buyer.findById(previousBuyerId);

      if (previousBidder) {
        // Find and remove the hold
        const prevHoldIndex = previousBidder.wallet.onHoldItems.findIndex(
          item => item.productId && item.productId.toString() === productId
        );

        if (prevHoldIndex !== -1) {
          const prevHoldAmount = previousBidder.wallet.onHoldItems[prevHoldIndex].amount;
          // Ensure onHoldAmount never goes below zero
          previousBidder.wallet.onHoldAmount = Math.max(0, previousBidder.wallet.onHoldAmount - prevHoldAmount);
          previousBidder.wallet.onHoldItems.splice(prevHoldIndex, 1);

          // Save previous bidder immediately
          await previousBidder.save();
          console.log(`Released hold of ₦${prevHoldAmount} for previous bidder ${previousBuyerId} on product ${productId}`);
        }
      }
    }

    // Step 3: Update product with new bid information
    // Mark previous highest bid as outbid
    product.auction.bids.forEach(bid => {
      if (bid.status === 'active' && bid.buyer) {
        bid.status = 'outbid';
      }
    });

    // Add new bid
    const newBid = {
      buyer: buyerObjectId,
      amount: amount,
      status: 'active',
      createdAt: new Date()
    };

    // Add the bid to the array first
    product.auction.bids.push(newBid);

    // Update current highest bid
    product.auction.currentHighestBid = {
      amount: amount,
      buyer: buyerObjectId
    };

    // Track if this is the winning bid
    let isWinningBid = false;

    console.log('Debug - Before max bid check:', {
      endOnMaxBid: product.auction.endOnMaxBid,
      maxBid: product.auction.maxBid,
      bidAmount: amount,
      currentStatus: product.auction.status
    });

    // Check if auction should end (max bid reached and endOnMaxBid is true)
    if (product.auction.endOnMaxBid && amount >= product.auction.maxBid) {
      console.log('Debug - Max bid condition met:', {
        bidAmount: amount,
        maxBid: product.auction.maxBid
      });

      // Update the status and set winner
      product.auction.status = 'ended';
      product.auction.winner = {
        buyer: buyerObjectId,
        bidAmount: amount,
        winningDate: new Date()
      };
      isWinningBid = true;

      // Update all bids statuses including the new bid
      product.auction.bids = product.auction.bids.map(bid => {
        if (!bid.buyer) return bid; // Skip if no buyer
        return {
          ...bid,
          status: bid.buyer.toString() === buyerObjectId.toString() ? 'won' : 'lost'
        };
      });

      console.log('Debug - After setting auction end:', {
        newStatus: product.auction.status,
        winningBid: amount,
        winner: buyerObjectId.toString(),
        totalBids: product.auction.bids.length
      });
    }

    console.log('Debug - Final state before save:', {
      status: product.auction.status,
      currentHighestBid: amount,
      isWinningBid,
      totalBids: product.auction.bids.length
    });

    try {
      // Save all changes in one operation
      await product.save();

      // Double check the save worked
      const verifyProduct = await Product.findById(productId);
      console.log('Debug - Verification after save:', {
        status: verifyProduct.auction.status,
        currentHighestBid: verifyProduct.auction.currentHighestBid?.amount,
        isEnded: verifyProduct.auction.status === 'ended',
        totalBids: verifyProduct.auction.bids.length
      });

      // If this was a winning bid, schedule the order creation
      if (isWinningBid) {
        try {
          const agenda = require('../config/agenda').agenda;
          await agenda.now('create-auction-winner-order', { productId: product._id });
          console.log('Scheduled auction winner order creation for max bid:', product._id);
        } catch (scheduleError) {
          console.error('Failed to schedule auction winner order creation:', {
            productId: product._id,
            error: scheduleError.message
          });
        }
      }
    } catch (error) {
      console.error('Failed to save product or verify save:', error);
      throw error;
    }

    // Step 4: Update buyer's wallet with new hold (or direct payment if auction ended)
    if (isWinningBid) {
      // If auction ended with this bid, no need to put a hold, just prepare for order creation
      console.log(`Auction ended with winning bid of ₦${amount} from buyer ${buyerId}`);

      // Schedule order creation after everything else is done
      try {
        setTimeout(async () => {
          try {
            const agenda = require('../config/agenda').agenda;
            await agenda.now('create-auction-winner-order', { productId: product._id });
            console.log('Scheduled auction winner order creation for max bid:', product._id);
          } catch (scheduleError) {
            console.error('Failed to schedule auction winner order creation:', {
              productId: product._id,
              error: scheduleError.message
            });
          }
        }, 500);
      } catch (error) {
        console.error('Error setting up order creation timeout:', error);
      }
    } else {
      // Add hold on buyer's wallet for the bid amount + shipping
      buyer.wallet.onHoldItems.push({
        productId: product._id,
        productName: product.name,
        productImage: product.images && product.images.length > 0 ?
          product.images[0].url : null,
        amount: totalRequired,
        bidDate: new Date(),
        auctionStatus: product.auction.status,
        auctionEndDate: product.auction.endDate
      });

      // Update total hold amount
      buyer.wallet.onHoldAmount += totalRequired;

      // Save buyer with new hold
      await buyer.save();
      console.log(`Added hold of ₦${totalRequired} for buyer ${buyerId} on product ${productId}`);
    }

    // Step 5: Get buyer details for the response
    const buyerDetails = await Buyer.findById(buyerId).select('firstName lastName profileImage');

    // Step 6: Prepare bid notification data for WebSocket
    const bidData = {
      productId: product._id,
      bid: {
        _id: product.auction.bids[product.auction.bids.length - 1]._id,
        amount: amount,
        status: 'active',
        createdAt: new Date(),
        buyer: {
          _id: buyerDetails._id,
          firstName: buyerDetails.firstName,
          lastName: buyerDetails.lastName,
          profileImage: buyerDetails.profileImage
        }
      },
      currentHighestBid: {
        amount: amount,
        buyer: {
          _id: buyerDetails._id,
          firstName: buyerDetails.firstName,
          lastName: buyerDetails.lastName,
          profileImage: buyerDetails.profileImage
        }
      },
      bidsCount: product.auction.bids.length,
      auctionStatus: product.auction.status,
      auctionEnded: isWinningBid,
      winner: isWinningBid ? {
        buyer: {
          _id: buyerDetails._id,
          firstName: buyerDetails.firstName,
          lastName: buyerDetails.lastName,
          profileImage: buyerDetails.profileImage
        },
        bidAmount: amount,
        winningDate: new Date()
      } : null
    };

    // Step 7: Emit bid update to all users in the auction room via WebSocket
    if (req.app.get('io')) {
      req.app.get('io').to(`auction_${productId}`).emit('bid_update', bidData);

      // If auction ended, emit additional event
      if (isWinningBid) {
        req.app.get('io').to(`auction_${productId}`).emit('auction_ended', {
          productId: product._id,
          winner: {
            buyer: {
              _id: buyerDetails._id,
              firstName: buyerDetails.firstName,
              lastName: buyerDetails.lastName,
              profileImage: buyerDetails.profileImage
            },
            bidAmount: amount,
            winningDate: new Date()
          }
        });
      }
    }

    // Step 8: Return success response
    res.status(200).json({
      message: 'Bid placed successfully',
      bid: {
        amount: amount,
        buyer: buyerId,
        auctionEnded: isWinningBid
      }
    });
  } catch (error) {
    console.error('Error in placeBid:', error);
    res.status(500).json({
      message: 'Error placing bid',
      error: error.message
    });
  }
};

exports.getAuctionBids = async (req, res) => {
  try {
    const { productId } = req.params;

    // First check if the auction should be ended
    const now = new Date();
    await Product.updateMany(
      {
        _id: productId,
        status: 'offline_auction',
        'auction.status': 'ongoing',
        'auction.endDate': { $lt: now }
      },
      {
        $set: {
          'auction.status': 'ended',
          'auction.daysLeft': 0
        }
      }
    );

    const product = await Product.findById(productId)
      .populate({
        path: 'auction.bids.buyer',
        select: 'firstName lastName email profileImage'
      })
      .populate({
        path: 'auction.currentHighestBid.buyer',
        select: 'firstName lastName email profileImage'
      })
      .populate({
        path: 'auction.winner.buyer',
        select: 'firstName lastName email profileImage'
      });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Calculate days left
    let daysLeft = 0;
    if (product.auction.status === 'scheduled') {
      daysLeft = Math.ceil((product.auction.startDate - now) / (1000 * 60 * 60 * 24));
    } else if (product.auction.status === 'ongoing') {
      daysLeft = Math.ceil((product.auction.endDate - now) / (1000 * 60 * 60 * 24));

      // Double-check if this auction should be ended (defensive check)
      if (product.auction.endDate < now) {
        await product.endAuction();
        product.auction.status = 'ended';
        daysLeft = 0;
      }
    }

    // Format the response
    const formattedBids = product.auction.bids.map(bid => ({
      _id: bid._id,
      buyer: {
        _id: bid.buyer._id,
        firstName: bid.buyer.firstName,
        lastName: bid.buyer.lastName,
        profileImage: bid.buyer.profileImage
      },
      amount: bid.amount,
      status: bid.status,
      createdAt: bid.createdAt
    }));

    const response = {
      bids: formattedBids,
      currentHighestBid: product.auction.currentHighestBid ? {
        amount: product.auction.currentHighestBid.amount,
        buyer: {
          _id: product.auction.currentHighestBid.buyer._id,
          firstName: product.auction.currentHighestBid.buyer.firstName,
          lastName: product.auction.currentHighestBid.buyer.lastName,
          profileImage: product.auction.currentHighestBid.buyer.profileImage
        }
      } : null,
      winner: product.auction.winner ? {
        buyer: {
          _id: product.auction.winner.buyer._id,
          firstName: product.auction.winner.buyer.firstName,
          lastName: product.auction.winner.buyer.lastName,
          profileImage: product.auction.winner.buyer.profileImage
        },
        bidAmount: product.auction.winner.bidAmount,
        winningDate: product.auction.winner.winningDate
      } : null,
      status: product.auction.status,
      daysLeft
    };

    res.json(response);

  } catch (error) {
    console.error('Error in getAuctionBids:', error);
    res.status(500).json({
      message: 'Error retrieving auction bids',
      error: error.message
    });
  }
};

exports.getBuyerBids = async (req, res) => {
  try {
    const buyerId = req.user._id;

    // First, update any auctions that should be ended
    const now = new Date();
    await Product.updateMany(
      {
        status: 'offline_auction',
        'auction.status': 'ongoing',
        'auction.endDate': { $lt: now }
      },
      {
        $set: {
          'auction.status': 'ended',
          'auction.daysLeft': 0
        }
      }
    );

    const products = await Product.find({
      status: 'offline_auction',
      'auction.bids.buyer': buyerId
    })
      .populate('seller', 'businessName storeName')
      .select('name auction.bids auction.currentHighestBid auction.winner auction.status auction.daysLeft auction.endDate images');

    const bids = products.map(product => {
      const buyerBids = product.auction.bids.filter(
        bid => bid.buyer.toString() === buyerId.toString()
      );

      // Double-check if this auction should be ended (defensive check)
      let auctionStatus = product.auction.status;
      let daysLeft = product.auction.daysLeft;

      if (auctionStatus === 'ongoing' && product.auction.endDate < now) {
        auctionStatus = 'ended';
        daysLeft = 0;
      } else if (auctionStatus === 'ongoing') {
        daysLeft = Math.ceil((product.auction.endDate - now) / (1000 * 60 * 60 * 24));
      }

      return {
        productId: product._id,
        productName: product.name,
        productImage: product.images[0],
        seller: product.seller,
        bids: buyerBids,
        isHighestBidder: product.auction.currentHighestBid.buyer?.toString() === buyerId.toString(),
        isWinner: product.auction.winner?.buyer?.toString() === buyerId.toString(),
        auctionStatus: auctionStatus,
        daysLeft: daysLeft
      };
    });

    res.status(200).json(bids);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching buyer bids', error: error.message });
  }
};

// Add this to the existing agenda.define section in config/agenda.js
agenda.define('end-auction', async (job) => {
  try {
    const { productId } = job.attrs.data;
    console.log(`Starting end-auction job for product: ${productId}`);

    const Product = mongoose.model('Product');
    const Buyer = mongoose.model('Buyer');
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const product = await Product.findById(productId)
      .populate('seller', 'email firstName businessName')
      .populate('auction.currentHighestBid.buyer', 'email firstName lastName')
      .populate('auction.bids.buyer', '_id');

    if (!product) {
      console.log('Product not found for end-auction job:', productId);
      return;
    }

    console.log(`Found product for end-auction job: ${productId}`, {
      productName: product.name,
      auctionStatus: product.auction.status,
      hasCurrentHighestBid: !!product.auction.currentHighestBid?.buyer,
      hasWinner: !!product.auction.winner?.buyer
    });

    let winner;

    // Only call endAuction if the auction is still ongoing
    if (product.auction.status === 'ongoing') {
      console.log(`Ending ongoing auction for product: ${productId}`);
      winner = await product.endAuction();
      console.log(`Auction ended, winner set:`, winner ? 'Yes' : 'No');
    } else if (product.auction.status === 'ended') {
      // If auction already ended, just get the winner information
      winner = product.auction.winner;
      console.log('Auction already ended, winner info:', winner ? 'Has winner' : 'No winner');
    } else {
      console.log('Auction not in a valid state for ending:', product.auction.status);
      return;
    }

    // Get unique bidder IDs (excluding the winner)
    const bidderIds = product.auction.bids
      .filter(bid => !winner || bid.buyer._id.toString() !== winner.buyer.toString())
      .map(bid => bid.buyer._id.toString());

    // Remove duplicates
    const uniqueBidderIds = [...new Set(bidderIds)];
    console.log(`Found ${uniqueBidderIds.length} non-winning bidders to release holds for`);

    // Release holds for all non-winning bidders
    for (const bidderId of uniqueBidderIds) {
      try {
        const bidder = await Buyer.findById(bidderId);
        if (bidder) {
          // Find and remove the hold for this product
          const holdIndex = bidder.wallet.onHoldItems.findIndex(
            item => item.productId.toString() === productId
          );

          if (holdIndex !== -1) {
            const holdAmount = bidder.wallet.onHoldItems[holdIndex].amount;
            // Ensure onHoldAmount never goes below zero
            bidder.wallet.onHoldAmount = Math.max(0, bidder.wallet.onHoldAmount - holdAmount);
            bidder.wallet.onHoldItems.splice(holdIndex, 1);
            await bidder.save();

            console.log(`Released hold of ₦${holdAmount} for bidder ${bidderId} on product ${productId}`);
          }
        }
      } catch (error) {
        console.error(`Error releasing hold for bidder ${bidderId}:`, error);
        // Continue with other bidders despite error
      }
    }

    if (winner) {
      console.log(`Preparing to send emails and create order for auction winner: ${productId}`);

      // Send winner notification
      const winnerEmail = {
        to: product.auction.currentHighestBid.buyer.email,
        from: 'Auqli Auctions <support@auqli.com>',
        subject: 'Congratulations! You Won the Auction - Auqli',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Congratulations! You Won!</h2>
            <p>Dear ${product.auction.currentHighestBid.buyer.firstName},</p>
            <p>You have won the auction for "${product.name}" with a bid of $${winner.bidAmount}!</p>
            <p>The seller will contact you shortly with payment details.</p>
           
            <p>Best regards,<br>The Auqli Team</p>
          </div>
        `
      };

      // Send seller notification
      const sellerEmail = {
        to: product.seller.email,
        from: 'Auqli Auctions <support@auqli.com>',
        subject: 'Your Auction Has Ended - Auqli',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Auction Ended Successfully</h2>
            <p>Dear ${product.seller.firstName},</p>
            <p>Your auction for "${product.name}" has ended.</p>
            <p>Winning bid: $${winner.bidAmount}</p>
            <p>Winner: ${product.auction.currentHighestBid.buyer.firstName} ${product.auction.currentHighestBid.buyer.lastName}</p>
            <p>An order will be automatically created for this auction win.</p>
            <p>Please contact the buyer to arrange payment and delivery.</p>
           
            <p>Best regards,<br>The Auqli Team</p>
          </div>
        `
      };

      try {
        console.log(`Sending winner and seller emails for auction: ${productId}`);
        await Promise.all([
          sgMail.send(winnerEmail),
          sgMail.send(sellerEmail)
        ]);
        console.log(`Emails sent successfully for auction: ${productId}`);
      } catch (emailError) {
        console.error(`Error sending auction emails: ${emailError.message}`, emailError);
      }

      // Check if an order already exists for this auction
      try {
        const Order = mongoose.model('Order');
        const existingOrder = await Order.findOne({
          channel: 'auction',
          'items.product': productId
        });

        if (existingOrder) {
          console.log('Order already exists for auction product:', {
            productId,
            orderId: existingOrder._id,
            orderStatus: existingOrder.items[0].status
          });
        } else {
          // Schedule order creation (do this after the emails to ensure the order doesn't exist yet when sending emails)
          console.log(`Scheduling create-auction-winner-order job for product: ${productId}`);

          // Check if agenda is properly initialized
          if (!job.agenda) {
            console.error('Agenda instance is not available in job object');
            return;
          }

          await job.agenda.now('create-auction-winner-order', { productId: product._id });
          console.log('Successfully scheduled auction winner order creation after auction end:', product._id);
        }
      } catch (orderError) {
        console.error(`Error checking for existing order or scheduling order creation: ${orderError.message}`, orderError);
      }
    } else {
      console.log(`No winner to process for auction: ${productId}`);
    }

  } catch (error) {
    console.error('Error in end-auction job:', error);
  }
});

// Get all auction products
exports.getAuctionProducts = async (req, res) => {
  try {
    const { status, sort = 'endDate', page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = { status: 'offline_auction' };
    if (status) {
      query['auction.status'] = status;
    }

    // Build sort object
    let sortObj = {};
    switch (sort) {
      case 'endDate':
        sortObj = { 'auction.endDate': 1 };
        break;
      case 'startDate':
        sortObj = { 'auction.startDate': 1 };
        break;
      case 'currentBid':
        sortObj = { 'auction.currentHighestBid.amount': -1 };
        break;
      default:
        sortObj = { 'auction.endDate': 1 };
    }

    // First, update any auctions that should be ended
    const now = new Date();
    await Product.updateMany(
      {
        status: 'offline_auction',
        'auction.status': 'ongoing',
        'auction.endDate': { $lt: now }
      },
      {
        $set: {
          'auction.status': 'ended',
          'auction.daysLeft': 0
        }
      }
    );

    // Execute query with pagination
    const [products, totalProducts] = await Promise.all([
      Product.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('seller', 'businessName storeName storeAvatar storeBanner stats firstName lastName email phoneNumber isVerified createdAt aboutStore')
        .populate({
          path: 'auction.bids.buyer',
          select: 'firstName lastName country profileImage -_id'
        })
        .populate({
          path: 'auction.currentHighestBid.buyer',
          select: 'firstName lastName country profileImage -_id'
        })
        .populate({
          path: 'auction.winner.buyer',
          select: 'firstName lastName country profileImage -_id'
        })
        .select('name description images auction seller'),
      Product.countDocuments(query)
    ]);

    // Calculate total pages
    const totalPages = Math.ceil(totalProducts / limit);

    // Update days left and clean up buyer data
    const cleanedProducts = products.map(product => {
      const cleanedProduct = product.toObject();

      // Calculate days left
      if (cleanedProduct.auction.status === 'scheduled') {
        cleanedProduct.auction.daysLeft = Math.ceil((cleanedProduct.auction.startDate - now) / (1000 * 60 * 60 * 24));
      } else if (cleanedProduct.auction.status === 'ongoing') {
        cleanedProduct.auction.daysLeft = Math.ceil((cleanedProduct.auction.endDate - now) / (1000 * 60 * 60 * 24));
        // Double-check if this auction should be ended (defensive check)
        if (cleanedProduct.auction.endDate < now) {
          cleanedProduct.auction.status = 'ended';
          cleanedProduct.auction.daysLeft = 0;
        }
      } else {
        cleanedProduct.auction.daysLeft = 0;
      }

      // Clean up bids
      if (cleanedProduct.auction.bids) {
        cleanedProduct.auction.bids = cleanedProduct.auction.bids.map(bid => ({
          _id: bid._id,
          amount: bid.amount,
          status: bid.status,
          createdAt: bid.createdAt,
          buyer: bid.buyer ? {
            firstName: bid.buyer.firstName,
            lastName: bid.buyer.lastName,
            country: bid.buyer.country,
            profileImage: bid.buyer.profileImage
          } : null
        }));
      }

      // Clean up current highest bid
      if (cleanedProduct.auction.currentHighestBid && cleanedProduct.auction.currentHighestBid.buyer) {
        cleanedProduct.auction.currentHighestBid = {
          amount: cleanedProduct.auction.currentHighestBid.amount,
          buyer: {
            firstName: cleanedProduct.auction.currentHighestBid.buyer.firstName,
            lastName: cleanedProduct.auction.currentHighestBid.buyer.lastName,
            country: cleanedProduct.auction.currentHighestBid.buyer.country,
            profileImage: cleanedProduct.auction.currentHighestBid.buyer.profileImage
          }
        };
      }

      // Clean up winner
      if (cleanedProduct.auction.winner && cleanedProduct.auction.winner.buyer) {
        cleanedProduct.auction.winner = {
          bidAmount: cleanedProduct.auction.winner.bidAmount,
          buyer: {
            firstName: cleanedProduct.auction.winner.buyer.firstName,
            lastName: cleanedProduct.auction.winner.buyer.lastName,
            country: cleanedProduct.auction.winner.buyer.country,
            profileImage: cleanedProduct.auction.winner.buyer.profileImage
          }
        };
      }

      return cleanedProduct;
    });

    res.json({
      products: cleanedProducts,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalProducts
      }
    });

  } catch (error) {
    console.error('Error in getAuctionProducts:', error);
    res.status(500).json({ message: 'Error retrieving auction products', error: error.message });
  }
};

// Get seller's auction products
exports.getSellerAuctionProducts = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { status, sort = 'endDate', page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = {
      status: 'offline_auction',
      seller: sellerId
    };
    if (status) {
      query['auction.status'] = status;
    }

    // Build sort object
    let sortObj = {};
    switch (sort) {
      case 'endDate':
        sortObj = { 'auction.endDate': 1 };
        break;
      case 'startDate':
        sortObj = { 'auction.startDate': 1 };
        break;
      case 'currentBid':
        sortObj = { 'auction.currentHighestBid.amount': -1 };
        break;
      default:
        sortObj = { 'auction.endDate': 1 };
    }

    // First, update any auctions that should be ended
    const now = new Date();
    await Product.updateMany(
      {
        status: 'offline_auction',
        seller: sellerId,
        'auction.status': 'ongoing',
        'auction.endDate': { $lt: now }
      },
      {
        $set: {
          'auction.status': 'ended',
          'auction.daysLeft': 0
        }
      }
    );

    // Execute query with pagination
    const [products, totalProducts] = await Promise.all([
      Product.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('seller', 'businessName storeName storeAvatar storeBanner stats firstName lastName email phoneNumber isVerified createdAt aboutStore')
        .populate({
          path: 'auction.bids.buyer',
          select: 'firstName lastName country profileImage -_id'
        })
        .populate({
          path: 'auction.currentHighestBid.buyer',
          select: 'firstName lastName country profileImage -_id'
        })
        .populate({
          path: 'auction.winner.buyer',
          select: 'firstName lastName country profileImage -_id'
        })
        .select('name description images auction seller'),
      Product.countDocuments(query)
    ]);

    // Calculate total pages
    const totalPages = Math.ceil(totalProducts / limit);

    // Update days left and clean up buyer data
    const cleanedProducts = products.map(product => {
      const cleanedProduct = product.toObject();

      // Calculate days left
      if (cleanedProduct.auction.status === 'scheduled') {
        cleanedProduct.auction.daysLeft = Math.ceil((cleanedProduct.auction.startDate - now) / (1000 * 60 * 60 * 24));
      } else if (cleanedProduct.auction.status === 'ongoing') {
        cleanedProduct.auction.daysLeft = Math.ceil((cleanedProduct.auction.endDate - now) / (1000 * 60 * 60 * 24));
        // Double-check if this auction should be ended (defensive check)
        if (cleanedProduct.auction.endDate < now) {
          cleanedProduct.auction.status = 'ended';
          cleanedProduct.auction.daysLeft = 0;
        }
      } else {
        cleanedProduct.auction.daysLeft = 0;
      }

      // Clean up bids
      if (cleanedProduct.auction.bids) {
        cleanedProduct.auction.bids = cleanedProduct.auction.bids.map(bid => ({
          _id: bid._id,
          amount: bid.amount,
          status: bid.status,
          createdAt: bid.createdAt,
          buyer: bid.buyer ? {
            firstName: bid.buyer.firstName,
            lastName: bid.buyer.lastName,
            country: bid.buyer.country,
            profileImage: bid.buyer.profileImage
          } : null
        }));
      }

      // Clean up current highest bid
      if (cleanedProduct.auction.currentHighestBid && cleanedProduct.auction.currentHighestBid.buyer) {
        cleanedProduct.auction.currentHighestBid = {
          amount: cleanedProduct.auction.currentHighestBid.amount,
          buyer: {
            firstName: cleanedProduct.auction.currentHighestBid.buyer.firstName,
            lastName: cleanedProduct.auction.currentHighestBid.buyer.lastName,
            country: cleanedProduct.auction.currentHighestBid.buyer.country,
            profileImage: cleanedProduct.auction.currentHighestBid.buyer.profileImage
          }
        };
      }

      // Clean up winner
      if (cleanedProduct.auction.winner && cleanedProduct.auction.winner.buyer) {
        cleanedProduct.auction.winner = {
          bidAmount: cleanedProduct.auction.winner.bidAmount,
          buyer: {
            firstName: cleanedProduct.auction.winner.buyer.firstName,
            lastName: cleanedProduct.auction.winner.buyer.lastName,
            country: cleanedProduct.auction.winner.buyer.country,
            profileImage: cleanedProduct.auction.winner.buyer.profileImage
          }
        };
      }

      return cleanedProduct;
    });

    res.json({
      products: cleanedProducts,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalProducts
      }
    });

  } catch (error) {
    console.error('Error in getSellerAuctionProducts:', error);
    res.status(500).json({ message: 'Error retrieving seller auction products', error: error.message });
  }
};




// Get products by category and subcategory
exports.getProductsByCategoryAndSubcategory = async (req, res) => {
  try {
    const { category, subcategory } = req.params;
    const { page = 1, limit = 20, sortBy = 'createdAt', order = 'desc', minPrice, maxPrice, condition } = req.query;

    // Build query
    const query = {
      category,
      subCategory: subcategory,
      status: 'active',
      visibility: 'visible'
    };

    // Add price filter if min or max price is provided
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);
    }

    // Add condition filter if provided (case-insensitive)
    if (condition) {
      query.condition = { $regex: new RegExp(`^${condition}$`, 'i') };
    }

    // Build sort options
    let sortOptions = {};
    switch (sortBy) {
      case 'price_asc':
        sortOptions = { price: 1 };
        break;
      case 'price_desc':
        sortOptions = { price: -1 };
        break;
      case 'oldest':
        sortOptions = { createdAt: 1 };
        break;
      case 'popular':
        sortOptions = { 'analytics.views': -1 };
        break;
      case 'best_selling':
        sortOptions = { 'stats.soldCount': -1 };
        break;
      case 'rating':
        sortOptions = { 'stats.averageRating': -1 };
        break;
      case 'newest':
      default:
        sortOptions = { createdAt: order === 'asc' ? 1 : -1 };
    }

    // Find products with pagination
    const products = await Product.find(query)
      .sort(sortOptions)
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .populate('seller', sellerPopulationFields)
      .select('-__v');

    // Get total count for pagination
    const total = await Product.countDocuments(query);

    return res.status(200).json({
      success: true,
      count: products.length,
      data: products,
      totalProducts: total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      filters: {
        category,
        subcategory,
        priceRange: {
          min: minPrice,
          max: maxPrice
        },
        condition,
        sortBy,
        order
      }
    });
  } catch (error) {
    console.error('Error fetching products by category and subcategory:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get products by category only (without subcategory filter)
exports.getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 20, sortBy = 'createdAt', order = 'desc', minPrice, maxPrice, condition } = req.query;

    // Build query - filter by category only, no subcategory filter
    const query = {
      category,
      status: 'active',
      visibility: 'visible'
    };

    // Add price filter if min or max price is provided
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);
    }

    // Add condition filter if provided (case-insensitive)
    if (condition) {
      query.condition = { $regex: new RegExp(`^${condition}$`, 'i') };
    }

    // Build sort options
    let sortOptions = {};
    switch (sortBy) {
      case 'price_asc':
        sortOptions = { price: 1 };
        break;
      case 'price_desc':
        sortOptions = { price: -1 };
        break;
      case 'oldest':
        sortOptions = { createdAt: 1 };
        break;
      case 'popular':
        sortOptions = { 'analytics.views': -1 };
        break;
      case 'best_selling':
        sortOptions = { 'stats.soldCount': -1 };
        break;
      case 'rating':
        sortOptions = { 'stats.averageRating': -1 };
        break;
      case 'newest':
      default:
        sortOptions = { createdAt: order === 'asc' ? 1 : -1 };
    }

    // Find products with pagination
    const products = await Product.find(query)
      .sort(sortOptions)
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .populate('seller', sellerPopulationFields)
      .select('-__v');

    // Get total count for pagination
    const total = await Product.countDocuments(query);

    return res.status(200).json({
      success: true,
      count: products.length,
      data: products,
      totalProducts: total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      filters: {
        category,
        priceRange: {
          min: minPrice,
          max: maxPrice
        },
        condition,
        sortBy,
        order
      }
    });
  } catch (error) {
    console.error('Error fetching products by category:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get all subcategories with products for a specific category
exports.getSubcategoriesWithProducts = async (req, res) => {
  try {
    const { category } = req.params;

    // Find all products with this category
    const products = await Product.find({
      category,
      status: 'active',
      visibility: 'visible',
      status: { $ne: 'offline_auction' }
    });

    if (!products || products.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No products found for this category'
      });
    }

    // Extract unique categories from the products
    const categories = [...new Set(products.map(product => product.category))];

    // Get full category details from the Category model
    const categoryDetails = await Category.find({ name: { $in: categories } });

    return res.status(200).json({
      success: true,
      count: categoryDetails.length,
      data: categoryDetails
    });
  } catch (error) {
    console.error('Error fetching seller product categories:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

// Get products by seller, category and subcategory
exports.getProductsBySellerCategoryAndSubcategory = async (req, res) => {
  try {
    const { sellerId, category, subcategory } = req.params;
    const { page = 1, limit = 20, sortBy = 'createdAt', order = 'desc' } = req.query;

    // Validate sellerId
    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({ success: false, message: 'Invalid seller ID format' });
    }

    // Build query
    const query = {
      seller: sellerId,
      category,
      subCategory: subcategory,
      status: 'active'
    };

    // Build sort options
    let sortOptions = {};
    switch (sortBy) {
      case 'price_asc':
        sortOptions = { price: 1 };
        break;
      case 'price_desc':
        sortOptions = { price: -1 };
        break;
      case 'oldest':
        sortOptions = { createdAt: 1 };
        break;
      case 'popular':
        sortOptions = { 'analytics.views': -1 };
        break;
      case 'best_selling':
        sortOptions = { 'stats.soldCount': -1 };
        break;
      case 'rating':
        sortOptions = { 'stats.averageRating': -1 };
        break;
      case 'newest':
      default:
        sortOptions = { createdAt: order === 'asc' ? 1 : -1 };
    }

    // Check if seller exists
    const seller = await mongoose.model('Seller').findById(sellerId);
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller not found' });
    }

    // Find products with pagination
    const products = await Product.find(query)
      .sort(sortOptions)
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .populate('seller', sellerPopulationFields)
      .select('-__v');

    // Get total count for pagination
    const total = await Product.countDocuments(query);

    return res.status(200).json({
      success: true,
      count: products.length,
      data: products,
      totalProducts: total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching products by category and subcategory:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get all subcategories with products for a specific seller and category
exports.getSellerSubcategoriesWithProducts = async (req, res) => {
  try {
    const { sellerId, category } = req.params;

    // Validate sellerId
    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({ success: false, message: 'Invalid seller ID format' });
    }

    // Check if seller exists
    const seller = await mongoose.model('Seller').findById(sellerId);
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller not found' });
    }

    // Find all products with this seller and category
    const products = await Product.find({
      seller: sellerId,
      category
    });

    if (!products || products.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No products found for this seller and category'
      });
    }

    // Extract unique subcategories and count products in each
    const subcategories = {};
    products.forEach(product => {
      if (product.subCategory) {
        if (!subcategories[product.subCategory]) {
          subcategories[product.subCategory] = 0;
        }
        subcategories[product.subCategory]++;
      }
    });

    // Convert to array format with counts
    const result = Object.keys(subcategories).map(subcat => ({
      name: subcat,
      productCount: subcategories[subcat]
    }));

    return res.status(200).json({
      success: true,
      count: result.length,
      data: result
    });
  } catch (error) {
    console.error('Error fetching seller subcategories with products:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// In-memory store for seen blips per session (consider Redis for production)
const sessionBlipStore = new Map();

// Maximum number of sessions to prevent memory issues
const MAX_SESSIONS = 1000;
const MAX_SEEN_BLIPS_PER_SESSION = 100;

// Clean up old sessions (run periodically)
// Only start the interval if not in test environment
if (process.env.NODE_ENV !== 'test') {
  setInterval(() => {
    const now = Date.now();
    let cleanedCount = 0;
    for (const [sessionId, data] of sessionBlipStore.entries()) {
      if (now - data.lastAccess > 1 * 60 * 1000) { // 1 minute
        sessionBlipStore.delete(sessionId);
        cleanedCount++;
      }
    }
    if (cleanedCount > 0) {
      console.log(`🧹 [BLIPS DEBUG] Cleaned up ${cleanedCount} expired sessions. Active sessions: ${sessionBlipStore.size}`);
    }
  }, 30 * 1000); // Clean every 30 seconds
}




// Rerun an ended offline auction
exports.rerunOfflineAuction = async (req, res) => {
  try {
    const { productId } = req.params;
    const { startDate, endDate, minBid, maxBid, endOnMaxBid } = req.body;

    // Validate required fields
    if (!endDate) {
      return res.status(400).json({ message: 'End date is required' });
    }

    // Find the product and verify it's an auction product
    const product = await Product.findById(productId).populate('seller');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Verify the seller owns this product
    if (product.seller._id.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Unauthorized to rerun this auction' });
    }

    // Verify it's an offline auction product
    if (product.status !== 'offline_auction') {
      return res.status(400).json({ message: 'This product is not an offline auction' });
    }

    // Verify the auction has ended
    if (product.auction.status !== 'ended') {
      return res.status(400).json({ message: 'Cannot rerun an auction that has not ended' });
    }

    // Parse and validate dates
    let parsedStartDate;
    let parsedEndDate;

    try {
      // If startDate is provided, parse it, otherwise use current date
      parsedStartDate = startDate ? new Date(startDate) : new Date();
      parsedEndDate = new Date(endDate);

      // Validate that the dates are valid
      if (isNaN(parsedStartDate.getTime())) {
        return res.status(400).json({ message: 'Invalid start date format' });
      }
      if (isNaN(parsedEndDate.getTime())) {
        return res.status(400).json({ message: 'Invalid end date format' });
      }

      // Validate date order
      if (parsedEndDate <= parsedStartDate) {
        return res.status(400).json({ message: 'End date must be after start date' });
      }
    } catch (error) {
      return res.status(400).json({ message: 'Invalid date format', error: error.message });
    }

    // Calculate days left
    const daysLeft = Math.ceil((parsedEndDate - parsedStartDate) / (1000 * 60 * 60 * 24));

    // Validate bid amounts if provided
    if (minBid && maxBid && minBid >= maxBid) {
      return res.status(400).json({ message: 'Maximum bid must be greater than minimum bid' });
    }

    // Reset auction data
    product.auction = {
      minBid: minBid || product.auction.minBid,
      maxBid: maxBid || product.auction.maxBid,
      endOnMaxBid: endOnMaxBid !== undefined ? endOnMaxBid : product.auction.endOnMaxBid,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      status: 'scheduled',
      daysLeft: daysLeft,
      bids: [],
      currentHighestBid: {
        amount: null,
        buyer: null
      },
      winner: {
        buyer: null,
        bidAmount: null,
        winningDate: null
      }
    };

    await product.save();

    res.status(200).json({
      message: 'Auction successfully rerun',
      auction: product.auction
    });

  } catch (error) {
    console.error('Error rerunning auction:', error);
    res.status(500).json({
      message: 'Error rerunning auction',
      error: error.message,
      details: error.errors ? Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      })) : null
    });
  }
};

// Get auction products where the logged-in buyer has active bids
exports.getBuyerAuctionProducts = async (req, res) => {
  try {
    // Check if req.user and req.user.id exist
    if (!req.user || !req.user.id) {
      console.log('User or user ID is missing:', req.user);
      return res.status(401).json({ message: 'User authentication error' });
    }

    const buyerId = req.user.id.toString();
    console.log('Finding auction products for buyer ID:', buyerId);

    const { status, sort = 'endDate', page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // First, update any auctions that should be ended
    const now = new Date();
    await Product.updateMany(
      {
        status: 'offline_auction',
        'auction.status': 'ongoing',
        'auction.endDate': { $lt: now }
      },
      {
        $set: {
          'auction.status': 'ended',
          'auction.daysLeft': 0
        }
      }
    );

    // Get all offline auction products
    const allAuctionProducts = await Product.find({
      status: 'offline_auction',
      ...(status ? { 'auction.status': status } : {})
    })
      .populate('seller', 'businessName storeName storeAvatar storeBanner stats firstName lastName email phoneNumber isVerified createdAt aboutStore')
      .populate({
        path: 'auction.bids.buyer',
        select: 'firstName lastName country profileImage _id'
      })
      .populate({
        path: 'auction.currentHighestBid.buyer',
        select: 'firstName lastName country profileImage _id'
      })
      .populate({
        path: 'auction.winner.buyer',
        select: 'firstName lastName country profileImage _id'
      })
      .select('name description images auction seller');

    console.log(`Found ${allAuctionProducts.length} total auction products`);

    // Filter for products where the buyer has bids
    const productsWithBuyerBids = allAuctionProducts.filter(product => {
      if (!product.auction || !product.auction.bids || !Array.isArray(product.auction.bids)) {
        return false;
      }

      return product.auction.bids.some(bid => {
        return bid && bid.buyer && bid.buyer._id && bid.buyer._id.toString() === buyerId;
      });
    });

    console.log(`Found ${productsWithBuyerBids.length} auction products with bids from buyer ${buyerId}`);

    // Apply pagination
    const paginatedProducts = productsWithBuyerBids
      .sort((a, b) => {
        // Apply sorting based on the sort parameter
        switch (sort) {
          case 'endDate':
            return new Date(a.auction.endDate) - new Date(b.auction.endDate);
          case 'startDate':
            return new Date(a.auction.startDate) - new Date(b.auction.startDate);
          case 'currentBid':
            return (b.auction.currentHighestBid?.amount || 0) - (a.auction.currentHighestBid?.amount || 0);
          case 'myBidAmount':
            // Get buyer's bids for both products
            const aBuyerBids = a.auction.bids.filter(bid => bid && bid.buyer && bid.buyer._id && bid.buyer._id.toString() === buyerId);
            const bBuyerBids = b.auction.bids.filter(bid => bid && bid.buyer && bid.buyer._id && bid.buyer._id.toString() === buyerId);

            // Get highest bid amounts (or 0 if no bids)
            const aHighestBid = aBuyerBids.length > 0
              ? Math.max(...aBuyerBids.map(bid => bid.amount))
              : 0;

            const bHighestBid = bBuyerBids.length > 0
              ? Math.max(...bBuyerBids.map(bid => bid.amount))
              : 0;

            return bHighestBid - aHighestBid;
          default:
            return new Date(a.auction.endDate) - new Date(b.auction.endDate);
        }
      })
      .slice(skip, skip + parseInt(limit));

    // Calculate total pages
    const totalProducts = productsWithBuyerBids.length;
    const totalPages = Math.ceil(totalProducts / limit);

    // Update days left and clean up buyer data
    const cleanedProducts = paginatedProducts.map(product => {
      const cleanedProduct = product.toObject();

      // Calculate days left
      if (cleanedProduct.auction.status === 'scheduled') {
        cleanedProduct.auction.daysLeft = Math.ceil((cleanedProduct.auction.startDate - now) / (1000 * 60 * 60 * 24));
      } else if (cleanedProduct.auction.status === 'ongoing') {
        cleanedProduct.auction.daysLeft = Math.ceil((cleanedProduct.auction.endDate - now) / (1000 * 60 * 60 * 24));
        // Double-check if this auction should be ended (defensive check)
        if (cleanedProduct.auction.endDate < now) {
          cleanedProduct.auction.status = 'ended';
          cleanedProduct.auction.daysLeft = 0;
        }
      } else {
        cleanedProduct.auction.daysLeft = 0;
      }

      // Add flag to indicate if the current buyer is the highest bidder
      cleanedProduct.isHighestBidder =
        product.auction.currentHighestBid &&
        product.auction.currentHighestBid.buyer &&
        product.auction.currentHighestBid.buyer._id &&
        product.auction.currentHighestBid.buyer._id.toString() === buyerId;

      // Add flag to indicate if the current buyer is the winner
      cleanedProduct.isWinner =
        product.auction.winner &&
        product.auction.winner.buyer &&
        product.auction.winner.buyer._id &&
        product.auction.winner.buyer._id.toString() === buyerId;

      // Add the buyer's highest bid
      const buyerBids = product.auction.bids.filter(
        bid => bid && bid.buyer && bid.buyer._id && bid.buyer._id.toString() === buyerId
      );

      if (buyerBids.length > 0) {
        // Sort bids by amount (descending) to get the highest
        const highestBid = [...buyerBids].sort((a, b) => b.amount - a.amount)[0];
        cleanedProduct.myHighestBid = {
          amount: highestBid.amount,
          status: highestBid.status,
          createdAt: highestBid.createdAt
        };
      }

      // Clean up bids
      if (cleanedProduct.auction.bids) {
        cleanedProduct.auction.bids = cleanedProduct.auction.bids.map(bid => ({
          _id: bid._id,
          amount: bid.amount,
          status: bid.status,
          createdAt: bid.createdAt,
          buyer: bid.buyer ? {
            firstName: bid.buyer.firstName,
            lastName: bid.buyer.lastName,
            country: bid.buyer.country,
            profileImage: bid.buyer.profileImage
          } : null
        }));
      }

      // Clean up current highest bid
      if (cleanedProduct.auction.currentHighestBid && cleanedProduct.auction.currentHighestBid.buyer) {
        cleanedProduct.auction.currentHighestBid = {
          amount: cleanedProduct.auction.currentHighestBid.amount,
          buyer: {
            firstName: cleanedProduct.auction.currentHighestBid.buyer.firstName,
            lastName: cleanedProduct.auction.currentHighestBid.buyer.lastName,
            country: cleanedProduct.auction.currentHighestBid.buyer.country,
            profileImage: cleanedProduct.auction.currentHighestBid.buyer.profileImage
          }
        };
      }

      // Clean up winner
      if (cleanedProduct.auction.winner && cleanedProduct.auction.winner.buyer) {
        cleanedProduct.auction.winner = {
          bidAmount: cleanedProduct.auction.winner.bidAmount,
          buyer: {
            firstName: cleanedProduct.auction.winner.buyer.firstName,
            lastName: cleanedProduct.auction.winner.buyer.lastName,
            country: cleanedProduct.auction.winner.buyer.country,
            profileImage: cleanedProduct.auction.winner.buyer.profileImage
          }
        };
      }

      return cleanedProduct;
    });

    res.json({
      products: cleanedProducts,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalProducts
      }
    });

  } catch (error) {
    console.error('Error in getBuyerAuctionProducts:', error);
    res.status(500).json({ message: 'Error retrieving your auction products', error: error.message });
  }
};

/**
 * Reply to a product review
 * @route POST /api/products/:productId/reviews/:reviewId/reply
 * @access Private (Seller only)
 */
exports.replyToProductReview = async (req, res) => {
  try {
    const { productId, reviewId } = req.params;
    const { content } = req.body;
    const sellerId = req.user.id;

    // Validate input
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Reply content is required' });
    }

    // Find the product and check if it belongs to the seller
    const product = await Product.findOne({ _id: productId, seller: sellerId });
    if (!product) {
      return res.status(404).json({
        message: 'Product not found or you are not authorized to reply to reviews for this product'
      });
    }

    // Find the review
    const review = product.reviews.id(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Add or update reply
    review.reply = {
      content: content.trim(),
      createdAt: review.reply?.createdAt || new Date(),
      updatedAt: new Date()
    };

    await product.save();

    // Optionally send notification to buyer
    try {
      // Check if notification controller exists
      if (typeof notificationController !== 'undefined' && notificationController.createNotification) {
        await notificationController.createNotification({
          recipient: 'buyer',
          buyer: review.buyer,
          type: 'review_reply',
          title: 'Seller replied to your review',
          message: `The seller has replied to your review on ${product.name}`,
          data: {
            productId: product._id,
            reviewId: review._id
          }
        });
      }
    } catch (notifError) {
      console.error('Failed to send notification:', notifError);
    }

    res.json({
      message: 'Reply added successfully',
      review
    });
  } catch (error) {
    console.error('Error in replyToProductReview:', error);
    res.status(500).json({
      message: 'Failed to add reply',
      error: error.message
    });
  }
};

/**
 * Get specific review details by product ID and review ID
 * @route GET /api/products/:productId/reviews/:reviewId
 * @access Public
 */
exports.getReviewDetails = async (req, res) => {
  try {
    const { productId, reviewId } = req.params;

    // Find the product
    const product = await Product.findById(productId)
      .select('name price description images reviews');

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

    // Get seller details if review has a reply
    let sellerInfo = null;
    if (review.reply && review.reply.content) {
      const Seller = require('../models/Seller');
      const seller = await Seller.findById(product.seller)
        .select('firstName lastName businessName storeName storeAvatar');

      if (seller) {
        sellerInfo = {
          _id: seller._id,
          name: seller.storeName || seller.businessName || `${seller.firstName} ${seller.lastName}`,
          avatar: seller.storeAvatar?.url || null
        };
      }
    }

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
    console.error('Error in getReviewDetails:', error);
    res.status(500).json({
      message: 'Failed to retrieve review details',
      error: error.message
    });
  }
};



/**
 * Search seller's products
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - JSON response with products
 */
exports.searchSellerProducts = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const {
      query,
      category,
      minPrice,
      maxPrice,
      condition,
      sortBy = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    // Validate sellerId
    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid seller ID format'
      });
    }

    // Build search query
    const searchQuery = {
      seller: sellerId,
      status: 'active',
      visibility: 'visible'
    };

    // Add text search if query provided
    if (query) {
      searchQuery.$or = [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } }
      ];
    }

    // Add category filter if provided
    if (category) {
      searchQuery.category = category;
    }

    // Add price range if provided
    if (minPrice !== undefined || maxPrice !== undefined) {
      searchQuery.price = {};
      if (minPrice !== undefined) searchQuery.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) searchQuery.price.$lte = Number(maxPrice);
    }

    // Add condition filter if provided
    if (condition) {
      searchQuery.condition = { $regex: new RegExp(`^${condition}$`, 'i') };
    }

    // Build sort options
    let sortOptions = {};
    switch (sortBy) {
      case 'price':
        sortOptions.price = order === 'asc' ? 1 : -1;
        break;
      case 'name':
        sortOptions.name = order === 'asc' ? 1 : -1;
        break;
      case 'popularity':
        sortOptions['stats.views'] = order === 'asc' ? 1 : -1;
        break;
      case 'rating':
        sortOptions['stats.averageRating'] = order === 'asc' ? 1 : -1;
        break;
      default:
        sortOptions[sortBy] = order === 'asc' ? 1 : -1;
    }

    // Execute query with pagination
    const products = await Product.find(searchQuery)
      .sort(sortOptions)
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .populate('seller', 'businessName storeName storeAvatar storeBanner stats firstName lastName email phoneNumber isVerified createdAt aboutStore');

    // Get total count for pagination
    const total = await Product.countDocuments(searchQuery);

    return res.status(200).json({
      success: true,
      data: products,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalProducts: total,
        hasMore: page * limit < total
      },
      filters: {
        query,
        category,
        priceRange: {
          min: minPrice,
          max: maxPrice
        },
        condition,
        sortBy,
        order
      }
    });

  } catch (error) {
    console.error('Error searching seller products:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}



exports.bulkUpdatePrices = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { percentage } = req.body;

    if (percentage === undefined || typeof percentage !== 'number') {
      return res.status(400).json({ message: 'Percentage is required and must be a number.' });
    }

    const multiplier = 1 + (percentage / 100);

    if (multiplier < 0) {
      return res.status(400).json({ message: 'Percentage decrease cannot be more than 100%.' });
    }

    // Using updateMany with aggregation pipeline for update
    const result = await Product.updateMany(
      { seller: sellerId },
      [{ $set: { price: { $multiply: ['$price', multiplier] } } }]
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'No products found for this seller.' });
    }

    res.json({
      message: `Product prices updated successfully for ${result.modifiedCount} of ${result.matchedCount} products.`,
      updatedCount: result.modifiedCount,
      matchedCount: result.matchedCount
    });

  } catch (error) {
    console.error('Bulk price update error:', error);
    res.status(500).json({
      message: 'Failed to update product prices',
      error: error.message
    });
  }
};

