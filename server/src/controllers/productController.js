const Product = require('../models/Product');
const cloudinary = require('../config/cloudinary');
const Buyer = require('../models/Buyer');
const Seller = require('../models/Seller');
const { s3 } = require('../config/awsConfig')
const { v4: uuidv4 } = require('uuid');
const Category = require('../models/Category');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const NotificationController = require('../controllers/notificationController');
const { createNotification, getNotificationMessage } = require('../controllers/notificationController');

const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
ffmpeg.setFfmpegPath(ffmpegPath);
const sharp = require('sharp');

// Initialize FFmpeg
// const ffmpeg = createFFmpeg({ log: true });

// Create a new product
exports.createProduct = async (req, res) => {
  try {
    const sellerId = req.user.id;
    
    // Validate required fields
    const requiredFields = ['name', 'description', 'price', 'category', 'stock', 'sku'];
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
          Bucket: 'auqli-uploads',
          Key: `${uuidv4()}.jpg`,
          Body: buffer,
          ContentType: image.contentType,
        };
        const data = await s3.upload(params).promise();
        imagesLinks.push({ url: data.Location });
      }
    }

    // Handle blips/videos
    let blipsLinks = [];
    if (req.body.blips && Array.isArray(req.body.blips)) {
      for (let blip of req.body.blips) {
        const buffer = Buffer.from(blip.data, 'base64');
        
        // Log original size
        const originalSize = buffer.byteLength;
        console.log(`Original video size: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);

        try {
          // Create temporary files
          const tempDir = os.tmpdir();
          const inputPath = path.join(tempDir, `${uuidv4()}.mp4`);
          const outputPath = path.join(tempDir, `${uuidv4()}_compressed.mp4`);

          // Write buffer to temp file
          await fs.writeFile(inputPath, buffer);

          // Compress using fluent-ffmpeg
          await new Promise((resolve, reject) => {
            ffmpeg(inputPath)
              .output(outputPath)
              .videoCodec('libx264')
              .outputOptions([
                '-crf 28', // Higher CRF for smaller files
                '-preset superfast', // Faster encoding
                '-movflags +faststart',
              ])
              .on('end', async () => {
                try {
                  const compressedBuffer = await fs.readFile(outputPath);
                  
                  // Log compressed size
                  const compressedSize = compressedBuffer.byteLength;
                  console.log(`Compressed video size: ${(compressedSize / 1024 / 1024).toFixed(2)} MB`);
                  console.log(`Compression ratio: ${((compressedSize / originalSize) * 100).toFixed(2)}%`);

                  // Upload to S3
                  const params = {
                    Bucket: 'auqli-uploads',
                    Key: `${uuidv4()}.mp4`,
                    Body: compressedBuffer,
                    ContentType: blip.contentType,
                  };
                  const data = await s3.upload(params).promise();
                  blipsLinks.push({ url: data.Location });

                  // Cleanup
                  await Promise.all([
                    fs.unlink(inputPath),
                    fs.unlink(outputPath)
                  ]);
                  resolve();
                } catch (error) {
                  reject(error);
                }
              })
              .on('stderr', function(stderrLine) {
                console.log('FFmpeg stderr: ' + stderrLine);
              })
              .on('start', function(cmdLine) {
                console.log('Started ffmpeg with command: ' + cmdLine);
                setTimeout(() => {
                  if(!this.ended) {
                    console.log('Killing long-running ffmpeg process');
                    this.kill('SIGKILL');
                  }
                }, 30000); // 30s timeout
              })
              .on('error', (err) => {
                console.error('FFmpeg error:', err);
                reject(err);
              })
              .run();
          });
        } catch (error) {
          console.error('Video compression error:', error);
          // Fallback to original video
          const params = {
            Bucket: 'auqli-uploads',
            Key: `${uuidv4()}.mp4`,
            Body: buffer,
            ContentType: blip.contentType,
          };
          const data = await s3.upload(params).promise();
          blipsLinks.push({ url: data.Location });
        }
      }
    }

    // Process variant images
    if (req.body.variants && Array.isArray(req.body.variants)) {
      parsedBody.variants = await Promise.all(req.body.variants.map(async (variant) => {
        // Process main variant images
        const variantImages = [];
        if (variant.images && Array.isArray(variant.images)) {
          for (let image of variant.images) {
            const buffer = Buffer.from(image.data, 'base64');
            const params = {
              Bucket: 'auqli-uploads',
              Key: `variants/colors/${uuidv4()}-${variant.value}.jpg`,
              Body: buffer,
              ContentType: image.contentType,
            };
            const data = await s3.upload(params).promise();
            variantImages.push({
              data: data.Location,
              contentType: image.contentType,
              isDefault: image.isDefault || false
            });
          }
        }

        // Process subvariants
        const processedSubVariants = await Promise.all((variant.subVariants || []).map(async (subVariant) => {
          const subVariantImages = [];
          if (subVariant.images && Array.isArray(subVariant.images)) {
            for (let image of subVariant.images) {
              const buffer = Buffer.from(image.data, 'base64');
              const params = {
                Bucket: 'auqli-uploads',
                Key: `variants/sizes/${uuidv4()}-${variant.value}_${subVariant.value}.jpg`,
                Body: buffer,
                ContentType: image.contentType,
              };
              const data = await s3.upload(params).promise();
              subVariantImages.push({
                data: data.Location,
                contentType: image.contentType,
                isDefault: image.isDefault || false
              });
            }
          }

          // Process subsubvariants
          const processedSubSubVariants = await Promise.all((subVariant.subSubVariants || []).map(async (subSubVariant) => {
            const subSubVariantImages = [];
            if (subSubVariant.images && Array.isArray(subSubVariant.images)) {
              for (let image of subSubVariant.images) {
                const buffer = Buffer.from(image.data, 'base64');
                const params = {
                  Bucket: 'auqli-uploads',
                  Key: `variants/materials/${uuidv4()}-${variant.value}_${subVariant.value}_${subSubVariant.value}.jpg`,
                  Body: buffer,
                  ContentType: image.contentType,
                };
                const data = await s3.upload(params).promise();
                subSubVariantImages.push({
                  data: data.Location,
                  contentType: image.contentType,
                  isDefault: image.isDefault || false
                });
              }
            }

            return {
              ...subSubVariant,
              images: subSubVariantImages.length > 0 ? subSubVariantImages : subSubVariant.images
            };
          }));

          return {
            ...subVariant,
            images: subVariantImages.length > 0 ? subVariantImages : variant.images,
            subSubVariants: processedSubSubVariants
          };
        }));

        return {
          ...variant,
          images: variantImages.length > 0 ? variantImages : variant.images,
          subVariants: processedSubVariants
        };
      }));
    }

    // Create new product
    const newProduct = new Product({
      ...parsedBody,
      seller: sellerId,
      images: imagesLinks,
      blips: blipsLinks,
    });

    await newProduct.save();

    // Populate seller details
    const populatedProduct = await Product.findById(newProduct._id)
      .populate('seller', 'name avatarUrl about');

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
        Bucket: 'auqli-uploads',
        Key: key,
        Body: Buffer.from(image.data, 'base64'),
        ContentType: image.contentType,
        ACL: 'public-read' // Make the image publicly accessible
      }).promise();

      return {
        data: `https://auqli-uploads.s3.amazonaws.com/${key}`,
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

// Get all products
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

    // Build query - start with an empty object to get all products if no filters
    let query = {};

    // Only add filters if they're specifically provided in the query
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

    // Execute query with pagination
    const products = await Product.find(query)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('seller', 'businessName storeName')
      .select('-__v'); // Exclude version key if needed

    // Get total count for pagination
    const totalProducts = await Product.countDocuments(query);

    // Calculate pagination info
    const totalPages = Math.ceil(totalProducts / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      success: true,
      data: {
        products,
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
              warehouseDetails: '$sellerInfo.warehouseDetails'
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

    if (product.seller.toString() !== sellerId) {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }

    // Handle main product images
    if (updates.images && Array.isArray(updates.images)) {
      const imagesLinks = [];
      for (let image of updates.images) {
        if (image.data.startsWith('https://auqli-uploads.s3')) {
          imagesLinks.push({ url: image.data }); // Keep existing S3 image
        } else {
          // Process new base64 image
          const buffer = Buffer.from(image.data, 'base64');
          const params = {
            Bucket: 'auqli-uploads',
            Key: `${uuidv4()}.jpg`,
            Body: buffer,
            ContentType: image.contentType,
          };
          const data = await s3.upload(params).promise();
          imagesLinks.push({ url: data.Location });
        }
      }
      updates.images = imagesLinks;
    }

    // Handle blips/videos
    if (updates.blips && Array.isArray(updates.blips)) {
      const blipsLinks = [];
      for (let blip of updates.blips) {
        if (blip.data.startsWith('https://auqli-uploads.s3')) {
          blipsLinks.push({ url: blip.data }); // Keep existing S3 video
        } else {
          // Process new base64 video
          const buffer = Buffer.from(blip.data, 'base64');
          const params = {
            Bucket: 'auqli-uploads',
            Key: `${uuidv4()}.mp4`,
            Body: buffer,
            ContentType: blip.contentType,
          };
          const data = await s3.upload(params).promise();
          blipsLinks.push({ url: data.Location });
        }
      }
      updates.blips = blipsLinks;
    }

    // Process variant images if they exist
    if (updates.variants && Array.isArray(updates.variants)) {
      updates.variants = await Promise.all(updates.variants.map(async (variant) => {
        // Process main variant images
        const variantImages = [];
        if (variant.images && Array.isArray(variant.images)) {
          for (let image of variant.images) {
            // Check if image is already on S3
            if (image.data.startsWith('https://auqli-uploads.s3')) {
              variantImages.push(image); // Keep existing S3 image as is
            } else {
              // Process new base64 image
              const buffer = Buffer.from(image.data.split(',')[1], 'base64');
              const params = {
                Bucket: 'auqli-uploads',
                Key: `variants/colors/${uuidv4()}-${variant.value}.jpg`,
                Body: buffer,
                ContentType: image.contentType,
              };
              const data = await s3.upload(params).promise();
              variantImages.push({
                data: data.Location,
                contentType: image.contentType,
                isDefault: image.isDefault || false
              });
            }
          }
        }

        // Process subvariants
        const processedSubVariants = await Promise.all((variant.subVariants || []).map(async (subVariant) => {
          const subVariantImages = [];
          if (subVariant.images && Array.isArray(subVariant.images)) {
            for (let image of subVariant.images) {
              if (image.data.startsWith('https://auqli-uploads.s3')) {
                subVariantImages.push(image);
              } else {
                const buffer = Buffer.from(image.data.split(',')[1], 'base64');
                const params = {
                  Bucket: 'auqli-uploads',
                  Key: `variants/sizes/${uuidv4()}-${variant.value}_${subVariant.value}.jpg`,
                  Body: buffer,
                  ContentType: image.contentType,
                };
                const data = await s3.upload(params).promise();
                subVariantImages.push({
                  data: data.Location,
                  contentType: image.contentType,
                  isDefault: image.isDefault || false
                });
              }
            }
          }

          // Process subsubvariants
          const processedSubSubVariants = await Promise.all((subVariant.subSubVariants || []).map(async (subSubVariant) => {
            const subSubVariantImages = [];
            if (subSubVariant.images && Array.isArray(subSubVariant.images)) {
              for (let image of subSubVariant.images) {
                if (image.data.startsWith('https://auqli-uploads.s3')) {
                  subSubVariantImages.push(image);
                } else {
                  const buffer = Buffer.from(image.data.split(',')[1], 'base64');
                  const params = {
                    Bucket: 'auqli-uploads',
                    Key: `variants/materials/${uuidv4()}-${variant.value}_${subVariant.value}_${subSubVariant.value}.jpg`,
                    Body: buffer,
                    ContentType: image.contentType,
                  };
                  const data = await s3.upload(params).promise();
                  subSubVariantImages.push({
                    data: data.Location,
                    contentType: image.contentType,
                    isDefault: image.isDefault || false
                  });
                }
              }
            }

            return {
              ...subSubVariant,
              images: subSubVariantImages.length > 0 ? subSubVariantImages : subSubVariant.images
            };
          }));

          return {
            ...subVariant,
            images: subVariantImages.length > 0 ? subVariantImages : variant.images,
            subSubVariants: processedSubSubVariants
          };
        }));

        return {
          ...variant,
          images: variantImages.length > 0 ? variantImages : variant.images,
          subVariants: processedSubVariants
        };
      }));
    }

    // Protected fields that shouldn't be updated directly
    const protectedFields = ['_id', 'seller', 'createdAt', 'reviews', 'analytics'];

    // Remove protected fields from updates
    protectedFields.forEach(field => {
      delete updates[field];
    });

    // Update all fields except protected ones
    Object.assign(product, {
      ...updates,
      updatedAt: Date.now()
    });

    await product.save();

    // Populate seller information before sending response
    const updatedProduct = await Product.findById(id)
      .populate('seller', 'businessName storeName');

    res.json({
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: error.message
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

    if (product.seller.toString() !== sellerId) {
      return res.status(403).json({ message: 'Not authorized to delete this product' });
    }

    // Delete product images from storage
    if (product.images && product.images.length > 0) {
      for (const image of product.images) {
        const key = image.url.split('/').pop();
        await s3.deleteObject({
          Bucket: 'auqli-uploads',
          Key: key
        }).promise();
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
  const { query } = req.query;

  try {
    const products = await Product.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } },
        { subCategory: { $regex: query, $options: 'i' } },
        { subSubCategory: { $regex: query, $options: 'i' } },
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
// Get just arrived products
exports.getJustArrivedProducts = async (req, res) => {
  try {
    console.log('Fetching just arrived products...');

    // Get products from the last 7 days
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - 7);

    console.log('Looking for products after:', dateThreshold);

    const products = await Product.find({
      createdAt: { $gte: dateThreshold },
      status: 'active',
      visibility: 'visible'
    })
      .select('name description price images category subCategory seller stats createdAt')
      .populate('seller', 'name storeName avatarUrl')
      .sort({ createdAt: -1 })
      .lean();

    console.log(`Found ${products.length} products`);

    res.json({
      success: true,
      products
    });

  } catch (error) {
    console.error('Error in getJustArrivedProducts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve just arrived products',
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
    const { 
      limit = 10, 
      period = 'week',
      category 
    } = req.query;

    // Calculate date threshold based on period
    const dateThreshold = new Date();
    switch (period) {
      case 'day':
        dateThreshold.setDate(dateThreshold.getDate() - 1);
        break;
      case 'month':
        dateThreshold.setMonth(dateThreshold.getMonth() - 1);
        break;
      default: // week
        dateThreshold.setDate(dateThreshold.getDate() - 7);
    }

    // Build base query
    const query = {
      status: 'active',
      visibility: 'visible',
      'stats.lastViewed': { $gte: dateThreshold }
    };

    // Add category filter if provided
    if (category) {
      query.category = category;
    }

    // Aggregate pipeline to calculate trending score
    const trendingProducts = await Product.aggregate([
      { $match: query },
      {
        $addFields: {
          reviewCount: { $size: '$reviews' },
          averageRating: { $avg: '$reviews.rating' },
          // Calculate trending score based on multiple factors
          trendingScore: {
            $add: [
              { $multiply: [{ $size: '$reviews' }, 2] }, // Review count weight
              { $multiply: [{ $avg: '$reviews.rating' }, 3] }, // Rating weight
              { $multiply: ['$stats.views', 0.5] }, // Views weight
              { $multiply: ['$stats.sales', 4] } // Sales weight
            ]
          }
        }
      },
      { $sort: { trendingScore: -1 } },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: 'sellers',
          localField: 'seller',
          foreignField: '_id',
          as: 'seller'
        }
      },
      { $unwind: '$seller' },
      {
        $project: {
          name: 1,
          price: 1,
          discountedPrice: 1,
          images: 1,
          category: 1,
          trendingScore: 1,
          'seller._id': 1,
          'seller.storeName': 1,
          stats: {
            rating: '$averageRating',
            reviewCount: '$reviewCount',
            views: '$stats.views',
            sales: '$stats.sales'
          }
        }
      }
    ]);

    res.json({
      success: true,
      period,
      products: trendingProducts.map(product => ({
        ...product,
        trendingScore: Math.round(product.trendingScore * 100) / 100
      }))
    });

  } catch (error) {
    console.error('Error fetching trending products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trending products',
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
  const buyerId = req.user.id; // Get logged in buyer's ID

  try {
    // First get all sellers and their followers
    const sellers = await Seller.find({}, {
      _id: 1,
      firstName: 1,
      lastName: 1,
      businessName: 1,
      storeName: 1,
      storeAvatar: 1,
      aboutStore: 1,
      followers: {
        $elemMatch: { buyerId: new mongoose.Types.ObjectId(buyerId) }
      }
    });

    // Create a map of seller IDs to following status
    const sellerFollowingMap = new Map(
      sellers.map(seller => [
        seller._id.toString(),
        seller.followers && seller.followers.length > 0
      ])
    );

    // Get products with blips
    const products = await Product.aggregate([
      // Match products that have blips
      { $match: { 'blips.0': { $exists: true } } },
      
      // Unwind blips array
      { $unwind: '$blips' },
      
      // Sort by blip creation date
      { $sort: { 'blips.createdAt': -1 } },
      
      // Skip and limit for pagination
      { $skip: (page - 1) * limit },
      { $limit: limit },
      
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
      
      // Project final shape
      {
        $project: {
          _id: 1,
          blipId: '$blips._id',
          url: '$blips.url',
          contentType: '$blips.contentType',
          likes: '$blips.likes',
          likesCount: '$blips.likesCount',
          comments: '$blips.comments',
          commentsCount: '$blips.commentsCount',
          createdAt: '$blips.createdAt',
          productName: '$name',
          price: '$price',
          seller: {
            _id: '$sellerInfo._id',
            firstName: '$sellerInfo.firstName',
            lastName: '$sellerInfo.lastName',
            storeName: '$sellerInfo.storeName',
            storeAvatar: '$sellerInfo.storeAvatar',
            aboutStore: '$sellerInfo.aboutStore'
          }
        }
      }
    ]);

    // Add isFollowing to each blip
    const blipsWithFollowing = products.map(product => ({
      ...product,
      seller: {
        ...product.seller,
        isFollowing: sellerFollowingMap.get(product.seller._id.toString()) || false
      }
    }));

    // Get total count for pagination
    const total = await Product.aggregate([
      { $match: { 'blips.0': { $exists: true } } },
      { $unwind: '$blips' },
      { $count: 'total' }
    ]);

    res.json({
      blips: blipsWithFollowing,
      currentPage: page,
      totalPages: Math.ceil((total[0]?.total || 0) / limit),
      totalBlips: total[0]?.total || 0
    });

  } catch (error) {
    console.error('Error in getAllBlips:', error);
    res.status(500).json({
      message: 'Failed to retrieve blips',
      error: error.message
    });
  }
};

// Get seller blips
exports.getSellerBlips = async (req, res) => {
  const { sellerId } = req.params;
  const buyerId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  try {
    // Validate sellerId
    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({ message: 'Invalid seller ID' });
    }

    // Get seller info with following status
    const seller = await Seller.findById(sellerId, {
      firstName: 1,
      lastName: 1,
      businessName: 1,
      storeName: 1,
      storeAvatar: 1,
      aboutStore: 1,
      followers: {
        $elemMatch: { buyerId: new mongoose.Types.ObjectId(buyerId) }
      }
    });

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    const isFollowing = seller.followers && seller.followers.length > 0;

    // Get seller's products with blips
    const products = await Product.aggregate([
      // Match products from this seller that have blips
      {
        $match: {
          seller: new mongoose.Types.ObjectId(sellerId),
          'blips.0': { $exists: true }
        }
      },
      
      // Unwind blips array
      { $unwind: '$blips' },
      
      // Sort by blip creation date
      { $sort: { 'blips.createdAt': -1 } },
      
      // Pagination
      { $skip: (page - 1) * limit },
      { $limit: limit },
      
      // Project final shape
      {
        $project: {
          _id: 1,
          blipId: '$blips._id',
          url: '$blips.url',
          contentType: '$blips.contentType',
          likes: '$blips.likes',
          likesCount: '$blips.likesCount',
          comments: '$blips.comments',
          commentsCount: '$blips.commentsCount',
          createdAt: '$blips.createdAt',
          productName: '$name',
          price: '$price'
        }
      }
    ]);

    // Get total count for pagination
    const total = await Product.aggregate([
      {
        $match: {
          seller: new mongoose.Types.ObjectId(sellerId),
          'blips.0': { $exists: true }
        }
      },
      { $unwind: '$blips' },
      { $count: 'total' }
    ]);

    res.json({
      seller: {
        ...seller.toObject(),
        isFollowing
      },
      blips: products,
      currentPage: page,
      totalPages: Math.ceil((total[0]?.total || 0) / limit),
      totalBlips: total[0]?.total || 0
    });

  } catch (error) {
    console.error('Error in getSellerBlips:', error);
    res.status(500).json({
      message: 'Failed to retrieve seller blips',
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
      sortBy = 'newest' 
    } = req.query;

    // Build query
    const query = { seller: sellerId };
    if (status) query.status = status;
    if (visibility) query.visibility = visibility;

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
      totalProducts
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
        businessName: seller.businessName
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

    if (!quantity || isNaN(parseInt(quantity))) {
      throw new Error('Valid quantity is required');
    }

    const product = await Product.findById(productId).session(session);

    if (!product) {
      throw new Error('Product not found');
    }

    // Verify seller ownership
    if (product.seller.toString() !== req.user.id) {
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
    const { rating, title, comment, images } = req.body;
    const productId = req.params.id;
    const buyerId = req.user.id;

    // Validate input
    if (!rating || !title || !comment) {
      return res.status(400).json({ message: 'Rating, title and comment are required' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Process images (if any)
    const processedImages = [];
    
    if (images && Array.isArray(images)) {
      // Limit number of images
      if (images.length > 5) {
        return res.status(400).json({ message: 'Maximum 5 images allowed' });
      }

      for (const image of images) {
        // Validate base64 data
        if (!image.base64) {
          continue;
        }

        const buffer = Buffer.from(image.base64, 'base64');
        const params = {
          Bucket: 'auqli-uploads',
          Key: `reviews/${productId}/${Date.now()}-${uuidv4()}.jpg`,
          Body: buffer,
          ContentType: image.mimeType || 'image/jpeg',
        };
        const uploadResult = await s3.upload(params).promise();
        
        processedImages.push({
          url: uploadResult.Location,
          contentType: image.mimeType || 'image/jpeg'
        });
      }
    }

    // Get buyer details
    const buyer = await Buyer.findById(buyerId);
    
    // Create the review object
    const review = {
      buyer: buyerId,
      firstName: buyer.firstName,
      lastName: buyer.lastName,
      title,
      rating,
      comment,
      images: processedImages,
      createdAt: new Date(),
      purchasedVariant: req.body.purchasedVariant || {}
    };

    product.reviews.push(review);
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

exports.getPersonalizedProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20, sortBy = 'createdAt', order = 'desc' } = req.query;
    const buyerId = req.user.id;

    console.log('Buyer ID:', buyerId);

    if (!mongoose.Types.ObjectId.isValid(buyerId)) {
      return res.status(400).json({ message: 'Invalid buyer ID format' });
    }

    const buyer = await Buyer.findById(buyerId);
    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }

    // Extract categories and subcategories from buyer's preferences
    const categoryNames = buyer.selectedCategories.map(cat => cat.name);
    const subcategoryNames = buyer.selectedCategories.flatMap(category =>
      category.subCategories.map(sub => sub.name)
    );

    console.log('Category Names:', categoryNames);
    console.log('Subcategory Names:', subcategoryNames);

    // Build base query for active and visible products
    const baseQuery = {
      status: 'active',
      visibility: 'visible',
      stock: { $gt: 0 }
    };

    // Build category-specific query
    const categoryQuery = categoryNames.length || subcategoryNames.length ? {
      ...baseQuery,
      $or: [
        { category: { $in: categoryNames } },
        { subCategory: { $in: subcategoryNames } }
      ]
    } : baseQuery;

    // Build sort object
    const sortOptions = {
      createdAt: order === 'desc' ? -1 : 1,
      price: order === 'desc' ? -1 : 1,
      'stats.averageRating': order === 'desc' ? -1 : 1
    };

    // Try to get category-specific products first
    let products = await Product.find(categoryQuery)
      .sort({ [sortBy]: sortOptions[sortBy] })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('seller', 'name avatarUrl about storeName')
      .populate('reviews.buyer', 'firstName lastName');

    // If no products found in preferred categories, get regular products
    if (products.length === 0) {
      console.log('No products found in preferred categories, fetching regular products');
      products = await Product.find(baseQuery)
        .sort({ [sortBy]: sortOptions[sortBy] })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .populate('seller', 'name avatarUrl about storeName')
        .populate('reviews.buyer', 'firstName lastName');
    }

    // Get total count based on which query was successful
    const total = products.length > 0 
      ? await Product.countDocuments(categoryQuery)
      : await Product.countDocuments(baseQuery);

    res.json({
      products,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalProducts: total,
      hasMore: page * limit < total,
      isPersonalized: products.length > 0 && (categoryNames.length > 0 || subcategoryNames.length > 0)
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
      { _id: id, "blips._id": blipId },
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
      { _id: id, "blips._id": blipId },
      updateOperation
    );

    console.log('Debug - Update result:', result);

    if (result.modifiedCount === 0) {
      console.log('Debug - No document was modified');
      return res.status(400).json({ message: 'Failed to update like status' });
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

// Get blip comments
exports.getBlipComments = async (req, res) => {
  try {
    const { id, blipId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const blip = product.blips.id(blipId);
    if (!blip) {
      return res.status(404).json({ message: 'Blip not found' });
    }

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const comments = await Product.findOne(
      { _id: id, 'blips._id': blipId },
      { 'blips.$': 1 }
    ).populate({
      path: 'blips.comments.buyer',
      select: 'firstName lastName profileImage'
    });

    const paginatedComments = comments.blips[0].comments
      .slice(startIndex, endIndex);

    res.json({
      comments: paginatedComments,
      pagination: {
        total: blip.comments.length,
        pages: Math.ceil(blip.comments.length / limit),
        currentPage: page,
        hasMore: endIndex < blip.comments.length
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to get comments',
      error: error.message
    });
  }
};
