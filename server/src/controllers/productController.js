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

    // Handle main product images
    let imagesLinks = [];
    if (req.body.images && Array.isArray(req.body.images)) {
      for (let image of req.body.images) {
        const buffer = Buffer.from(image.data, 'base64');
        const params = {
          Bucket: process.env.CDN_S3_BUCKET,
          Key: `${uuidv4()}.jpg`,
          Body: buffer,
          ContentType: image.contentType,
        };
        const data = await s3.upload(params).promise();
        imagesLinks.push({ url: 'https://' + process.env.CDN_URL + `/${data.Key}` });
      }
    }

    // Process variant images
    if (req.body.variants && Array.isArray(req.body.variants)) {
      parsedBody.variants = await Promise.all(req.body.variants.map(async (variant) => {
        // Process main variant images
        let variantImages = [];
        if (variant?.images?.length > 0 && Array.isArray(variant.images)) {
          for (let image of variant.images) {
            if (!image?.data) {
              console.log('Skipping variant image processing - no image data');
              continue;
            }

            // Handle base64 data with optional prefix
            const base64Data = image.data.split(',')[1] || image.data;
            if (!base64Data) {
              console.error('Invalid base64 data for variant image:', image);
              continue;
            }

            const buffer = Buffer.from(base64Data, 'base64');
            const params = {
              Bucket: process.env.CDN_S3_BUCKET,
              Key: `variants/colors/${uuidv4()}-${variant.value}.jpg`,
              Body: buffer,
              ContentType: image.contentType,
            };
            
            const data = await s3.upload(params).promise();
            variantImages.push({
              data: `https://` + process.env.CDN_URL + `/${data.Key}`,
              contentType: image.contentType,
              isDefault: image.isDefault || false
            });
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

              const base64Data = image.data.split(',')[1] || image.data;
              if (!base64Data) {
                console.error('Invalid base64 data for subvariant image:', image);
                continue;
              }

              const buffer = Buffer.from(base64Data, 'base64');
              const params = {
                Bucket: process.env.CDN_S3_BUCKET,
                Key: `variants/sizes/${uuidv4()}-${variant.value}_${subVariant.value}.jpg`,
                Body: buffer,
                ContentType: image.contentType,
              };
              
              const data = await s3.upload(params).promise();
              subVariantImages.push({
                data: `https://` + process.env.CDN_URL + `/${data.Key}`,
                contentType: image.contentType,
                isDefault: image.isDefault || false
              });
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

                const base64Data = image.data.split(',')[1] || image.data;
                if (!base64Data) {
                  console.error('Invalid base64 data for subsubvariant image:', image);
                  continue;
                }

                const buffer = Buffer.from(base64Data, 'base64');
                const params = {
                  Bucket: process.env.CDN_S3_BUCKET,
                  Key: `variants/materials/${uuidv4()}-${variant.value}_${subVariant.value}_${subSubVariant.value}.jpg`,
                  Body: buffer,
                  ContentType: image.contentType,
                };
                
                const data = await s3.upload(params).promise();
                subSubVariantImages.push({
                  data: `https://` + process.env.CDN_URL + `/${data.Key}`,
                  contentType: image.contentType,
                  isDefault: image.isDefault || false
                });
              }
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
    }

    // Create new product
    const newProduct = new Product({
      ...parsedBody,
      seller: sellerId,
      images: imagesLinks,
    });

    await newProduct.save();    

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

// Helper function to process images and upload to S3
async function processImages(images) {
  if (!images || !Array.isArray(images)) {
    return [];
  }

  return Promise.all(images.map(async (image) => {
    try {
      // Generate unique filename
      const key = `products/${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      // Upload to S3
      await s3.upload({
        Bucket: process.env.CDN_S3_BUCKET,
        Key: key,
        Body: Buffer.from(image.data, 'base64'),
        ContentType: image.contentType,
        ACL: 'public-read' // Make the image publicly accessible
      }).promise();

      return {
        data: `https://`+ process.env.CDN_URL +`/${key}`,
        contentType: image.contentType,
        isDefault: image.isDefault || false
      };
    } catch (error) {
      console.error('Error uploading image to S3:', error);
      throw error;
    }
  }));
}

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
    // Build query - start with base query that excludes offline_auction products
    let query = { status: { $ne: 'offline_auction' } };
    // Only add additional status filter if specifically provided in the query
    if (req.query.status) {
      query.status = status;
    }
    if (req.query.visibility) {
      query.visibility = visibility;
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
        reviewCount: productObj.stats?.totalReviews || 0
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
          select: `
            firstName lastName email phoneNumber businessName 
            businessType businessEmail businessNumber businessAddress 
            storeName aboutStore storeAvatar storeBanner 
            shippingOptions warehouseDetails categories followers
            isVerified accountType storeVisits products customers
            offersStorePickup
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
            storeVisits: formattedProduct.seller.storeVisits || 0,
            totalProducts: formattedProduct.seller.products ? formattedProduct.seller.products.length : 0,
            totalCustomers: formattedProduct.seller.customers ? formattedProduct.seller.customers.length : 0
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
              storeVisits: '$sellerInfo.storeVisits',
              totalProducts: { $size: { $ifNull: ['$sellerInfo.products', []] } },
              totalCustomers: { $size: { $ifNull: ['$sellerInfo.customers', []] } }
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
            soldCount: '$stats.soldCount',
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
          // Process new base64 image
          const buffer = Buffer.from(image.data, 'base64');
          const params = {
            Bucket: process.env.CDN_S3_BUCKET,
            Key: `${uuidv4()}.jpg`,
            Body: buffer,
            ContentType: image.contentType,
          };
          const data = await s3.upload(params).promise();
          imagesLinks.push({ url: cdnPrefix + `/${data.Key}`});
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

      updates.variants = await Promise.all(updates.variants.map(async (variant) => {
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
              const params = {
                Bucket: process.env.CDN_S3_BUCKET,
                Key: `variants/colors/${uuidv4()}-${variant.value}.jpg`,
                Body: buffer,
                ContentType: image.contentType,
              };
              
              const data = await s3.upload(params).promise();
              variantImages.push({
                data: cdnPrefix + `/${data.Key}`,
                contentType: image.contentType,
                isDefault: image.isDefault || false
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
                const params = {
                  Bucket: process.env.CDN_S3_BUCKET,
                  Key: `variants/sizes/${uuidv4()}-${variant.value}_${subVariant.value}.jpg`,
                  Body: buffer,
                  ContentType: image.contentType,
                };
                
                const data = await s3.upload(params).promise();
                subVariantImages.push({
                  data: cdnPrefix + `/${data.Key}`,
                  contentType: image.contentType,
                  isDefault: image.isDefault || false
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
                  const params = {
                    Bucket: process.env.CDN_S3_BUCKET,
                    Key: `variants/materials/${uuidv4()}-${variant.value}_${subVariant.value}_${subSubVariant.value}.jpg`,
                    Body: buffer,
                    ContentType: image.contentType,
                  };
                  
                  const data = await s3.upload(params).promise();
                  subSubVariantImages.push({
                    data: cdnPrefix + `/${data.Key}`,
                    contentType: image.contentType,
                    isDefault: image.isDefault || false
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

    res.json({
      products,
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

    // Basic match stage for full-text or regex query
    let searchResults = [];
    let total = 0;

    if (query.trim()) {
      // Memory-safe search approach
      const searchTerms = query.trim().split(/\s+/).filter(term => term.length > 0);
      
      // Handle common word variations (singular/plural) - but only for longer terms
      const expandedTerms = [...searchTerms];
      searchTerms.forEach(term => {
        if (term.length > 2) { // Only expand terms longer than 2 characters
          if (term.endsWith('s') && term.length > 3) {
            expandedTerms.push(term.slice(0, -1));
          } else if (!term.endsWith('s')) {
            expandedTerms.push(`${term}s`);
          }
        }
      });
      
      // Build MongoDB query with better field coverage
      const orConditions = [];
      
      // For single character searches, use a simpler approach
      if (query.trim().length === 1) {
        const singleChar = query.trim();
        orConditions.push(
          // Simple contains search - most likely to find matches
          { name: { $regex: singleChar, $options: 'i' } },
          { category: { $regex: singleChar, $options: 'i' } },
          { subCategory: { $regex: singleChar, $options: 'i' } },
          { brand: { $regex: singleChar, $options: 'i' } }
        );
      } else {
        // For longer queries, use the full search
        orConditions.push(
          // Exact matches (higher priority)
          { name: { $regex: query, $options: 'i' } },
          { category: { $regex: `^${query}$`, $options: 'i' } },
          { subCategory: { $regex: `^${query}$`, $options: 'i' } },
          { subSubCategory: { $regex: `^${query}$`, $options: 'i' } }
        );
        
        // Add partial term matches for each search term
        expandedTerms.forEach(term => {
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

      // DEBUG: Log the query for single character searches
      if (query.trim().length === 1) {
        console.log('Single char search query:', JSON.stringify(mongoSearchQuery, null, 2));
      }

      // MEMORY OPTIMIZATION: Limit initial DB query to prevent loading too many products
      const MAX_SEARCH_RESULTS = 200; // Conservative limit to prevent memory issues
      
      // First, get count for pagination
      total = await Product.countDocuments(mongoSearchQuery);
      console.log(`Query "${query}" found ${total} total matches`);
      
      // Get limited results for fuzzy search - prioritize by relevance
      const dbResults = await Product.find(mongoSearchQuery)
        .populate('seller', 'name avatarUrl about')
        .populate('reviews.buyer', 'firstName lastName')
        .sort({ createdAt: -1 }) // Sort by newest first for relevance
        .limit(MAX_SEARCH_RESULTS); // CRITICAL: Limit memory usage
      
      console.log(`Retrieved ${dbResults.length} products from DB`);

      // Only use Fuse.js if we have a reasonable number of results
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
          minMatchCharLength: query.trim().length === 1 ? 1 : 2, // Allow single character matching
          location: 0,
          shouldSort: true
        });

        const fuzzyResults = fuse.search(query);
        
        // Boost matches based on multiple criteria
        const boostedResults = fuzzyResults.map(result => {
          const item = result.item;
          let score = result.score;
          let boostFactor = 1.0;
          
          // Boost exact category matches
          if (item.category) {
            const categoryLower = item.category.toLowerCase();
            const queryLower = query.toLowerCase();
            
            if (categoryLower === queryLower) {
              boostFactor *= 0.3;
            } else if (new RegExp(`\\b${queryLower}\\b`).test(categoryLower)) {
              boostFactor *= 0.4;
            }
          }
          
          // Boost subcategory matches
          if (item.subCategory) {
            const subCategoryLower = item.subCategory.toLowerCase();
            const queryLower = query.toLowerCase();
            
            if (subCategoryLower === queryLower) {
              boostFactor *= 0.5;
            } else if (new RegExp(`\\b${queryLower}\\b`).test(subCategoryLower)) {
              boostFactor *= 0.6;
            }
          }
          
          // Boost name matches
          if (item.name && item.name.toLowerCase().includes(query.toLowerCase())) {
            boostFactor *= 0.7;
          }
          
          // Boost multiple term matches
          if (item.name) {
            const nameLower = item.name.toLowerCase();
            const matchCount = expandedTerms.filter(term => 
              nameLower.includes(term.toLowerCase())
            ).length;
            
            if (matchCount > 1) {
              boostFactor *= (0.8 - (matchCount * 0.05));
            }
          }
          
          return { ...result, score: score * boostFactor };
        });
        
        // Sort by boosted score
        boostedResults.sort((a, b) => a.score - b.score);
        
        const mappedResults = boostedResults.map((result) => result.item);
        
        // Apply additional sorting
        const sortOptions = getSortOptions(sortBy, order);
        mappedResults.sort((a, b) => {
          const sortKey = Object.keys(sortOptions)[0];
          const sortDirection = sortOptions[sortKey];
          
          const getValue = (obj, path) => {
            return path.split('.').reduce((o, key) => (o && o[key] !== undefined ? o[key] : null), obj);
          };
          
          const aValue = getValue(a, sortKey);
          const bValue = getValue(b, sortKey);
          
          if (aValue === null && bValue === null) return 0;
          if (aValue === null) return sortDirection > 0 ? -1 : 1;
          if (bValue === null) return sortDirection > 0 ? 1 : -1;
          
          return sortDirection * (aValue > bValue ? 1 : aValue < bValue ? -1 : 0);
        });
        
        // Apply pagination to fuzzy results
        searchResults = mappedResults.slice(skip, skip + limit);
        
        // Update total to reflect actual fuzzy search results if less than DB total
        if (fuzzyResults.length < total) {
          total = fuzzyResults.length;
        }
      } else {
        searchResults = [];
        total = 0;
      }

    } else {
      // No search query — regular listing with filters only
      total = await Product.countDocuments(filter);
      searchResults = await Product.find(filter)
        .sort(getSortOptions(sortBy, order))
        .populate('seller', 'name avatarUrl about')
        .populate('reviews.buyer', 'firstName lastName')
        .skip(skip)
        .limit(limit);
    }

    return res.json({
      products: searchResults,
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
      status: 'active',
      $or: [
        { category: { $in: buyer.selectedCategories.map(cat => cat.name) } },
        { subCategory: { $in: subcategoryNames } }
      ]
    })
    .sort({ createdAt: -1 })
    .populate('seller', 'name avatarUrl about offersStorePickup')
    .populate('reviews.buyer', 'firstName lastName');

    res.json(products);
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

    res.json({
      products,
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

// Get all product blips
exports.getAllBlips = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  
  // Check if user is authenticated
  const buyerId = req.user?.id;
  const isAuthenticated = !!buyerId && req.user?.role === 'Buyer';

  try {
    console.log('Starting getAllBlips aggregation...');
    
    const blips = await Product.aggregate([
      // Match products that have blips and exclude offline_auction products with ended status
      { $match: { 
        blips: { $exists: true, $ne: [] },
        $nor: [
          { 
            status: 'offline_auction', 
            'auction.status': 'ended' 
          }
        ]
      }},
      // Unwind the blips array
      { $unwind: '$blips' },
      // Lookup seller information
      {
        $lookup: {
          from: 'sellers',
          localField: 'seller',
          foreignField: '_id',
          as: 'sellerInfo'
        }
      },
      { $unwind: '$sellerInfo' },
      // Lookup auction bidder information
      {
        $lookup: {
          from: 'buyers',
          localField: 'auction.currentHighestBid.buyer',
          foreignField: '_id',
          as: 'highestBidder'
        }
      },
      // Project needed fields
      {
        $project: {
          _id: '$_id', // This is the product ID
          blipId: '$blips._id', // Add this line to include the blip ID
          blipUrl: '$blips.url',
          thumbnail: { 
            $ifNull: [
              '$blips.thumbnail', 
              'https://res.cloudinary.com/dljgzevaj/image/upload/v1742758888/sans-affiche_zu6wj4.png'
            ] 
          },
          productId: '$_id',
          productName: '$name',
          price: '$price',
          stock: '$stock',
          status: '$status',
          auctionInfo: {
            $cond: {
              if: { $eq: ['$status', 'offline_auction'] },
              then: {
                minBid: '$auction.minBid',
                maxBid: '$auction.maxBid',
                endOnMaxBid: '$auction.endOnMaxBid',
                startDate: '$auction.startDate',
                endDate: '$auction.endDate',
                status: '$auction.status',
                daysLeft: '$auction.daysLeft',
                currentHighestBid: {
                  amount: '$auction.currentHighestBid.amount',
                  buyer: {
                    _id: '$auction.currentHighestBid.buyer',
                    firstName: { $arrayElemAt: ['$highestBidder.firstName', 0] },
                    lastName: { $arrayElemAt: ['$highestBidder.lastName', 0] },
                    profileImage: { $arrayElemAt: ['$highestBidder.profileImage', 0] }
                  }
                },
                winner: {
                  buyer: '$auction.winner.buyer',
                  bidAmount: '$auction.winner.bidAmount',
                  winningDate: '$auction.winner.winningDate'
                },
                bidsCount: {
                  $cond: {
                    if: { $isArray: '$auction.bids' },
                    then: { $size: '$auction.bids' },
                    else: 0
                  }
                }
              },
              else: null
            }
          },
          discount: {
            isActive: '$discount.isActive',
            type: '$discount.type',
            value: '$discount.value',
            startDate: '$discount.startDate',
            endDate: '$discount.endDate',
            couponName: '$discount.couponName',
            discountedPrice: {
              $cond: {
                if: '$discount.isActive',
                then: {
                  $cond: {
                    if: { $eq: ['$discount.type', 'percentage'] },
                    then: { $round: [{ $multiply: ['$price', { $subtract: [1, { $divide: ['$discount.value', 100] }] }] }, 0] },
                    else: { $subtract: ['$price', '$discount.value'] }
                  }
                },
                else: '$price'
              }
            }
          },
          seller: {
            _id: '$sellerInfo._id',
            firstName: '$sellerInfo.firstName',
            lastName: '$sellerInfo.lastName',
            storeName: '$sellerInfo.storeName',
            storeAvatar: '$sellerInfo.storeAvatar',
            aboutStore: '$sellerInfo.aboutStore',
            storeRating: { $ifNull: ['$sellerInfo.stats.averageRating', 0] },
            totalStoreReviews: { $ifNull: ['$sellerInfo.stats.totalReviews', 0] },
            isFollowing: {
              $cond: {
                if: { $isArray: '$sellerInfo.followers' },
                then: {
                  $in: [
                    { $toObjectId: { $ifNull: [buyerId, null] } },
                    { $ifNull: ['$sellerInfo.followers.buyerId', []] }
                  ]
                },
                else: false
              }
            },
            isFeatured: { $ifNull: ['$sellerInfo.isFeatured', false] }
          },
          images: { $first: '$images.url' },
          blipEngagement: {
            likesCount: {
              $size: {
                $cond: {
                  if: { $isArray: '$blips.likes' },
                  then: '$blips.likes',
                  else: []
                }
              }
            },
            commentsCount: {
              $size: {
                $cond: {
                  if: { $isArray: '$blips.comments' },
                  then: '$blips.comments',
                  else: []
                }
              }
            },
            viewCount: '$blips.viewCount',
            isLiked: {
              $cond: {
                if: { $and: [isAuthenticated, { $isArray: '$blips.likes' }] },
                then: {
                  $in: [
                    { $toObjectId: { $ifNull: [buyerId, null] } },
                    '$blips.likes'
                  ]
                },
                else: false
              }
            }
          },
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
          },
          createdAt: '$blips.createdAt'
        }
      },
      // Sort by newest first
      { $sort: { createdAt: -1 } },
      // Skip and limit for pagination
      { $skip: (page - 1) * limit },
      { $limit: limit }
    ]);

    console.log(`Found ${blips.length} blips`);

    // Process blips to add isFollowing property
    const processedBlips = blips.map(blip => {
      // Create a new object without the followers array
      const { seller, ...rest } = blip;
      
      // Return the processed blip
      return {
        ...rest,
        seller
      };
    });

    const total = await Product.countDocuments({
      blips: { $exists: true, $ne: [] },
      $nor: [
        {
          status: 'offline_auction', 
          'auction.status': 'ended'
        }
      ]
    });

    console.log(`Total blips count: ${total}`);

    res.json({
      blips: processedBlips,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalBlips: total
    });
  } catch (error) {
    console.error('Detailed error in getAllBlips:', error);
    res.status(500).json({ message: 'Failed to retrieve blips', error: error.message });
  }
};

// Get seller's blips
exports.getSellerBlips = async (req, res) => {
  const { sellerId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  // Optional processed filter
  // accepted values: "true", "false" (any other value: ignore the filter)
  let processedFilter = {};
  if (typeof req.query.processed === 'string') {
    const flag = req.query.processed.toLowerCase();
    if (flag === 'true' || flag === 'false') {
      processedFilter = { 'blips.processed': flag === 'true' };
    }
  }

  // Check if user is authenticated
  const buyerId = req.user?.id;
  const isAuthenticated = !!buyerId && req.user?.role === 'Buyer';

  try {
    console.log(`Starting getSellerBlips for seller: ${sellerId}`);

    // Validate sellerId
    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({ message: 'Invalid seller ID' });
    }

    // Get seller info first
    const seller = await Seller.findById(sellerId, {
      firstName: 1,
      lastName: 1,
      businessName: 1,
      storeName: 1,
      storeAvatar: 1,
      aboutStore: 1,
      stats: 1, // Include stats for store rating
      followers: 1 // Include followers to check if buyer is following
    });

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    console.log('Found seller:', seller.storeName);

    // Check if buyer is following this seller
    let isFollowing = false;
    if (isAuthenticated && Array.isArray(seller.followers)) {
      isFollowing = seller.followers.some(
        follower => follower.buyerId && follower.buyerId.toString() === buyerId
      );
    }

    // Check if seller has any blips before aggregation
    const hasBlips = await Product.exists({
      seller: new mongoose.Types.ObjectId(sellerId),
      blips: { $exists: true, $ne: [] },
      ...processedFilter,
      $nor: [
        {
          status: 'offline_auction', 
          'auction.status': 'ended'
        }
      ]
    });

    if (!hasBlips) {
      console.log('No blips found for seller');
      
      // Create seller object with isFollowing property
      const sellerResponse = {
        _id: seller._id,
        firstName: seller.firstName,
        lastName: seller.lastName,
        storeName: seller.storeName,
        storeAvatar: seller.storeAvatar,
        aboutStore: seller.aboutStore,
        storeRating: seller.stats ? seller.stats.averageRating : 0,
        totalStoreReviews: seller.stats ? seller.stats.totalReviews : 0,
        isFollowing
      };
      
      return res.json({
        message: 'Seller has no blips',
        seller: sellerResponse,
        blips: [],
        currentPage: page,
        totalPages: 0,
        totalBlips: 0
      });
    }

    const blips = await Product.aggregate([
      // Match products from this seller that have blips and exclude offline_auction products with ended status
      { 
        $match: { 
          seller: new mongoose.Types.ObjectId(sellerId),
          blips: { $exists: true, $ne: [] },
          $nor: [
            {
              status: 'offline_auction', 
              'auction.status': 'ended'
            }
          ],
          ...processedFilter
        } 
      },
      // Unwind the blips array
      { $unwind: '$blips' },
      { $match: processedFilter }, // no-op if processedFilter is {}
      // Lookup auction bidder information
      {
        $lookup: {
          from: 'buyers',
          localField: 'auction.currentHighestBid.buyer',
          foreignField: '_id',
          as: 'highestBidder'
        }
      },
      // Lookup auction winner information
      {
        $lookup: {
          from: 'buyers',
          localField: 'auction.winner.buyer',
          foreignField: '_id',
          as: 'auctionWinner'
        }
      },
      // Project needed fields with safe handling of likes/comments
      {
        $project: {
          _id: '$_id',                    // Product ID
          blipId: '$blips._id',          // Actual blip ID
          blipUrl: '$blips.url',
          thumbnail: { 
            $ifNull: [
              '$blips.thumbnail', 
              'https://res.cloudinary.com/dljgzevaj/image/upload/v1742758888/sans-affiche_zu6wj4.png'
            ] 
          },
          productId: '$_id',
          productName: '$name',
          price: '$price',
          // Include stock information
          stock: '$stock',
          // Include product status
          status: '$status',
          // Include auction information if it's an offline auction
          auctionInfo: {
            $cond: {
              if: { $eq: ['$status', 'offline_auction'] },
              then: {
                minBid: '$auction.minBid',
                maxBid: '$auction.maxBid',
                endOnMaxBid: '$auction.endOnMaxBid',
                startDate: '$auction.startDate',
                endDate: '$auction.endDate',
                status: '$auction.status',
                daysLeft: '$auction.daysLeft',
                currentHighestBid: {
                  amount: '$auction.currentHighestBid.amount',
                  buyer: {
                    _id: '$auction.currentHighestBid.buyer',
                    firstName: { $arrayElemAt: ['$highestBidder.firstName', 0] },
                    lastName: { $arrayElemAt: ['$highestBidder.lastName', 0] },
                    profileImage: { $arrayElemAt: ['$highestBidder.profileImage', 0] }
                  }
                },
                winner: {
                  bidAmount: '$auction.winner.bidAmount',
                  winningDate: '$auction.winner.winningDate',
                  buyer: {
                    _id: '$auction.winner.buyer',
                    firstName: { $arrayElemAt: ['$auctionWinner.firstName', 0] },
                    lastName: { $arrayElemAt: ['$auctionWinner.lastName', 0] },
                    profileImage: { $arrayElemAt: ['$auctionWinner.profileImage', 0] }
                  }
                },
                bidsCount: {
                  $cond: {
                    if: { $isArray: '$auction.bids' },
                    then: { $size: '$auction.bids' },
                    else: 0
                  }
                }
              },
              else: null
            }
          },
          // Include discount information
          discount: {
            isActive: '$discount.isActive',
            type: '$discount.type',
            value: '$discount.value',
            startDate: '$discount.startDate',
            endDate: '$discount.endDate',
            couponName: '$discount.couponName',
            discountedPrice: {
              $cond: {
                if: '$discount.isActive',
                then: {
                  $cond: {
                    if: { $eq: ['$discount.type', 'percentage'] },
                    then: { $round: [{ $multiply: ['$price', { $subtract: [1, { $divide: ['$discount.value', 100] }] }] }, 0] },
                    else: { $subtract: ['$price', '$discount.value'] }
                  }
                },
                else: '$price'
              }
            }
          },
          seller: {
            _id: { $literal: seller._id },
            firstName: { $literal: seller.firstName },
            lastName: { $literal: seller.lastName },
            storeName: { $literal: seller.storeName },
            storeAvatar: { $literal: seller.storeAvatar },
            aboutStore: { $literal: seller.aboutStore },
            storeRating: { $literal: seller.stats ? seller.stats.averageRating : 0 },
            totalStoreReviews: { $literal: seller.stats ? seller.stats.totalReviews : 0 },
            isFollowing: { $literal: isFollowing },
            isFeatured: { $literal: seller.isFeatured || false }
          },
          images: { $first: '$images.url' },
          blipEngagement: {
            likesCount: {
              $size: {
                $cond: {
                  if: { $isArray: '$blips.likes' },
                  then: '$blips.likes',
                  else: []
                }
              }
            },
            commentsCount: {
              $size: {
                $cond: {
                  if: { $isArray: '$blips.comments' },
                  then: '$blips.comments',
                  else: []
                }
              }
            },
            viewCount: '$blips.viewCount'
          },
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
          },
          createdAt: '$blips.createdAt'
        }
      },
      // Sort by newest first
      { $sort: { createdAt: -1 } },
      // Skip and limit for pagination
      { $skip: (page - 1) * limit },
      { $limit: limit }
    ]);

    console.log(`Found ${blips.length} blips for seller`);

    const total = await Product.countDocuments({
      seller: sellerId,
      blips: { $exists: true, $ne: [] },
      $nor: [
        {
          status: 'offline_auction', 
          'auction.status': 'ended'
        }
      ],
      ...processedFilter
    });

    console.log(`Total blips count for seller: ${total}`);

    // Create seller object with isFollowing property
    const sellerResponse = {
      _id: seller._id,
      firstName: seller.firstName,
      lastName: seller.lastName,
      storeName: seller.storeName,
      storeAvatar: seller.storeAvatar,
      aboutStore: seller.aboutStore,
      storeRating: seller.stats ? seller.stats.averageRating : 0,
      totalStoreReviews: seller.stats ? seller.stats.totalReviews : 0,
      isFollowing
    };

    res.json({
      seller: sellerResponse,
      processedFilterApplied: Object.keys(processedFilter).length > 0,
      blips,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalBlips: total
    });
  } catch (error) {
    console.error('Detailed error in getSellerBlips:', error);
    res.status(500).json({ message: 'Failed to retrieve blips', error: error.message });
  }
};

// Get suggested blips based on user preferences or popular blips
exports.getSuggestedBlips = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;
    
    // Check if user is authenticated
    const buyerId = req.user?.id;
    const isAuthenticated = !!buyerId && req.user?.role === 'Buyer';
    
    console.log('Starting getSuggestedBlips aggregation...');
    
    // Define match stages
    const primaryMatchStage = {
      blips: { $exists: true, $ne: [] },
      blips: { $elemMatch: { processed: true } },
      $nor: [
        {
          status: 'offline_auction',
          'auction.status': 'ended'
        }
      ]
    };
    
    const fallbackMatchStage = {
      blips: { $exists: true, $ne: [] }
    };
    
    // Get buyer's preferred categories and followed sellers if authenticated
    let buyerCategories = [];
    let followedSellers = [];
    if (isAuthenticated) {
      console.log(`Getting preferences for buyer: ${buyerId}`);
      const buyer = await mongoose.model('Buyer').findById(buyerId).select('selectedCategories following');
      
      if (buyer && buyer.selectedCategories && buyer.selectedCategories.length > 0) {
        buyerCategories = buyer.selectedCategories.reduce((acc, cat) => {
          acc.push(cat.name);
          if (cat.subCategories) {
            acc.push(...cat.subCategories.map(sub => sub.name));
          }
          return acc;
        }, []);
        console.log(`Found preferred categories: ${buyerCategories.join(', ')}`);
      } else {
        console.log('No preferred categories found for buyer');
      }
      
      if (buyer && buyer.following) {
        followedSellers = buyer.following.map(follow => follow.sellerId.toString());
        console.log(`Found followed sellers: ${followedSellers.length}`);
      }
    }
    
    // Get total count for primary match stage
    let total = await mongoose.model('Product').countDocuments(primaryMatchStage);
    const poolSize = Math.max(10, Math.min(total, limit * 3));
    
    const now = new Date();
    
    // Common pipeline stages
    const commonPipeline = [
      {
        $addFields: {
          randomScore: { $rand: {} },
          daysSinceCreation: {
            $divide: [
              { $subtract: [now, { $ifNull: ["$blips.createdAt", now] }] },
              1000 * 60 * 60 * 24
            ]
          },
          engagementScore: {
            $add: [
              { $ifNull: ["$blips.viewCount", 0] },
              { $multiply: [{ $size: { $ifNull: ["$blips.likes", []] } }, 5] },
              { $multiply: [{ $size: { $ifNull: ["$blips.comments", []] } }, 10] }
            ]
          }
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
        $lookup: {
          from: 'buyers',
          localField: 'auction.currentHighestBid.buyer',
          foreignField: '_id',
          as: 'highestBidder'
        }
      },
      { $sort: { randomScore: -1 } },
      { $limit: poolSize },
      {
        $project: {
          _id: '$_id',
          blipId: '$blips._id',
          blipUrl: '$blips.url',
          processed: '$blips.processed',
          thumbnail: { 
            $ifNull: [
              '$blips.thumbnail', 
              'https://res.cloudinary.com/dljgzevaj/image/upload/v1742758888/sans-affiche_zu6wj4.png'
            ] 
          },
          productId: '$_id',
          productName: '$name',
          price: '$price',
          category: '$category',
          subCategory: '$subCategory',
          stock: '$stock',
          status: '$status',
          auctionInfo: {
            $cond: {
              if: { $eq: ['$status', 'offline_auction'] },
              then: {
                minBid: '$auction.minBid',
                maxBid: '$auction.maxBid',
                endOnMaxBid: '$auction.endOnMaxBid',
                startDate: '$auction.startDate',
                endDate: '$auction.endDate',
                status: '$auction.status',
                daysLeft: '$auction.daysLeft',
                currentHighestBid: {
                  amount: '$auction.currentHighestBid.amount',
                  buyer: {
                    _id: '$auction.currentHighestBid.buyer',
                    firstName: { $arrayElemAt: ['$highestBidder.firstName', 0] },
                    lastName: { $arrayElemAt: ['$highestBidder.lastName', 0] },
                    profileImage: { $arrayElemAt: ['$highestBidder.profileImage', 0] }
                  }
                },
                winner: {
                  buyer: '$auction.winner.buyer',
                  bidAmount: '$auction.winner.bidAmount',
                  winningDate: '$auction.winner.winningDate'
                },
                bidsCount: {
                  $cond: {
                    if: { $isArray: '$auction.bids' },
                    then: { $size: '$auction.bids' },
                    else: 0
                  }
                }
              },
              else: null
            }
          },
          discount: {
            isActive: '$discount.isActive',
            type: '$discount.type',
            value: '$discount.value',
            startDate: '$discount.startDate',
            endDate: '$discount.endDate',
            couponName: '$discount.couponName',
            discountedPrice: {
              $cond: {
                if: '$discount.isActive',
                then: {
                  $cond: {
                    if: { $eq: ['$discount.type', 'percentage'] },
                    then: { $round: [{ $multiply: ['$price', { $subtract: [1, { $divide: ['$discount.value', 100] }] }] }, 0] },
                    else: { $subtract: ['$price', '$discount.value'] }
                  }
                },
                else: '$price'
              }
            }
          },
          seller: {
            _id: '$sellerInfo._id',
            firstName: '$sellerInfo.firstName',
            lastName: '$sellerInfo.lastName',
            storeName: '$sellerInfo.storeName',
            storeAvatar: '$sellerInfo.storeAvatar',
            aboutStore: '$sellerInfo.aboutStore',
            storeRating: { $ifNull: ['$sellerInfo.stats.averageRating', 0] },
            totalStoreReviews: { $ifNull: ['$sellerInfo.stats.totalReviews', 0] },
            isFollowing: {
              $cond: {
                if: { $isArray: '$sellerInfo.followers' },
                then: {
                  $in: [
                    { $toObjectId: { $ifNull: [buyerId, null] } },
                    { $ifNull: ['$sellerInfo.followers.buyerId', []] }
                  ]
                },
                else: false
              }
            },
            isFeatured: { $ifNull: ['$sellerInfo.isFeatured', false] }
          },
          images: { $first: '$images.url' },
          blipEngagement: {
            likesCount: {
              $size: {
                $cond: {
                  if: { $isArray: '$blips.likes' },
                  then: '$blips.likes',
                  else: []
                }
              }
            },
            commentsCount: {
              $size: {
                $cond: {
                  if: { $isArray: '$blips.comments' },
                  then: '$blips.comments',
                  else: []
                }
              }
            },
            viewCount: '$blips.viewCount',
            isLiked: {
              $cond: {
                if: { $and: [isAuthenticated, { $isArray: '$blips.likes' }] },
                then: {
                  $in: [
                    { $toObjectId: { $ifNull: [buyerId, null] } },
                    '$blips.likes'
                  ]
                },
                else: false
              }
            }
          },
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
          },
          createdAt: '$blips.createdAt',
          daysSinceCreation: 1,
          engagementScore: 1
        }
      }
    ];
    
    // Primary pipeline
    const primaryPipeline = [
      { $match: primaryMatchStage },
      { $unwind: '$blips' },
      { $match: { 'blips.processed': true } },
      ...commonPipeline
    ];
    
    // Fetch blips with primary criteria
    let allBlips = await mongoose.model('Product').aggregate(primaryPipeline);
    
    // Fallback if no blips are found
    if (allBlips.length === 0) {
      console.log('No processed blips found, falling back to all blips');
      total = await mongoose.model('Product').countDocuments(fallbackMatchStage);
      const fallbackPipeline = [
        { $match: fallbackMatchStage },
        { $unwind: '$blips' },
        ...commonPipeline
      ];
      allBlips = await mongoose.model('Product').aggregate(fallbackPipeline);
    }
    
    // Handle case when no blips are found (should be rare with fallback)
    if (allBlips.length === 0) {
      return res.json({
        blips: [],
        isPersonalized: buyerCategories.length > 0,
        currentPage: page,
        totalPages: 0,
        totalBlips: 0
      });
    }
    
    // Process blips with additional metadata for categorization
    const transformedBlips = allBlips.map(blip => {
      const isInBuyerCategory = buyerCategories.length > 0 && 
        (buyerCategories.includes(blip.category) || buyerCategories.includes(blip.subCategory));
      const isFollowingSeller = followedSellers.includes(blip.seller._id.toString());
      
      blip._metadata = {
        isInBuyerCategory,
        isFollowingSeller: isFollowingSeller || blip.seller.isFollowing,
        engagementScore: blip.engagementScore,
        daysSinceCreation: blip.daysSinceCreation,
        isNewBlip: blip.daysSinceCreation < 7,
        isLowView: (blip.blipEngagement.viewCount || 0) < 50,
        sellerId: blip.seller._id.toString()
      };
      
      delete blip.daysSinceCreation;
      delete blip.engagementScore;
      
      return blip;
    });
    
    // Categorize blips
    const categorizedBlips = {
      newInBuyerCategory: [],
      followedSellers: [],
      highEngagement: [],
      undiscovered: [],
      random: []
    };
    
    transformedBlips.forEach(blip => {
      const meta = blip._metadata;
      delete blip._metadata;
      
      if (isAuthenticated && meta.isInBuyerCategory && meta.isNewBlip) {
        categorizedBlips.newInBuyerCategory.push(blip);
      } else if (isAuthenticated && meta.isFollowingSeller) {
        categorizedBlips.followedSellers.push(blip);
      } else if (meta.engagementScore > 100) {
        categorizedBlips.highEngagement.push(blip);
      } else if (meta.isLowView) {
        categorizedBlips.undiscovered.push(blip);
      } else {
        categorizedBlips.random.push(blip);
      }
    });
    
    // Shuffle each category
    Object.keys(categorizedBlips).forEach(category => {
      const array = categorizedBlips[category];
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
    });
    
    // Distribute blips
    const rearrangedBlips = [];
    const sellerTracker = new Map();
    const productTracker = new Map();
    const minSellerDistance = 3;
    
    const addBlipsFromCategory = (category, count) => {
      let added = 0;
      let index = 0;
      
      while (added < count && index < categorizedBlips[category].length) {
        const blip = categorizedBlips[category][index];
        const sellerId = blip.seller._id.toString();
        const productId = blip.productId.toString();
        
        if (productTracker.has(productId)) {
          index++;
          continue;
        }
        
        const lastPosition = sellerTracker.get(sellerId) || -minSellerDistance;
        if (rearrangedBlips.length - lastPosition >= minSellerDistance) {
          rearrangedBlips.push(blip);
          sellerTracker.set(sellerId, rearrangedBlips.length - 1);
          productTracker.set(productId, true);
          categorizedBlips[category].splice(index, 1);
          added++;
        } else {
          index++;
        }
        
        if (index >= categorizedBlips[category].length && added < count && categorizedBlips[category].length > 0) {
          index = 0;
          const blip = categorizedBlips[category][0];
          rearrangedBlips.push(blip);
          sellerTracker.set(blip.seller._id.toString(), rearrangedBlips.length - 1);
          productTracker.set(blip.productId.toString(), true);
          categorizedBlips[category].splice(0, 1);
          added++;
        }
      }
      
      return added;
    };
    
    const totalNeeded = limit;
    let remaining = totalNeeded;
    
    const categoryOrder = [
      'newInBuyerCategory',
      'highEngagement',
      'followedSellers',
      'undiscovered',
      'random'
    ];
    
    for (const category of categoryOrder) {
      if (remaining > 0 && categorizedBlips[category].length > 0) {
        const toAdd = Math.min(1, remaining, categorizedBlips[category].length);
        const added = addBlipsFromCategory(category, toAdd);
        remaining -= added;
      }
    }
    
    while (remaining > 0) {
      let addedAny = false;
      
      for (const category of categoryOrder) {
        if (remaining > 0 && categorizedBlips[category].length > 0) {
          const toAdd = Math.min(5, remaining, categorizedBlips[category].length);
          const added = addBlipsFromCategory(category, toAdd);
          remaining -= added;
          if (added > 0) addedAny = true;
        }
      }
      
      if (!addedAny) break;
    }
    
    if (remaining > 0) {
      const allRemaining = [].concat(...Object.values(categorizedBlips));
      for (let i = allRemaining.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allRemaining[i], allRemaining[j]] = [allRemaining[j], allRemaining[i]];
      }
      
      let index = 0;
      while (remaining > 0 && index < allRemaining.length) {
        const blip = allRemaining[index];
        const sellerId = blip.seller._id.toString();
        const productId = blip.productId.toString();
        
        if (productTracker.has(productId)) {
          index++;
          continue;
        }
        
        const lastPosition = sellerTracker.get(sellerId) || -minSellerDistance;
        if (rearrangedBlips.length - lastPosition >= minSellerDistance) {
          rearrangedBlips.push(blip);
          sellerTracker.set(sellerId, rearrangedBlips.length - 1);
          productTracker.set(productId, true);
          remaining--;
        }
        
        index++;
        
        if (index >= allRemaining.length && remaining > 0 && allRemaining.length > 0) {
          for (let i = 0; i < allRemaining.length; i++) {
            const blip = allRemaining[i];
            if (!productTracker.has(blip.productId.toString())) {
              rearrangedBlips.push(blip);
              productTracker.set(blip.productId.toString(), true);
              remaining--;
              break;
            }
          }
        }
      }
    }
    
    console.log(`Found ${rearrangedBlips.length} suggested blips with distribution algorithm`);
    
    res.json({
      blips: rearrangedBlips,
      isPersonalized: buyerCategories.length > 0,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalBlips: total
    });
  } catch (error) {
    console.error('Detailed error in getSuggestedBlips:', error);
    res.status(500).json({ 
      status: false,
      message: 'Failed to retrieve suggested blips', 
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

    res.json({
      products: products.map(product => ({
        ...product.toObject(),
        isLowStock: product.stock <= product.inventory.lowStockThreshold,
        hasDiscount: product.discount?.isActive || false,
        discountedPrice: product.discountedPrice,
        blips: product.blips,
        stock: product.stock,
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
      })),
      totalPages: Math.ceil(totalProducts / limit),
      currentPage: parseInt(page),
      totalProducts,
      filters: {
        minPrice,
        maxPrice,
        condition,
        status,
        visibility,
        sortBy
      }
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
      status: 'active',
      visibility: 'visible',
      stock: { $gt: 0 },
      status: { $ne: 'offline_auction' }
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
      status: 'active',
      visibility: 'visible',
      stock: { $gt: 0 },
      status: { $ne: 'offline_auction' }
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

// Toggle like on a blip
exports.toggleBlipLike = async (req, res) => {
  try {
    const { id, blipId } = req.params;
    const buyerId = req.user.id;

    // Add debug logging
    console.log('Debug - Processing like toggle:', {
      productId: id,
      blipId: blipId,
      buyerId: buyerId
    });

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(blipId)) {
      return res.status(400).json({ message: 'Invalid product or blip ID format' });
    }

    const product = await Product.findOne(
      { _id: id, "blips._id": new mongoose.Types.ObjectId(blipId) },
      { "blips.$": 1 }
    );

    if (!product || !product.blips || product.blips.length === 0) {
      console.log('Debug - Product or blip not found:', { id, blipId });
      return res.status(404).json({ message: 'Product or blip not found' });
    }

    const blip = product.blips[0];
    console.log('Debug - Found blip:', {
      blipId: blip._id,
      hasLikes: Array.isArray(blip.likes),
      likesCount: blip.likesCount || 0
    });

    // Ensure likes array exists
    const likes = Array.isArray(blip.likes) ? blip.likes : [];
    const likeIndex = likes.findIndex(like => like?.toString() === buyerId?.toString());

    console.log('Debug - Current like status:', {
      likeExists: likeIndex !== -1,
      currentLikes: blip.likesCount || 0,
      likeIndex
    });

    let updateOperation;
    if (likeIndex === -1) {
      // Add like
      updateOperation = {
        $addToSet: { "blips.$.likes": new mongoose.Types.ObjectId(buyerId) },
        $inc: { "blips.$.likesCount": 1 }
      };
    } else {
      // Remove like
      updateOperation = {
        $pull: { "blips.$.likes": new mongoose.Types.ObjectId(buyerId) },
        $inc: { "blips.$.likesCount": -1 }
      };
    }

    const result = await Product.updateOne(
      { _id: id, "blips._id": new mongoose.Types.ObjectId(blipId) },
      updateOperation
    );

    console.log('Debug - Update result:', result);

    if (result.modifiedCount === 0) {
      console.log('Debug - No document was modified');
      return res.status(400).json({ message: 'Failed to update like status' });
    }

    // Create notification for the seller when a blip is liked
    try {
      const notificationController = require('./notificationController');
      const Buyer = require('../models/Buyer');

      // Get buyer information
      const buyer = await Buyer.findById(buyerId).select('firstName lastName');
      const buyerName = buyer ? `${buyer.firstName} ${buyer.lastName}` : 'A buyer';

      // Get complete product info for notification since our current product object only has blips field
      const completeProduct = await Product.findById(id).select('name seller');
      if (!completeProduct) {
        throw new Error('Could not find complete product information');
      }

      // Create notification for seller
      await notificationController.createNotification(
        completeProduct.seller,
        'blip_like',
        {
          productId: completeProduct._id,
          productName: completeProduct.name,
          blipId: blipId,
          buyerId: buyerId,
          buyerName: buyerName
        }
      );

      console.log('Seller notification created for blip like');
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Continue execution even if notification fails
    }

    res.json({
      message: likeIndex === -1 ? 'Blip liked successfully' : 'Blip unliked successfully',
      liked: likeIndex === -1,
      likesCount: (blip.likesCount || 0) + (likeIndex === -1 ? 1 : -1)
    });

  } catch (error) {
    console.error('Toggle blip like error:', {
      error: error.message,
      stack: error.stack,
      params: req.params,
      user: req.user
    });
    res.status(500).json({
      message: 'Failed to toggle blip like',
      error: error.message
    });
  }
};

// Add comment to a blip
exports.addBlipComment = async (req, res) => {
  try {
    const { id, blipId } = req.params;
    const { comment } = req.body;
    const buyerId = req.user.id;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const blip = product.blips.id(blipId);
    if (!blip) {
      return res.status(404).json({ message: 'Blip not found' });
    }

    blip.comments.push({
      buyer: buyerId,
      comment
    });

    await product.save();

    // Create notification for the seller when a comment is added
    try {
      const notificationController = require('./notificationController');
      const Buyer = require('../models/Buyer');

      // Get buyer information
      const buyer = await Buyer.findById(buyerId).select('firstName lastName');
      const buyerName = buyer ? `${buyer.firstName} ${buyer.lastName}` : 'A buyer';

      // Create notification for seller
      await notificationController.createNotification(
        product.seller,
        'blip_comment',
        {
          productId: product._id,
          productName: product.name,
          blipId: blipId,
          buyerId: buyerId,
          buyerName: buyerName,
          comment: comment.length > 50 ? `${comment.substring(0, 47)}...` : comment
        }
      );

      console.log('Seller notification created for blip comment');

      // Send email notification to seller about the new comment
      try {
        const Seller = require('../models/Seller');
        const seller = await Seller.findById(product.seller);

        if (seller && seller.email) {
          await notificationController.sendBlipCommentEmail(
            seller,
            buyerName,
            product.name,
            comment
          );
          console.log('Blip comment email sent to seller:', seller.email);
        }
      } catch (emailError) {
        console.error('Failed to send blip comment email:', emailError);
      }

    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
    }

    res.status(201).json({
      message: 'Comment added successfully',
      commentsCount: blip.comments.length
    });

  } catch (error) {
    res.status(500).json({
      message: 'Failed to add comment',
      error: error.message
    });
  }
};

// Get comments for a product blip
exports.getBlipComments = async (req, res) => {
  try {
    console.log('Fetching blip comments for product:', req.params.id, 'blip:', req.params.blipId);
    const { id: productId, blipId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Check if user is authenticated and get userId/userType from JWT token
    const userId = req.user?.id;  // Use req.user.id from verifyToken middleware
    const userType = req.user?.role; // Use req.user.role from verifyToken middleware

    console.log('DEBUG: User auth in getBlipComments:', {
      isAuthenticated: !!req.user,
      user: req.user,
      userId,
      userType
    });

    // DEBUG: Show exact Auth header and token
    const authHeader = req.headers.authorization;
    console.log('DEBUG: Auth header:', {
      header: authHeader,
      hasToken: authHeader?.startsWith('Bearer ')
    });

    const token = authHeader?.split(' ')[1];
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.decode(token);
        console.log('DEBUG: Decoded token:', decoded);
      } catch (err) {
        console.error('DEBUG: Error decoding token:', err.message);
      }
    }

    const product = await Product.findById(productId);
    if (!product) {
      console.log('Product not found with ID:', productId);
      return res.status(404).json({ message: 'Product not found' });
    }

    const blip = product.blips.id(blipId);
    if (!blip) {
      console.log('Blip not found with ID:', blipId, 'in product:', productId);
      return res.status(404).json({ message: 'Blip not found' });
    }

    console.log('Found blip with', blip.comments.length, 'comments');

    // Get total comments count
    const totalComments = blip.comments.length;
    const totalPages = Math.ceil(totalComments / limit);

    // Get paginated comments
    const comments = blip.comments
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(skip, skip + limit);

    console.log('Processing', comments.length, 'comments after pagination');

    // Populate buyer information for each comment and their replies
    const populatedComments = await Promise.all(
      comments.map(async (comment) => {
        console.log('Processing comment ID:', comment._id);
        let populatedComment = comment.toObject();

        console.log(`DEBUG: Raw comment structure for ${comment._id}:`, JSON.stringify(comment));
        
        // Add isLiked field for authenticated users
        if (userId && userType) {
          // Debug the likes structure in detail
          console.log(`DEBUG: Comment ${comment._id} Likes Structure:`, {
            userId: userId,
            userIdType: typeof userId,
            userType: userType,
            likesCount: comment.likes ? comment.likes.length : 0,
          });
          
          // Extra log for detailed view of comment likes
          console.log(`DEBUG: All comment likes for ${comment._id}:`, JSON.stringify(comment.likes));
          
          // Inspect each like object's structure
          if (comment.likes && comment.likes.length > 0) {
            comment.likes.forEach((like, idx) => {
              const likeUserId = like.user ? like.user.toString() : (like._id ? like._id.toString() : 'none');
              
              console.log(`DEBUG: Like #${idx} exact structure:`, JSON.stringify(like));
              console.log(`DEBUG: Like #${idx} comparison:`, {
                likeUserId,
                requestUserId: userId.toString(),
                matches: likeUserId === userId.toString(),
                likeUserType: like.userType,
                requestUserType: userType,
                typeMatches: like.userType === userType
              });
            });
          }
          
          // Check all possible like formats in a much more detailed way
          let isLiked = false;
          let matchReason = 'none';
          
          // Loop through each like to find a match with detailed logging
          if (comment.likes && comment.likes.length > 0) {
            for (const like of comment.likes) {
              if (!like) continue;
              
              // Check user/userType format
              if (like.user && like.user.toString && like.userType) {
                const userMatches = like.user.toString() === userId.toString();
                const typeMatches = like.userType === userType;
                if (userMatches && typeMatches) {
                  isLiked = true;
                  matchReason = 'user/userType match';
                  break;
                }
              }
              
              // Check _id format
              if (like._id && like._id.toString) {
                if (like._id.toString() === userId.toString()) {
                  isLiked = true; 
                  matchReason = '_id match';
                  break;
                }
              }
              
              // Check string format
              if (typeof like === 'string') {
                if (like === userId.toString()) {
                  isLiked = true;
                  matchReason = 'string match';
                  break;
                }
              }
              
              // Check toString format
              if (like.toString && typeof like.toString === 'function') {
                if (like.toString() === userId.toString()) {
                  isLiked = true;
                  matchReason = 'toString match';
                  break;
                }
              }
            }
          }
          
          populatedComment.isLiked = isLiked;
          
          // Detailed debug for isLiked final result
          console.log(`DEBUG: Final isLiked determination for comment ${comment._id}:`, {
            userId: userId.toString(),
            userType: userType,
            isLiked: populatedComment.isLiked,
            matchReason: matchReason,
            commentsLikesCount: comment.likes ? comment.likes.length : 0
          });
          
        } else {
          populatedComment.isLiked = false;
        }
        
        // Populate comment author
        if (comment.buyer) {
          console.log('Fetching buyer info for comment:', comment._id);
          try {
            const buyer = await mongoose.model('Buyer').findById(comment.buyer)
              .select('firstName lastName profileImage');
            
            if (buyer) {
              console.log('Found buyer for comment:', buyer.firstName, buyer.lastName);
              populatedComment.buyer = buyer;
            } else {
              console.log('Buyer not found for comment with buyer ID:', comment.buyer);
            }
          } catch (err) {
            console.error('Error fetching buyer for comment:', err);
          }
        } else {
          console.log('No buyer ID for comment:', comment._id);
        }
        
        // Populate reply authors
        if (comment.replies && comment.replies.length > 0) {
          console.log('Processing', comment.replies.length, 'replies for comment:', comment._id);
          
          populatedComment.replies = await Promise.all(
            comment.replies.map(async (reply) => {
              console.log('Processing reply ID:', reply._id);
              let populatedReply = reply.toObject ? reply.toObject() : {...reply};
              
              // Add isLiked field for replies for authenticated users
              if (userId && userType) {
                // Debug the likes structure in detail
                console.log(`DEBUG: Reply ${reply._id} Likes Structure:`, {
                  userId: userId,
                  userIdType: typeof userId,
                  userType: userType,
                  likesCount: reply.likes ? reply.likes.length : 0,
                });
                
                // Inspect each like object's structure
                if (reply.likes && reply.likes.length > 0) {
                  reply.likes.forEach((like, idx) => {
                    console.log(`DEBUG: Reply Like #${idx} structure:`, {
                      likeObj: like,
                      likeObjType: typeof like,
                      hasUser: like.user !== undefined,
                      hasUserType: like.userType !== undefined,
                      has_id: like._id !== undefined,
                      userValue: like.user ? like.user.toString() : 'N/A',
                      _idValue: like._id ? like._id.toString() : 'N/A'
                    });
                  });
                }
                
                // Check both formats: new format with user/userType and old format with just _id
                populatedReply.isLiked = reply.likes && reply.likes.some(like => {
                  // Handle both formats: new structured likes and old format with just _id
                  if (like.user && like.user.toString && like.userType) {
                    const matches = like.user.toString() === userId.toString() && like.userType === userType;
                    console.log(`DEBUG: Checking reply like with user/userType:`, { 
                      likeUserId: like.user.toString(), 
                      userId: userId.toString(), 
                      usersMatch: like.user.toString() === userId.toString(),
                      likeUserType: like.userType,
                      userType: userType,
                      typesMatch: like.userType === userType, 
                      matches 
                    });
                    return matches;
                  } else if (like._id && like._id.toString) {
                    // Check if buyer is stored directly in the _id field (legacy format)
                    const matches = like._id.toString() === userId.toString();
                    console.log(`DEBUG: Checking reply like with _id:`, { 
                      likeId: like._id.toString(), 
                      userId: userId.toString(), 
                      matches 
                    });
                    return matches;
                  } else if (typeof like === 'string') {
                    const matches = like === userId.toString();
                    console.log(`DEBUG: Checking reply like as string:`, { 
                      likeString: like, 
                      userId: userId.toString(), 
                      matches 
                    });
                    return matches;
                  } else if (like.toString && typeof like.toString === 'function') {
                    const matches = like.toString() === userId.toString();
                    console.log(`DEBUG: Checking reply like with toString():`, { 
                      likeString: like.toString(), 
                      userId: userId.toString(), 
                      matches 
                    });
                    return matches;
                  }
                  return false;
                });
                
                // Debug the like checking result
                console.log(`DEBUG: Reply ${reply._id} isLiked result:`, {
                  userId: userId,
                  isLiked: populatedReply.isLiked
                });
              } else {
                populatedReply.isLiked = false;
              }
              
              // Handle both new structure (with user field) and old structure
              const replyUserId = reply.user || reply.buyer; // Try both fields
              const replyUserType = reply.userType || 'Buyer'; // Default to Buyer for old data
              
              if (replyUserId) {
                console.log('Fetching user info for reply:', reply._id, 'user type:', replyUserType);
                try {
                  const UserModel = mongoose.model(replyUserType);
                  const user = await UserModel.findById(replyUserId)
                    .select('firstName lastName profileImage storeName');
                  
                  if (user) {
                    console.log('Found user for reply:', user.firstName, user.lastName);
                    populatedReply.user = {
                      _id: user._id,
                      firstName: user.firstName,
                      lastName: user.lastName,
                      profileImage: user.profileImage
                    };
                    
                    if (replyUserType === 'Seller' && user.storeName) {
                      populatedReply.user.storeName = user.storeName;
                    }
                  } else {
                    console.log('User not found for reply with user ID:', replyUserId);
                  }
                } catch (err) {
                  console.error('Error fetching user for reply:', err);
                }
              } else {
                console.log('No user ID for reply:', reply._id);
                
                // For existing data without user info, try to add a placeholder
                populatedReply.user = {
                  _id: null,
                  firstName: "Unknown",
                  lastName: "User"
                };
              }
              
              return populatedReply;
            })
          );
        } else {
          console.log('No replies for comment:', comment._id);
        }
        
        return populatedComment;
      })
    );

    console.log('Successfully processed all comments and replies');
    
    return res.status(200).json({
      productId,
      blipId,
      comments: populatedComments,
      pagination: {
        total: totalComments,
        pages: totalPages,
        currentPage: page,
        hasMore: page < totalPages
      }
    });
  } catch (error) {
    console.error('Error getting blip comments:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Record blip view
exports.recordBlipView = async (req, res) => {
  try {
    const { id, blipId } = req.params;
    const userId = req.user.id;
    const userType = req.user.role === 'seller' ? 'Seller' : 'Buyer';

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const blip = product.blips.id(blipId);
    if (!blip) {
      return res.status(404).json({ message: 'Blip not found' });
    }

    // Check if user has viewed this blip before
    const existingView = blip.viewedBy.find(
      view => view.user.toString() === userId && view.userType === userType
    );

    if (existingView) {
      // Update last viewed time if it's been more than 1 hour since last view
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (existingView.lastViewed < oneHourAgo) {
        existingView.lastViewed = new Date();
        blip.viewCount += 1;
      }
    } else {
      // Add new view
      blip.viewedBy.push({
        user: userId,
        userType: userType,
        lastViewed: new Date()
      });
      blip.viewCount += 1;
    }

    await product.save();

    res.json({
      message: 'View recorded successfully',
      viewCount: blip.viewCount
    });
  } catch (error) {
    console.error('Error recording blip view:', error);
    res.status(500).json({
      message: 'Failed to record view',
      error: error.message
    });
  }
};

// Add reply to a blip comment
exports.addReplyToBlipComment = async (req, res) => {
  try {
    console.log('Adding reply to blip comment, params:', req.params);
    const { productId, blipId, commentId } = req.params;
    const { comment } = req.body;
    
    // Check if user is authenticated
    if (!req.user) {
      console.log('User not authenticated');
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Extract user information from the request
    const userId = req.user._id || req.user.id;
    
    // Get user type from role field
    const userType = req.user.role === 'Seller' ? 'Seller' : 'Buyer';
    
    console.log('User info:', { userId, userType, role: req.user.role });

    if (!userId) {
      console.log('Could not determine user ID');
      return res.status(400).json({ message: 'User information is missing' });
    }

    if (!comment) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      console.log('Product not found:', productId);
      return res.status(404).json({ message: 'Product not found' });
    }

    // if (userType === 'Seller' && product.seller.toString() !== userId.toString()) {
    //   console.log('Unauthorized: Seller does not own this product');
    //   return res.status(403).json({ message: 'As a seller, you can only reply to comments on your own products' });
    // }

    const blip = product.blips.id(blipId);
    if (!blip) {
      console.log('Blip not found:', blipId);
      return res.status(404).json({ message: 'Blip not found' });
    }

    const blipComment = blip.comments.id(commentId);
    if (!blipComment) {
      console.log('Comment not found:', commentId);
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Initialize replies array if it doesn't exist
    if (!blipComment.replies) {
      blipComment.replies = [];
    }

    // Get user details to include in response
    const UserModel = mongoose.model(userType);
    const userDetails = await UserModel.findById(userId)
      .select(userType === 'Seller' ? 'storeName storeAvatar' : 'firstName lastName profileImage');

    console.log('Found user details:', userDetails);

    if (!userDetails) {
      console.log('User details not found for ID:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    // Add the reply with proper user field
    const newReply = {
      user: userId,
      userType: userType,
      comment: comment,
      createdAt: new Date(),
      likes: [],
      likesCount: 0
    };
    
    blipComment.replies.push(newReply);
    console.log('Added new reply:', newReply);

    await product.save();
    console.log('Product saved with new reply');

    // Format the response with user details
    const replyResponse = {
      ...newReply,
      _id: blipComment.replies[blipComment.replies.length - 1]._id, // Get the generated ID
      user: {
        _id: userDetails._id,
        name: userType === 'Seller' ? userDetails.storeName : `${userDetails.firstName} ${userDetails.lastName}`,
        avatar: userType === 'Seller' ? userDetails.storeAvatar?.url : userDetails.profileImage?.url
      }
    };

    // Create notification for the comment owner if replier is not the comment owner
    try {
      if (blipComment.buyer.toString() !== userId.toString()) {
        const notificationController = require('./notificationController');
        const notificationType = userType === 'Seller' ? 'seller_reply_to_comment' : 'buyer_reply_to_comment';
        
        // Get replier name
        const replierName = userType === 'Seller' 
          ? userDetails.storeName 
          : `${userDetails.firstName} ${userDetails.lastName}`;
        
        // Create notification for comment owner
        await notificationController.createNotification(
          blipComment.buyer,
          notificationType,
          {
            productId: product._id,
            productName: product.name,
            blipId: blipId,
            commentId: commentId,
            replierId: userId,
            replierName: replierName,
            reply: comment.length > 50 ? `${comment.substring(0, 47)}...` : comment
          }
        );
        
        console.log('Comment owner notification created for reply');
      }
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Continue execution even if notification fails
    }

    return res.status(201).json({
      message: 'Reply added successfully',
      reply: replyResponse
    });
  } catch (error) {
    console.error('Error adding reply to blip comment:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Like a blip comment
exports.likeBlipComment = async (req, res) => {
  try {
    const { productId, blipId, commentId } = req.params;
    
    // Extract user ID from the JWT token - should always use req.user.id set by verifyToken
    const userId = req.user?.id;
    
    // Get userType from role field in the JWT token
    let userType = req.user?.role;
    
    // Print all user token data for debugging
    console.log('DEBUG: User token data in likeBlipComment:', {
      user: req.user,
      userId,
      userType
    });

    // Additional validation for required fields
    if (!userId) {
      console.error('DEBUG: Missing userId in likeBlipComment');
      return res.status(400).json({ message: 'User ID is required' });
    }

    if (!userType) {
      console.error('DEBUG: Missing userType in likeBlipComment');
      userType = 'Buyer'; // Default to Buyer if not specified
    }

    console.log('DEBUG: Like blip comment request:', {
      productId,
      blipId,
      commentId,
      userId: userId,
      userType
    });

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const blip = product.blips.id(blipId);
    if (!blip) {
      return res.status(404).json({ message: 'Blip not found' });
    }

    const comment = blip.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Initialize likes array if it doesn't exist
    if (!comment.likes) {
      comment.likes = [];
    }

    console.log('DEBUG: Current likes structure:', {
      likes: comment.likes,
      likesCount: comment.likes.length
    });

    // Check if user already liked the comment by inspecting all the possible formats
    let existingLikeIndex = -1;
    
    // Check both old and new formats
    for (let i = 0; i < comment.likes.length; i++) {
      const like = comment.likes[i];
      
      if (!like) {
        console.log(`DEBUG: Found null or undefined like at index ${i}`);
        continue;
      }
      
      // Debug each like's format
      console.log(`DEBUG: Checking existing like at index ${i}:`, like);
      
      if (like.user && like.user.toString && like.user.toString() === userId.toString() && like.userType === userType) {
        existingLikeIndex = i;
        console.log('DEBUG: Found matching like in user/userType format at index', i);
        break;
      } else if (like._id && like._id.toString && like._id.toString() === userId.toString()) {
        existingLikeIndex = i;
        console.log('DEBUG: Found matching like in _id format at index', i);
        break;
      } else if (typeof like === 'string' && like === userId.toString()) {
        existingLikeIndex = i;
        console.log('DEBUG: Found matching like in string format at index', i);
        break;
      } else if (like.toString && typeof like.toString === 'function' && like.toString() === userId.toString()) {
        existingLikeIndex = i;
        console.log('DEBUG: Found matching like in object.toString() format at index', i);
        break;
      }
    }

    console.log('DEBUG: Existing like index:', existingLikeIndex);

    if (existingLikeIndex !== -1) {
      // Unlike if already liked
      comment.likes.splice(existingLikeIndex, 1);
      comment.likesCount = comment.likes.length;
      await product.save();
      
      console.log('DEBUG: Like removed, new likes count:', comment.likesCount);
      return res.json({ 
        message: 'Comment unliked successfully', 
        liked: false, 
        likesCount: comment.likesCount 
      });
    } else {
      // Add like with complete information
      const newLike = {
        user: userId,
        userType: userType,
        createdAt: new Date()
      };
      
      console.log('DEBUG: Adding new like:', newLike);
      comment.likes.push(newLike);
      comment.likesCount = comment.likes.length;
      
      // Debug the updated likes array
      console.log('DEBUG: Updated likes array after adding:', JSON.stringify(comment.likes));
      
      await product.save();
      
      console.log('DEBUG: Like added, new likes count:', comment.likesCount);
      return res.json({ 
        message: 'Comment liked successfully', 
        liked: true, 
        likesCount: comment.likesCount 
      });
    }
  } catch (error) {
    console.error('Error liking blip comment:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Like a reply to a blip comment
exports.likeBlipCommentReply = async (req, res) => {
  try {
    const { productId, blipId, commentId, replyId } = req.params;
    
    // Extract user ID from the JWT token - should always use req.user.id set by verifyToken
    const userId = req.user?.id;
    
    // Get userType from role field in the JWT token
    let userType = req.user?.role;
    
    // Print all user token data for debugging
    console.log('DEBUG: User token data in likeBlipCommentReply:', {
      user: req.user,
      userId,
      userType
    });

    // Additional validation for required fields
    if (!userId) {
      console.error('DEBUG: Missing userId in likeBlipCommentReply');
      return res.status(400).json({ message: 'User ID is required' });
    }

    if (!userType) {
      console.error('DEBUG: Missing userType in likeBlipCommentReply');
      userType = 'Buyer'; // Default to Buyer if not specified
    }

    console.log('DEBUG: Like blip comment reply request:', {
      productId,
      blipId,
      commentId,
      replyId,
      userId: userId,
      userType
    });

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const blip = product.blips.id(blipId);
    if (!blip) {
      return res.status(404).json({ message: 'Blip not found' });
    }

    const comment = blip.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const reply = comment.replies.id(replyId);
    if (!reply) {
      return res.status(404).json({ message: 'Reply not found' });
    }

    // Initialize likes array if it doesn't exist
    if (!reply.likes) {
      reply.likes = [];
    }

    console.log('DEBUG: Current reply likes structure:', {
      likes: reply.likes,
      likesCount: reply.likes.length
    });

    // Check if user already liked the reply with detailed logging
    let existingLikeIndex = -1;
    
    // Check both old and new formats with detailed logging
    for (let i = 0; i < reply.likes.length; i++) {
      const like = reply.likes[i];
      
      if (!like) {
        console.log(`DEBUG: Found null or undefined like at index ${i}`);
        continue;
      }
      
      // Debug each like's format
      console.log(`DEBUG: Checking existing reply like at index ${i}:`, like);
      
      if (like.user && like.user.toString && like.user.toString() === userId.toString() && like.userType === userType) {
        existingLikeIndex = i;
        console.log('DEBUG: Found matching reply like in user/userType format at index', i);
        break;
      } else if (like._id && like._id.toString && like._id.toString() === userId.toString()) {
        existingLikeIndex = i;
        console.log('DEBUG: Found matching reply like in _id format at index', i);
        break;
      } else if (typeof like === 'string' && like === userId.toString()) {
        existingLikeIndex = i;
        console.log('DEBUG: Found matching reply like in string format at index', i);
        break;
      } else if (like.toString && typeof like.toString === 'function' && like.toString() === userId.toString()) {
        existingLikeIndex = i;
        console.log('DEBUG: Found matching reply like in object.toString() format at index', i);
        break;
      }
    }

    console.log('DEBUG: Existing reply like index:', existingLikeIndex);

    if (existingLikeIndex !== -1) {
      // Unlike if already liked
      reply.likes.splice(existingLikeIndex, 1);
      reply.likesCount = reply.likes.length;
      await product.save();
      
      console.log('DEBUG: Reply like removed, new likes count:', reply.likesCount);
      return res.json({ 
        message: 'Reply unliked successfully', 
        liked: false, 
        likesCount: reply.likesCount 
      });
    } else {
      // Add like with complete information
      const newLike = {
        user: userId,
        userType: userType,
        createdAt: new Date()
      };
      
      console.log('DEBUG: Adding new reply like:', newLike);
      reply.likes.push(newLike);
      reply.likesCount = reply.likes.length;
      
      // Debug the updated likes array
      console.log('DEBUG: Updated reply likes array after adding:', JSON.stringify(reply.likes));
      
      await product.save();
      
      console.log('DEBUG: Reply like added, new likes count:', reply.likesCount);
      return res.json({ 
        message: 'Reply liked successfully', 
        liked: true, 
        likesCount: reply.likesCount 
      });
    }
  } catch (error) {
    console.error('Error liking blip comment reply:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
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

// Get replies for a specific blip comment
exports.getBlipCommentReplies = async (req, res) => {
  try {
    const { productId, blipId, commentId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Check if user is authenticated and get userId/userType from JWT token
    const userId = req.user?.id;  // Use req.user.id from verifyToken middleware
    const userType = req.user?.role; // Use req.user.role from verifyToken middleware

    console.log('DEBUG: User auth in getBlipCommentReplies:', {
      isAuthenticated: !!req.user,
      user: req.user,
      userId,
      userType
    });

    // DEBUG: Show exact Auth header and token
    const authHeader = req.headers.authorization;
    console.log('DEBUG: Auth header in getBlipCommentReplies:', {
      header: authHeader,
      hasToken: authHeader?.startsWith('Bearer ')
    });

    const token = authHeader?.split(' ')[1];
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.decode(token);
        console.log('DEBUG: Decoded token in getBlipCommentReplies:', decoded);
      } catch (err) {
        console.error('DEBUG: Error decoding token in getBlipCommentReplies:', err.message);
      }
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const blip = product.blips.id(blipId);
    if (!blip) {
      return res.status(404).json({ message: 'Blip not found' });
    }

    const comment = blip.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    if (!comment.replies) {
      return res.status(404).json({ message: 'No replies found' });
    }

    // Get total replies count
    const totalReplies = comment.replies ? comment.replies.length : 0;
    const totalPages = Math.ceil(totalReplies / limit);

    // Get paginated replies
    const replies = comment.replies
      ? comment.replies
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(skip, skip + limit)
      : [];

    console.log('DEBUG: Processing', replies.length, 'replies after pagination');

    // Populate user information for each reply
    const populatedReplies = await Promise.all(
      replies.map(async (reply) => {
        console.log('DEBUG: Processing reply ID:', reply._id);
        
        // Add isLiked field for authenticated users
        let isLiked = false;
        
        console.log(`DEBUG: Raw reply structure for ${reply._id}:`, JSON.stringify(reply));
        
        if (userId && userType) {
          // Debug the likes structure in detail
          console.log(`DEBUG: Reply ${reply._id} Likes Structure:`, {
            userId: userId,
            userIdType: typeof userId,
            userType: userType,
            likesCount: reply.likes ? reply.likes.length : 0
          });
          
          // Extra log for detailed view of reply likes
          console.log(`DEBUG: All reply likes for ${reply._id}:`, JSON.stringify(reply.likes));
          
          // Inspect each like object's structure
          if (reply.likes && reply.likes.length > 0) {
            reply.likes.forEach((like, idx) => {
              const likeUserId = like.user ? like.user.toString() : (like._id ? like._id.toString() : 'none');
              
              console.log(`DEBUG: Reply like #${idx} exact structure:`, JSON.stringify(like));
              console.log(`DEBUG: Reply like #${idx} comparison:`, {
                likeUserId,
                requestUserId: userId.toString(),
                matches: likeUserId === userId.toString(),
                likeUserType: like.userType,
                requestUserType: userType,
                typeMatches: like.userType === userType
              });
            });
          }
          
          // Check all possible like formats in a much more detailed way
          let matchReason = 'none';
          
          // Loop through each like to find a match with detailed logging
          if (reply.likes && reply.likes.length > 0) {
            for (const like of reply.likes) {
              if (!like) continue;
              
              // Check user/userType format
              if (like.user && like.user.toString && like.userType) {
                const userMatches = like.user.toString() === userId.toString();
                const typeMatches = like.userType === userType;
                if (userMatches && typeMatches) {
                  isLiked = true;
                  matchReason = 'user/userType match';
                  break;
                }
              }
              
              // Check _id format
              if (like._id && like._id.toString) {
                if (like._id.toString() === userId.toString()) {
                  isLiked = true; 
                  matchReason = '_id match';
                  break;
                }
              }
              
              // Check string format
              if (typeof like === 'string') {
                if (like === userId.toString()) {
                  isLiked = true;
                  matchReason = 'string match';
                  break;
                }
              }
              
              // Check toString format
              if (like.toString && typeof like.toString === 'function') {
                if (like.toString() === userId.toString()) {
                  isLiked = true;
                  matchReason = 'toString match';
                  break;
                }
              }
            }
          }
          
          // Detailed debug for isLiked final result
          console.log(`DEBUG: Final isLiked determination for reply ${reply._id}:`, {
            userId: userId.toString(),
            userType: userType,
            isLiked: isLiked,
            matchReason: matchReason,
            replyLikesCount: reply.likes ? reply.likes.length : 0
          });
        }
        
        let userInfo;
        
        // Determine which model to use for populating user info
        if (reply.userType === 'Buyer') {
          try {
            userInfo = await mongoose.model('Buyer').findById(reply.user).select('firstName lastName avatar profileImage');
            if (!userInfo) {
              console.log(`DEBUG: Buyer not found with ID: ${reply.user}`);
              userInfo = { firstName: 'Unknown', lastName: 'User' };
            }
            return {
              _id: reply._id,
              user: {
                _id: userInfo._id || null,
                name: `${userInfo.firstName} ${userInfo.lastName}`,
                avatar: userInfo.profileImage?.url || userInfo.avatar || null // Include profile image, fallback to avatar
              },
              userType: reply.userType,
              comment: reply.comment,
              createdAt: reply.createdAt,
              likes: reply.likes,
              likesCount: reply.likesCount || 0,
              isLiked: isLiked
            };
          } catch (err) {
            console.error(`DEBUG: Error fetching buyer for reply:`, err);
            return {
              _id: reply._id,
              user: { _id: null, name: 'Unknown User', avatar: null },
              userType: reply.userType,
              comment: reply.comment,
              createdAt: reply.createdAt,
              likes: reply.likes,
              likesCount: reply.likesCount || 0,
              isLiked: isLiked
            };
          }
        } else {
          try {
            userInfo = await mongoose.model('Seller').findById(reply.user).select('storeName storeAvatar');
            if (!userInfo) {
              console.log(`DEBUG: Seller not found with ID: ${reply.user}`);
              userInfo = { storeName: 'Unknown Store' };
            }
            return {
              _id: reply._id,
              user: {
                _id: userInfo._id || null,
                name: userInfo.storeName,
                avatar: userInfo.storeAvatar?.url || null // Include store avatar
              },
              userType: reply.userType,
              comment: reply.comment,
              createdAt: reply.createdAt,
              likes: reply.likes,
              likesCount: reply.likesCount || 0,
              isLiked: isLiked
            };
          } catch (err) {
            console.error(`DEBUG: Error fetching seller for reply:`, err);
            return {
              _id: reply._id,
                              user: { 
                  _id: null, 
                  name: 'Unknown Store',
                  avatar: null
                },
              userType: reply.userType,
              comment: reply.comment,
              createdAt: reply.createdAt,
              likes: reply.likes,
              likesCount: reply.likesCount || 0,
              isLiked: isLiked
            };
          }
        }
      })
    );

    return res.json({
      replies: populatedReplies,
      pagination: {
        currentPage: page,
        totalPages,
        totalReplies,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching blip comment replies:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
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

// Get specific blip details
exports.getBlipDetails = async (req, res) => {
  try {
    const { id, blipId } = req.params;
    
    // Check if user is authenticated
    const buyerId = req.user?.id;
    const isAuthenticated = !!buyerId && req.user?.role === 'Buyer';

    // Debug logging
    console.log('Debug - Fetching blip details:', {
      productId: id,
      blipId
    });

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(blipId)) {
      return res.status(400).json({ message: 'Invalid product or blip ID format' });
    }

    // Get the specific blip with aggregation to match getAllBlips structure
    const blips = await Product.aggregate([
      // Match the specific product and blip
      { 
        $match: { 
          _id: new mongoose.Types.ObjectId(id),
          "blips._id": new mongoose.Types.ObjectId(blipId)
        }
      },
      // Unwind the blips array
      { $unwind: '$blips' },
      // Match the specific blip
      { 
        $match: { 
          "blips._id": new mongoose.Types.ObjectId(blipId)
        }
      },
      // Lookup seller information
      {
        $lookup: {
          from: 'sellers',
          localField: 'seller',
          foreignField: '_id',
          as: 'sellerInfo'
        }
      },
      { $unwind: '$sellerInfo' },
      // Lookup auction bidder information
      {
        $lookup: {
          from: 'buyers',
          localField: 'auction.currentHighestBid.buyer',
          foreignField: '_id',
          as: 'highestBidder'
        }
      },
      // Project needed fields
      {
        $project: {
          _id: '$_id', // This is the product ID
          blipId: '$blips._id', // Add this line to include the blip ID
          blipUrl: '$blips.url',
          processed: '$blips.processed',
          thumbnail: { 
            $ifNull: [
              '$blips.thumbnail', 
              'https://res.cloudinary.com/dljgzevaj/image/upload/v1742758888/sans-affiche_zu6wj4.png'
            ] 
          },
          productId: '$_id',
          productName: '$name',
          price: '$price',
          stock: '$stock',
          status: '$status',
          auctionInfo: {
            $cond: {
              if: { $eq: ['$status', 'offline_auction'] },
              then: {
                minBid: '$auction.minBid',
                maxBid: '$auction.maxBid',
                endOnMaxBid: '$auction.endOnMaxBid',
                startDate: '$auction.startDate',
                endDate: '$auction.endDate',
                status: '$auction.status',
                daysLeft: '$auction.daysLeft',
                currentHighestBid: {
                  amount: '$auction.currentHighestBid.amount',
                  buyer: {
                    _id: '$auction.currentHighestBid.buyer',
                    firstName: { $arrayElemAt: ['$highestBidder.firstName', 0] },
                    lastName: { $arrayElemAt: ['$highestBidder.lastName', 0] },
                    profileImage: { $arrayElemAt: ['$highestBidder.profileImage', 0] }
                  }
                },
                winner: {
                  buyer: '$auction.winner.buyer',
                  bidAmount: '$auction.winner.bidAmount',
                  winningDate: '$auction.winner.winningDate'
                },
                bidsCount: {
                  $cond: {
                    if: { $isArray: '$auction.bids' },
                    then: { $size: '$auction.bids' },
                    else: 0
                  }
                }
              },
              else: null
            }
          },
          discount: {
            isActive: '$discount.isActive',
            type: '$discount.type',
            value: '$discount.value',
            startDate: '$discount.startDate',
            endDate: '$discount.endDate',
            couponName: '$discount.couponName',
            discountedPrice: {
              $cond: {
                if: '$discount.isActive',
                then: {
                  $cond: {
                    if: { $eq: ['$discount.type', 'percentage'] },
                    then: { $round: [{ $multiply: ['$price', { $subtract: [1, { $divide: ['$discount.value', 100] }] }] }, 0] },
                    else: { $subtract: ['$price', '$discount.value'] }
                  }
                },
                else: '$price'
              }
            }
          },
          seller: {
            _id: '$sellerInfo._id',
            firstName: '$sellerInfo.firstName',
            lastName: '$sellerInfo.lastName',
            storeName: '$sellerInfo.storeName',
            storeAvatar: '$sellerInfo.storeAvatar',
            aboutStore: '$sellerInfo.aboutStore',
            storeRating: { $ifNull: ['$sellerInfo.stats.averageRating', 0] },
            totalStoreReviews: { $ifNull: ['$sellerInfo.stats.totalReviews', 0] },
            isFollowing: {
              $cond: {
                if: { $isArray: '$sellerInfo.followers' },
                then: {
                  $in: [
                    { $toObjectId: { $ifNull: [buyerId, null] } },
                    { $ifNull: ['$sellerInfo.followers.buyerId', []] }
                  ]
                },
                else: false
              }
            },
            isFeatured: { $ifNull: ['$sellerInfo.isFeatured', false] }
          },
          images: { $first: '$images.url' },
          blipEngagement: {
            likesCount: {
              $size: {
                $cond: {
                  if: { $isArray: '$blips.likes' },
                  then: '$blips.likes',
                  else: []
                }
              }
            },
            commentsCount: {
              $size: {
                $cond: {
                  if: { $isArray: '$blips.comments' },
                  then: '$blips.comments',
                  else: []
                }
              }
            },
            viewCount: '$blips.viewCount',
            isLiked: {
              $cond: {
                if: { $and: [isAuthenticated, { $isArray: '$blips.likes' }] },
                then: {
                  $in: [
                    { $toObjectId: { $ifNull: [buyerId, null] } },
                    '$blips.likes'
                  ]
                },
                else: false
              }
            }
          },
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
          },
          createdAt: '$blips.createdAt'
        }
      }
    ]);

    // If no blip found
    if (!blips || blips.length === 0) {
      console.log('Debug - Product or blip not found:', { id, blipId });
      return res.status(404).json({ message: 'Product or blip not found' });
    }

    // Get the single blip
    const processedBlip = blips[0];

    res.json({
      blips: [processedBlip]
    });
  } catch (error) {
    console.error('Error in getBlipDetails:', error);
    res.status(500).json({ message: 'Failed to retrieve blip details', error: error.message });
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

exports.getPersonalizedBlips = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    // Generate or get session ID (use existing session or create new one)
    // For authenticated users, use a more stable session ID
    const sessionId = req.query.sessionId || 
                     (req.user?.id ? `user_${req.user.id}_blips` : `anon_${Math.random().toString(36).substr(2, 9)}`);

    console.log(`🔍 [BLIPS DEBUG] Session ID: ${sessionId}, Page: ${page}, Limit: ${limit}`);

    // Reset session if user goes back to page 1 (treat as fresh browsing session)
    if (page === 1 && sessionBlipStore.has(sessionId)) {
      console.log(`🔄 [BLIPS DEBUG] Page 1 requested - resetting session for fresh start`);
      sessionBlipStore.delete(sessionId);
    }

    // Get or initialize seen blips for this session
    if (!sessionBlipStore.has(sessionId)) {
      // Check if we're at session limit to prevent memory issues
      if (sessionBlipStore.size >= MAX_SESSIONS) {
        console.log(`⚠️ [BLIPS DEBUG] Session limit reached (${MAX_SESSIONS}), forcing cleanup`);
        // Remove oldest sessions
        const sortedSessions = Array.from(sessionBlipStore.entries())
          .sort((a, b) => a[1].lastAccess - b[1].lastAccess);
        
        const sessionsToRemove = sortedSessions.slice(0, Math.floor(MAX_SESSIONS * 0.2));
        sessionsToRemove.forEach(([id]) => sessionBlipStore.delete(id));
        console.log(`🧹 [BLIPS DEBUG] Removed ${sessionsToRemove.length} oldest sessions`);
      }
      
      sessionBlipStore.set(sessionId, { seenBlipIds: [], lastAccess: Date.now(), lastPage: 0 });
      console.log(`🆕 [BLIPS DEBUG] Created new session for: ${sessionId}`);
    } else {
      console.log(`♻️ [BLIPS DEBUG] Using existing session: ${sessionId}`);
    }
    
    const sessionData = sessionBlipStore.get(sessionId);
    sessionData.lastAccess = Date.now();
    
    // Check if user is going backwards (lower page than before) - reset session for better UX
    if (sessionData.lastPage && page < sessionData.lastPage) {
      console.log(`⬅️ [BLIPS DEBUG] Backward navigation detected: Page ${sessionData.lastPage} → Page ${page}. Resetting session.`);
      sessionData.seenBlipIds = [];
      sessionData.lastPage = page;
    } else {
      // Update last page for forward navigation
      sessionData.lastPage = Math.max(sessionData.lastPage || 0, page);
    }
    let seenBlipIds = sessionData.seenBlipIds;
    
    // Limit seen blips per session to prevent performance issues
    if (seenBlipIds.length > MAX_SEEN_BLIPS_PER_SESSION) {
      seenBlipIds = seenBlipIds.slice(-MAX_SEEN_BLIPS_PER_SESSION);
      sessionData.seenBlipIds = seenBlipIds;
      console.log(`✂️ [BLIPS DEBUG] Trimmed session to last ${MAX_SEEN_BLIPS_PER_SESSION} seen blips`);
    }
    
    console.log(`📝 [BLIPS DEBUG] Current seen blips count: ${seenBlipIds.length}`);
    console.log(`📄 [BLIPS DEBUG] Last page visited: ${sessionData.lastPage}, Current page: ${page}`);
    if (seenBlipIds.length > 0) {
      console.log(`📝 [BLIPS DEBUG] First 5 seen blip IDs: ${seenBlipIds.slice(0, 5).join(', ')}`);
    }

    const primaryMatchStage = {
      $and: [
        { 'blips.0': { $exists: true } },
        { blips: { $elemMatch: { processed: true } } },
        {
          $or: [
            { status: { $ne: 'offline_auction' } },
            {
              $and: [
                { status: 'offline_auction' },
                { 'auction.status': { $ne: 'ended' } },
                { 'auction.endDate': { $gt: new Date() } }
              ]
            }
          ]
        }
      ]
    };

    const fallbackMatchStage = {
      'blips.0': { $exists: true },
      status: 'active'
    };

    const buyerId = req.user?.id;
    const isAuthenticated = !!buyerId && req.user?.role === 'Buyer';

    let followedSellers = [];

    if (isAuthenticated) {
      const buyer = await Buyer.findById(buyerId).select('following');

      if (buyer?.following?.length > 0) {
        followedSellers = buyer.following.map(f => f.sellerId.toString());
      }
    }

    // Count all products that have at least one blip
    let total = await Product.countDocuments({ 'blips.0': { $exists: true } });
    
    const poolSize = Math.max(10, Math.min(total, limit * 3));
    const now = new Date();

    const commonPipeline = [
      {
        $addFields: {
          randomScore: { $rand: {} },
          daysSinceCreation: {
            $divide: [
              { $subtract: [now, { $ifNull: ["$blips.createdAt", now] }] },
              1000 * 60 * 60 * 24
            ]
          },
          engagementScore: {
            $add: [
              { $ifNull: ["$blips.viewCount", 0] },
              { $multiply: [{ $ifNull: ["$blips.likesCount", 0] }, 5] },
              { $multiply: [{ $ifNull: ["$blips.commentsCount", 0] }, 10] }
            ]
          }
        }
      },
      { $sort: { randomScore: -1 } },
      { $limit: poolSize },
      {
        $project: {
          _id: 1,
          name: 1,
          price: 1,
          stock: 1,
          status: 1,
          category: 1,
          subCategory: 1,
          seller: 1,
          discount: 1,
          auction: 1,
          images: { $arrayElemAt: ["$images.url", 0] },
          blip: "$blips",
          reviews: 1,
          createdAt: 1,
          daysSinceCreation: 1,
          engagementScore: 1
        }
      }
    ];

    // Convert seen blip IDs to ObjectIds for MongoDB comparison
    const mongoose = require('mongoose');
    const seenBlipObjectIds = seenBlipIds.length > 0 ? seenBlipIds.map(id => {
      try {
        return new mongoose.Types.ObjectId(id);
      } catch (e) {
        console.log(`⚠️ [BLIPS DEBUG] Invalid ObjectId: ${id} - removing from session`);
        return null;
      }
    }).filter(id => id !== null) : [];

    // If we had invalid ObjectIds, clean them from the session
    if (seenBlipObjectIds.length < seenBlipIds.length) {
      const validIds = seenBlipObjectIds.map(id => id.toString());
      sessionData.seenBlipIds = validIds;
      console.log(`🧹 [BLIPS DEBUG] Cleaned invalid ObjectIds from session`);
    }

    // Log exclusion match stage details
    const exclusionMatchStage = seenBlipObjectIds.length > 0 ? { $match: { 'blips._id': { $nin: seenBlipObjectIds } } } : null;
    if (exclusionMatchStage) {
      console.log(`🚫 [BLIPS DEBUG] Excluding ${seenBlipObjectIds.length} blip ObjectIds from query`);
      console.log(`🚫 [BLIPS DEBUG] String IDs: ${seenBlipIds.slice(0, 3).join(', ')}`);
      console.log(`🚫 [BLIPS DEBUG] ObjectIds: ${seenBlipObjectIds.slice(0, 3).map(id => id.toString()).join(', ')}`);
    }

    const primaryPipeline = [
      { $match: primaryMatchStage },
      { $unwind: "$blips" },
      { $match: { "blips.processed": true } },
      ...(exclusionMatchStage ? [exclusionMatchStage] : []),
      ...commonPipeline
    ];

    console.log(`🔎 [BLIPS DEBUG] Executing primary pipeline with ${seenBlipObjectIds.length} exclusions...`);
    let products;
    try {
      products = await Product.aggregate(primaryPipeline).exec();
    } catch (dbError) {
      console.error(`❌ [BLIPS DEBUG] Database error in primary pipeline:`, dbError.message);
      // Fallback to query without exclusions if there's a DB error
      const simplePipeline = [
        { $match: primaryMatchStage },
        { $unwind: "$blips" },
        { $match: { "blips.processed": true } },
        ...commonPipeline
      ];
      products = await Product.aggregate(simplePipeline).exec();
      console.log(`🔄 [BLIPS DEBUG] Used fallback pipeline without exclusions due to DB error`);
    }
    
    console.log(`📊 [BLIPS DEBUG] Primary pipeline returned: ${products.length} products`);
    if (products.length > 0) {
      const blipIds = products.slice(0, 3).map(p => p.blip._id.toString());
      console.log(`📊 [BLIPS DEBUG] First 3 blip IDs from primary: ${blipIds.join(', ')}`);
      
      // Check if any returned blips were in the exclusion list (this shouldn't happen)
      const duplicates = blipIds.filter(id => seenBlipIds.includes(id));
      if (duplicates.length > 0) {
        console.log(`🚨 [BLIPS DEBUG] ERROR: Found duplicate blips in primary results: ${duplicates.join(', ')}`);
      }
    }

    if (products.length === 0) {
      console.log('❌ [BLIPS DEBUG] No primary blips, falling back to general pool');

      const fallbackPipeline = [
        { $match: fallbackMatchStage },
        { $unwind: "$blips" },
        ...(exclusionMatchStage ? [exclusionMatchStage] : []),
        ...commonPipeline
      ];

      console.log(`🔎 [BLIPS DEBUG] Executing fallback pipeline with ${seenBlipObjectIds.length} exclusions...`);
      try {
        products = await Product.aggregate(fallbackPipeline).exec();
      } catch (dbError) {
        console.error(`❌ [BLIPS DEBUG] Database error in fallback pipeline:`, dbError.message);
        // Final fallback to simple query without exclusions
        const simpleFallbackPipeline = [
          { $match: fallbackMatchStage },
          { $unwind: "$blips" },
          ...commonPipeline
        ];
        products = await Product.aggregate(simpleFallbackPipeline).exec();
        console.log(`🔄 [BLIPS DEBUG] Used simple fallback without exclusions due to DB error`);
      }
      console.log(`📊 [BLIPS DEBUG] Fallback pipeline returned: ${products.length} products`);
      
      if (products.length > 0) {
        const blipIds = products.slice(0, 3).map(p => p.blip._id.toString());
        console.log(`📊 [BLIPS DEBUG] First 3 blip IDs from fallback: ${blipIds.join(', ')}`);
        
        // Check if any returned blips were in the exclusion list (this shouldn't happen)
        const duplicates = blipIds.filter(id => seenBlipIds.includes(id));
        if (duplicates.length > 0) {
          console.log(`🚨 [BLIPS DEBUG] ERROR: Found duplicate blips in fallback results: ${duplicates.join(', ')}`);
        }
      }
    }

    await Product.populate(products, {
      path: 'seller',
      select: 'firstName lastName storeName storeAvatar aboutStore stats isFeatured followers'
    });

    if (products.length === 0) {
      return res.json({
        blips: [],
        currentPage: page,
        totalPages: 0,
        totalBlips: 0
      });
    }

    const transformedBlips = products.map(product => {
      const isFollowing = product.seller.followers && buyerId
        ? product.seller.followers.some(follower =>
            follower.buyerId?.toString() === buyerId.toString())
        : false;

      const isLiked = isAuthenticated && product.blip.likes
        ? product.blip.likes.some(like => like.toString() === buyerId)
        : false;

      return {
        discount: {
          isActive: product.discount?.isActive || false,
          type: product.discount?.type || "percentage",
          value: product.discount?.value || 0,
          discountedPrice: product.discount?.discountedPrice || product.price
        },
        _id: product._id,
        blipId: product.blip._id,
        blipUrl: product.blip.url,
        thumbnail: product.blip.thumbnail || 'https://res.cloudinary.com/dljgzevaj/image/upload/v1742758888/sans-affiche_zu6wj4.png',
        processed: product.blip.processed,
        productId: product._id,
        productName: product.name,
        price: product.price,
        stock: product.stock,
        status: product.status,
        auctionInfo: product.status === 'offline_auction' ? {
          minBid: product.auction?.minBid,
          maxBid: product.auction?.maxBid,
          endOnMaxBid: product.auction?.endOnMaxBid,
          startDate: product.auction?.startDate,
          endDate: product.auction?.endDate,
          status: product.auction?.status,
          daysLeft: product.auction?.daysLeft,
          currentHighestBid: product.auction?.currentHighestBid,
          winner: product.auction?.winner,
          bidsCount: product.auction?.bids?.length || 0
        } : null,
        images: product.images,
        blipEngagement: {
          likesCount: product.blip.likesCount || 0,
          commentsCount: product.blip.commentsCount || 0,
          viewCount: product.blip.viewCount || 0,
          isLiked
        },
        averageRating: product.reviews?.length > 0
          ? product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length
          : null,
        reviewCount: product.reviews?.length || 0,
        createdAt: product.blip.createdAt,
        seller: {
          _id: product.seller._id,
          firstName: product.seller.firstName,
          lastName: product.seller.lastName,
          storeName: product.seller.storeName,
          storeAvatar: product.seller.storeAvatar,
          aboutStore: product.seller.aboutStore,
          storeRating: product.seller.stats?.averageRating || 0,
          totalStoreReviews: product.seller.stats?.totalReviews || 0,
          isFollowing,
          isFeatured: product.seller.isFeatured
        },
        _metadata: {
          isFollowingSeller: isFollowing || followedSellers.includes(product.seller._id.toString()),
          engagementScore: product.engagementScore,
          daysSinceCreation: product.daysSinceCreation,
          isNewBlip: product.daysSinceCreation < 7,
          isLowView: (product.blip.viewCount || 0) < 50,
          sellerId: product.seller._id.toString()
        }
      };
    });

    // Simple categorization without buyer categories
    const categorizedBlips = {
      followedSellers: [],
      highEngagement: [],
      undiscovered: [],
      random: []
    };

    transformedBlips.forEach(blip => {
      const meta = blip._metadata;
      delete blip._metadata;

      if (isAuthenticated && meta.isFollowingSeller) {
        categorizedBlips.followedSellers.push(blip);
      } else if (meta.engagementScore > 100) {
        categorizedBlips.highEngagement.push(blip);
      } else if (meta.isLowView) {
        categorizedBlips.undiscovered.push(blip);
      } else {
        categorizedBlips.random.push(blip);
      }
    });

    // Shuffle each category
    Object.keys(categorizedBlips).forEach(category => {
      const array = categorizedBlips[category];
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
    });

    // Create a balanced distribution algorithm
    function createBalancedBlipDistribution(categorizedBlips, totalNeeded) {
      const allBlips = [
        ...categorizedBlips.followedSellers,
        ...categorizedBlips.highEngagement,
        ...categorizedBlips.undiscovered,
        ...categorizedBlips.random
      ];

      // Group blips by seller
      const blipsBySeller = {};
      allBlips.forEach(blip => {
        const sellerId = blip.seller._id.toString();
        if (!blipsBySeller[sellerId]) {
          blipsBySeller[sellerId] = [];
        }
        blipsBySeller[sellerId].push(blip);
      });

      const sellerIds = Object.keys(blipsBySeller);
      const result = [];
      const seenProducts = new Set();
      let lastUsedSellers = [];
      const maxConsecutiveFromSameSeller = 1;
      
      // Algorithm: Round-robin through sellers to avoid clustering
      while (result.length < totalNeeded && sellerIds.length > 0) {
        // Find sellers that haven't been used recently and still have blips
        let availableSellers = sellerIds.filter(sellerId => 
          !lastUsedSellers.includes(sellerId) && 
          blipsBySeller[sellerId].length > 0
        );

        // If no sellers available (all recently used), reset the restriction
        if (availableSellers.length === 0) {
          availableSellers = sellerIds.filter(sellerId => blipsBySeller[sellerId].length > 0);
          lastUsedSellers = [];
        }

        // If still no sellers available, we've exhausted all blips
        if (availableSellers.length === 0) break;

        // Pick a random seller from available ones
        const randomIndex = Math.floor(Math.random() * availableSellers.length);
        const selectedSellerId = availableSellers[randomIndex];
        
        // Get the next blip from this seller
        const blip = blipsBySeller[selectedSellerId].shift();
        
        // Only add if we haven't seen this product before
        if (!seenProducts.has(blip.productId.toString())) {
          result.push(blip);
          seenProducts.add(blip.productId.toString());
        } else {
          console.log(`🔄 [BLIPS DEBUG] Skipped duplicate product in distribution: ${blip.productName} (${blip.productId})`);
        }

        // Track recently used sellers (keep last 3-5 sellers to avoid immediate repetition)
        lastUsedSellers.push(selectedSellerId);
        if (lastUsedSellers.length > Math.min(5, Math.ceil(sellerIds.length / 2))) {
          lastUsedSellers.shift();
        }

        // Remove seller if they have no more blips
        if (blipsBySeller[selectedSellerId].length === 0) {
          const index = sellerIds.indexOf(selectedSellerId);
          if (index > -1) {
            sellerIds.splice(index, 1);
          }
        }
      }

      return result;
    }

    const finalBlips = createBalancedBlipDistribution(categorizedBlips, limit);

    // Extract the blip IDs from the final result to add to seen blips
    const newlySeenBlipIds = finalBlips.map(blip => blip.blipId.toString());
    console.log(`➕ [BLIPS DEBUG] Adding ${newlySeenBlipIds.length} new blip IDs to session`);
    console.log(`➕ [BLIPS DEBUG] New blip IDs: ${newlySeenBlipIds.slice(0, 3).join(', ')}${newlySeenBlipIds.length > 3 ? '...' : ''}`);

    // Final check: ensure no duplicates in the final result
    const duplicatesInResult = newlySeenBlipIds.filter(id => seenBlipIds.includes(id));
    if (duplicatesInResult.length > 0) {
      console.log(`🚨 [BLIPS DEBUG] CRITICAL ERROR: Found duplicates in final result: ${duplicatesInResult.join(', ')}`);
      console.log(`🚨 [BLIPS DEBUG] This indicates the MongoDB exclusion is not working properly`);
    } else {
      console.log(`✅ [BLIPS DEBUG] No duplicates found in final result - exclusion working correctly`);
    }

    // Add the newly seen blip IDs to the session
    sessionData.seenBlipIds = [...sessionData.seenBlipIds, ...newlySeenBlipIds];
    sessionData.lastPage = page; // Update the last page accessed
    console.log(`✅ [BLIPS DEBUG] Session now has ${sessionData.seenBlipIds.length} total seen blips`);

    // Log some final stats
    console.log(`📤 [BLIPS DEBUG] Returning ${finalBlips.length} blips for page ${page}`);
    if (finalBlips.length > 0) {
      console.log(`📤 [BLIPS DEBUG] First blip product: ${finalBlips[0].productName} (ID: ${finalBlips[0].blipId})`);
    }

    res.json({
      blips: finalBlips,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalBlips: total,
      sessionId: sessionId // Return session ID so frontend can use it for subsequent requests
    });

  } catch (error) {
    console.error('Error in getPersonalizedBlips:', error);
    res.status(500).json({
      status: false,
      message: 'Failed to fetch personalized blips',
      error: error.message
    });
  }
};


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

// Add a new blip video to an existing product
exports.addBlipToProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const sellerId = req.user.id;

    // Validate product ID format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID format' });
    }

    // Find product and verify seller ownership
    const product = await Product.findOne({ _id: productId, seller: sellerId });
    if (!product) {
      return res.status(404).json({ message: 'Product not found or you do not have permission to modify it' });
    }

    // Validate if blip videos are provided
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No blip video files uploaded' });
    }

    // Check if adding these blips would exceed the limit (max 5 total)
    const currentBlipsCount = product.blips ? product.blips.length : 0;
    const newBlipsCount = req.files.length;
    
    if (currentBlipsCount + newBlipsCount > 5) {
      return res.status(400).json({ 
        message: `Cannot add ${newBlipsCount} blips. Maximum allowed is 5 and product already has ${currentBlipsCount} blips.` 
      });
    }

    // Process each uploaded blip
    const newBlips = []
    
    for (const file of req.files) {
      // Generate unique file names
      const videoKey = productBlips.GenerateUniqueFileName(sellerId, product._id)
      
      // Extract fileName from filename without extension
      const fileName = productBlips.ExtractFilenameFromS3Path(videoKey);
      
      // Upload the video to S3
      const uploadParameters = {
        Bucket: process.env.RAW_BLIPS_S3_BUCKET,
        Key: videoKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      };
      await s3.upload(uploadParameters).promise();
      
      try {
        // Create the new blip object
        const newBlip = {
          url: '', // set this to empty string for now because model doesn't allow null values
          contentType: file.mimetype,
          thumbnail: '', // set this to empty string for now because model doesn't allow null values
          key: fileName,
          processed: false, // initially set to false beecause processing will be done later by Lambda and Amazon MediaConvert
          createdAt: new Date()
        };
        
        // Add the new blip to the product's blips array and our response array
        product.blips.push(newBlip);
        newBlips.push(newBlip);
        
      } catch (err) {
        console.error('Error creating new blip object:', err);
      }
    }
    
    // Save the product with all new blips
    await product.save();
    
    // Return the updated product with the new blips
    return res.status(201).json({
      success: true,
      message: `${newBlips.length} blip videos added successfully`,
      blips: newBlips
    });
    
  } catch (error) {
    console.error('Error adding blips to product:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to add blips to product', 
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

/**
 * Get related blips based on a specific blip ID
 * If no related blips are found, it returns random blips
 * @param {Object} req - request object with blipId
 * @param {Object} res - response object
 * @returns {Object} related or random blips
 */
exports.getRelatedBlips = async (req, res) => {
  try {
    const { blipId } = req.params;
    const { limit = 10, page = 1 } = req.query;
    
    // Get buyerId and check authentication status
    const buyerId = req.user?.id;
    const isAuthenticated = !!buyerId && req.user?.role === 'Buyer';

    // Find the product that contains the reference blip
    const product = await Product.findOne({ 
      'blips._id': blipId,
      blips: { $elemMatch: { _id: blipId, processed: true } },
      status: 'active'
    })
    .populate({
      path: 'seller',
      select: '_id firstName lastName businessName email phoneNumber storeName storeAvatar storeBanner aboutStore stats isVerified createdAt warehouseDetails shippingOptions followers'
    });
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Blip not found' });
    }
    
    // Get the source blip
    const sourceBlip = product.blips.id(blipId);
    
    if (!sourceBlip) {
      return res.status(404).json({ success: false, message: 'Blip not found' });
    }
    
    // Find products with blips in the same category
    // Excluding the current product to ensure we don't get the same blips
    const relatedProducts = await Product.find({
      _id: { $ne: product._id },
      category: product.category,
      status: 'active',
      'blips.processed': true 
    })
    .populate({
      path: 'seller',
      select: '_id firstName lastName businessName storeName storeAvatar aboutStore stats isVerified followers'
    })
    .select('_id name blips category subCategory seo.slug price discount stats images variants stock status');
    
    // Extract all blips from related products
    let relatedBlips = [];
    
    relatedProducts.forEach(prod => {
      if (prod.blips && prod.blips.length > 0) {
        prod.blips.forEach(blip => {
          // Check if the current user has liked this blip
          const isLiked = buyerId && blip.likes ? blip.likes.includes(buyerId) : false;
          
          // Check if the buyer is following the seller
          const isFollowing = isAuthenticated && prod.seller.followers ? 
            prod.seller.followers.some(follower => 
              follower.buyerId && follower.buyerId.toString() === buyerId
            ) : false;
          
          // Get product image URL
          const productImage = prod.images && prod.images.length > 0 ? prod.images[0].url : '';
          
          // Calculate discounted price
          let discountedPrice = prod.price;
          if (prod.discount && prod.discount.isActive) {
            if (prod.discount.type === 'percentage') {
              discountedPrice = Math.ceil((prod.price * (100 - prod.discount.value)) / 100);
            } else {
              discountedPrice = Math.max(0, prod.price - prod.discount.value);
            }
          }
          
          relatedBlips.push({
            discount: {
              isActive: prod.discount ? prod.discount.isActive : false,
              type: prod.discount ? prod.discount.type : 'percentage',
              value: prod.discount ? prod.discount.value : 0,
              discountedPrice: discountedPrice
            },
            _id: prod._id,
            blipId: blip._id,
            blipUrl: blip.url,
            processed: blip.processed,
            thumbnail: blip.thumbnail || null,
            productId: prod._id,
            productName: prod.name,
            price: prod.price,
            stock: prod.stock || 0,
            status: prod.status || 'active',
            auctionInfo: null, // Not handling auction info for now
            images: productImage,
            blipEngagement: {
              likesCount: blip.likesCount || blip.likes.length || 0,
              commentsCount: blip.commentsCount || (blip.comments ? blip.comments.length : 0),
              viewCount: blip.viewCount || 0,
              isLiked: isLiked
            },
            averageRating: prod.stats && prod.stats.averageRating ? prod.stats.averageRating : null,
            reviewCount: prod.stats && prod.stats.totalReviews ? prod.stats.totalReviews : 0,
            createdAt: blip.createdAt,
            seller: {
              _id: prod.seller._id,
              firstName: prod.seller.firstName,
              lastName: prod.seller.lastName,
              storeName: prod.seller.storeName,
              storeAvatar: prod.seller.storeAvatar,
              aboutStore: prod.seller.aboutStore || '',
              storeRating: prod.seller.stats && prod.seller.stats.rating ? prod.seller.stats.rating : 0,
              totalStoreReviews: prod.seller.stats && prod.seller.stats.totalReviews ? prod.seller.stats.totalReviews : 0,
              isFollowing: isFollowing,
              isFeatured: prod.seller.isVerified || false
            }
          });
        });
      }
    });
    
    // If we don't have enough related blips, fetch random blips
    if (relatedBlips.length < parseInt(limit)) {
      const randomProducts = await Product.find({
        _id: { $ne: product._id },
        'blips.0': { $exists: true }, // ensure the product has at least one blip
        'blips.processed': true, // ensure blips are processed
        status: 'active'
      })
      .populate({
        path: 'seller',
        select: '_id firstName lastName businessName storeName storeAvatar aboutStore stats isVerified followers'
      })
      .select('_id name blips category subCategory seo.slug price discount stats images variants stock status');
      
      randomProducts.forEach(prod => {
        if (prod.blips && prod.blips.length > 0) {
          prod.blips.forEach(blip => {
            // Avoid duplicates
            const exists = relatedBlips.some(
              item => item.blipId.toString() === blip._id.toString()
            );
            
            if (!exists) {
              const isLiked = buyerId && blip.likes ? blip.likes.includes(buyerId) : false;
              
              // Check if the buyer is following the seller
              const isFollowing = isAuthenticated && prod.seller.followers ? 
                prod.seller.followers.some(follower => 
                  follower.buyerId && follower.buyerId.toString() === buyerId
                ) : false;
              
              // Get product image URL
              const productImage = prod.images && prod.images.length > 0 ? prod.images[0].url : '';
              
              // Calculate discounted price
              let discountedPrice = prod.price;
              if (prod.discount && prod.discount.isActive) {
                if (prod.discount.type === 'percentage') {
                  discountedPrice = Math.ceil((prod.price * (100 - prod.discount.value)) / 100);
                } else {
                  discountedPrice = Math.max(0, prod.price - prod.discount.value);
                }
              }
              
              relatedBlips.push({
                discount: {
                  isActive: prod.discount ? prod.discount.isActive : false,
                  type: prod.discount ? prod.discount.type : 'percentage',
                  value: prod.discount ? prod.discount.value : 0,
                  discountedPrice: discountedPrice
                },
                _id: prod._id,
                blipId: blip._id,
                blipUrl: blip.url,
                processed: blip.processed,
                thumbnail: blip.thumbnail || null,
                productId: prod._id,
                productName: prod.name,
                price: prod.price,
                stock: prod.stock || 0,
                status: prod.status || 'active',
                auctionInfo: null, // Not handling auction info for now
                images: productImage,
                blipEngagement: {
                  likesCount: blip.likesCount || blip.likes.length || 0,
                  commentsCount: blip.commentsCount || (blip.comments ? blip.comments.length : 0),
                  viewCount: blip.viewCount || 0,
                  isLiked: isLiked
                },
                averageRating: prod.stats && prod.stats.averageRating ? prod.stats.averageRating : null,
                reviewCount: prod.stats && prod.stats.totalReviews ? prod.stats.totalReviews : 0,
                createdAt: blip.createdAt,
                seller: {
                  _id: prod.seller._id,
                  firstName: prod.seller.firstName,
                  lastName: prod.seller.lastName,
                  storeName: prod.seller.storeName,
                  storeAvatar: prod.seller.storeAvatar,
                  aboutStore: prod.seller.aboutStore || '',
                  storeRating: prod.seller.stats && prod.seller.stats.rating ? prod.seller.stats.rating : 0,
                  totalStoreReviews: prod.seller.stats && prod.seller.stats.totalReviews ? prod.seller.stats.totalReviews : 0,
                  isFollowing: isFollowing,
                  isFeatured: prod.seller.isVerified || false
                }
              });
            }
          });
        }
      });
    }
    
    // Shuffle the array for better variety
    relatedBlips = relatedBlips.sort(() => 0.5 - Math.random());
    
    // Calculate total number of blips
    const total = relatedBlips.length;
    
    // Calculate pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    
    // Get paginated blips
    const paginatedBlips = relatedBlips.slice(startIndex, endIndex);
    
    return res.status(200).json({
      success: true,
      blips: paginatedBlips,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      totalBlips: total,
      hasMore: endIndex < total
    });
  } catch (error) {
    console.error('Error fetching related blips:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Delete a blip from a product
exports.deleteBlipFromProduct = async (req, res) => {
  try {
    const { productId, blipId } = req.params;
    const sellerId = req.user.id;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(productId) || !mongoose.Types.ObjectId.isValid(blipId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid product or blip ID format' 
      });
    }

    // Find product and verify seller ownership
    const product = await Product.findOne({ 
      _id: productId, 
      seller: sellerId 
    });

    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found or you do not have permission to modify it' 
      });
    }

    // Find the blip in the product
    const blip = product.blips.id(blipId);
    if (!blip) {
      return res.status(404).json({ 
        success: false, 
        message: 'Blip not found in the product' 
      });
    }

    // Get the blip URL to delete from storage if needed
    const blipUrl = blip.url;
    const blipKey = blip.key;
    const thumbnailUrl = blip.thumbnail;

    // Remove the blip from the product
    product.blips.pull(blipId);
    await product.save();

    // delete product from S3
    productBlips.DeleteBlipFromS3(sellerId, productId, blipKey, process.env.RAW_BLIPS_S3_BUCKET)

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Blip deleted successfully',
      deletedBlip: {
        _id: blipId,
        url: blipUrl,
        thumbnail: thumbnailUrl
      }
    });
  } catch (error) {
    console.error('Error in deleteBlipFromProduct:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete blip',
      error: error.message
    });
  }
};