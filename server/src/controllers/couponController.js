const Coupon = require('../models/Coupon');
const Product = require('../models/Product');
const Seller = require('../models/Seller');
const notificationController = require('../controllers/notificationController');

// Reset all coupons and discounts for the authenticated seller
exports.resetAllSellerDiscounts = async (req, res) => {
  try {
    const sellerId = req.user.id;

    // 1) Clear all discounts on all products owned by the seller (including variants and pricing)
    await Product.updateMany(
      { seller: sellerId },
      {
        $set: {
          discount: {
            isActive: false,
            type: 'percentage',
            value: 0,
            startDate: null,
            endDate: null,
            couponName: null,
            discountedPrice: null
          },
          'pricing.discountInfo': {
            isActive: false,
            type: 'percentage',
            value: 0,
            startDate: null,
            endDate: null,
            couponName: null,
            discountedPrice: null
          },
          'variants.$[].discount': {
            isActive: false,
            type: 'percentage',
            value: 0,
            startDate: null,
            endDate: null,
            couponName: null,
            discountedPrice: null
          }
        }
      }
    );

    // 2) Expire all coupons created by the seller and mark all embedded product discounts as expired
    const now = new Date();
    await Coupon.updateMany(
      { seller: sellerId, status: { $ne: 'expired' } },
      {
        $set: {
          status: 'expired',
          endDate: now,
          'applicableProducts.$[].status': 'expired',
          'applicableProducts.$[].lastUpdated': now
        }
      }
    );

    return res.json({
      message: 'All coupons expired and all discounts cleared for this seller.'
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to reset coupons and discounts',
      error: error.message
    });
  }
};

// Create a new coupon
exports.createCoupon = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const {
      name,
      discountType = 'percentage',
      discountPercentage,
      fixedAmount,
      hasMinimumRequirement,
      minimumAmount,
      startDate,
      endDate,
      customerEligibility,
      productDiscounts,
      usageLimit
    } = req.body;

    // Validate required fields (code is no longer required)
    if (!name || !productDiscounts) {
      return res.status(400).json({
        message: 'Missing required fields'
      });
    }

    if (discountType === 'percentage') {
      if (typeof discountPercentage !== 'number' || discountPercentage <= 0) {
        return res.status(400).json({ message: 'discountPercentage must be a positive number for percentage coupons' });
      }
    } else if (discountType === 'fixed') {
      if (typeof fixedAmount !== 'number' || fixedAmount <= 0) {
        return res.status(400).json({ message: 'fixedAmount must be a positive number for fixed coupons' });
      }
    } else {
      return res.status(400).json({ message: 'Invalid discountType' });
    }

    // Validate products and build applicableProducts array
    const products = await Product.find({
      _id: { $in: productDiscounts.map(pd => pd.productId) },
      seller: sellerId
    });

    if (products.length !== productDiscounts.length) {
      return res.status(400).json({
        message: 'One or more products not found or do not belong to seller'
      });
    }

    // Check if any products already have active discounts
    const productsWithActiveDiscounts = products.filter(product => 
      product.discount.isActive && 
      (!product.discount.endDate || product.discount.endDate > new Date())
    );

    if (productsWithActiveDiscounts.length > 0) {
      return res.status(400).json({
        message: `Products ${productsWithActiveDiscounts.map(p => p.name).join(', ')} already have active discounts`
      });
    }

    const applicableProducts = await Promise.all(products.map(async (product) => {
      const discountInfo = productDiscounts.find(
        pd => pd.productId.toString() === product._id.toString()
      );
      
      // Determine discounted price and discount value based on type
      let discountedPrice;
      let discountValue; // for percentage, this is percent; for fixed, it's fixedAmount
      if (discountType === 'percentage') {
        const inferredDiscounted = discountInfo && typeof discountInfo.discountedPrice === 'number'
          ? discountInfo.discountedPrice
          : Math.round((product.price * (100 - discountPercentage)) / 100);
        if (inferredDiscounted >= product.price) {
          throw new Error(`Discounted price for ${product.name} must be less than original price`);
        }
        discountedPrice = inferredDiscounted;
        discountValue = ((product.price - discountedPrice) / product.price) * 100;
      } else {
        const amount = fixedAmount;
        discountedPrice = Math.max(0, product.price - amount);
        if (discountedPrice >= product.price) {
          throw new Error(`Fixed discount for ${product.name} must reduce the price`);
        }
        discountValue = amount;
      }

      // Update product's discount information and its variants
      await Product.findByIdAndUpdate(product._id, {
        discount: {
          isActive: true,
          type: discountType,
          value: discountType === 'percentage' ? discountValue : fixedAmount,
          startDate: startDate || new Date(),
          endDate: endDate,
          couponName: name,
          discountedPrice: discountedPrice
        },
        'pricing.discountInfo': {
          isActive: true,
          type: discountType,
          value: discountType === 'percentage' ? discountValue : fixedAmount,
          startDate: startDate || new Date(),
          endDate: endDate,
          couponName: name,
          discountedPrice: discountedPrice
        },
        // Apply same discount to all variants
        $set: {
          'variants.$[].discount': {
            isActive: true,
            type: discountType,
            value: discountType === 'percentage' ? discountValue : fixedAmount,
            startDate: startDate || new Date(),
            endDate: endDate,
            couponName: name,
            discountedPrice: null // Will be calculated for each variant
          }
        }
      });

      // Calculate and update discounted prices for variants
      const updatedProduct = await Product.findById(product._id);
      if (updatedProduct.variants && updatedProduct.variants.length > 0) {
        const variantUpdates = updatedProduct.variants.map(variant => {
          const variantDiscountedPrice = discountType === 'percentage'
            ? Math.round((variant.price * (100 - discountValue)) / 100)
            : Math.max(0, variant.price - fixedAmount);
          return {
            updateOne: {
              filter: {
                _id: product._id,
                'variants._id': variant._id
              },
              update: {
                $set: {
                  'variants.$.discount.discountedPrice': variantDiscountedPrice
                }
              }
            }
          };
        });

        await Product.bulkWrite(variantUpdates);
      }

      return {
        product: product._id,
        originalPrice: product.price,
        discountedPrice: discountedPrice,
        status: 'active'
      };
    }));

    // Create coupon (without code for regular coupons)
    const coupon = new Coupon({
      seller: sellerId,
      name,
      discountType,
      discountPercentage,
      fixedAmount,
      hasMinimumRequirement,
      minimumAmount: hasMinimumRequirement ? minimumAmount : 0,
      startDate: startDate || new Date(),
      endDate,
      customerEligibility,
      applicableProducts,
      usageLimit
    });

    await coupon.save();
    await coupon.populate('applicableProducts.product', 'name price images');

    // After coupon is created, notify eligible buyers
    if (coupon.customerEligibility === 'followers') {
      const seller = await Seller.findById(sellerId).populate('followers.buyerId');
      const eligibleBuyers = seller.followers.map(f => f.buyerId);
      
      // Send notifications to all eligible buyers
      await Promise.all(
        eligibleBuyers.map(buyerId =>
          notificationController.createBuyerNotification(
            buyerId,
            'coupon_received',
            {
              couponId: coupon._id,
              discount: coupon.discountPercentage,
              validUntil: coupon.endDate,
              minimumAmount: coupon.minimumAmount,
              sellerName: seller.businessName || 'Seller',
              sellerLogo: seller.logo
            }
          )
        )
      );
    }

    res.status(201).json(coupon);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to create coupon',
      error: error.message
    });
  }
};

// Get seller's coupons
exports.getSellerCoupons = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const sellerId = req.user.id;

    const query = { seller: sellerId };
    if (status) {
      query.status = status;
    }

    const coupons = await Coupon.find(query)
      .populate('applicableProducts', 'name price images')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Coupon.countDocuments(query);

    res.json({
      coupons,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalCoupons: total
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to retrieve coupons',
      error: error.message
    });
  }
};

// Update a coupon
exports.updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user.id;
    const updateData = req.body;

    const coupon = await Coupon.findOne({ _id: id, seller: sellerId });
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    // If updating applicable products, validate they belong to seller
    if (updateData.applicableProducts) {
      const products = await Product.find({
        _id: { $in: updateData.applicableProducts },
        seller: sellerId
      });

      if (products.length !== updateData.applicableProducts.length) {
        return res.status(400).json({
          message: 'Some products do not belong to the seller'
        });
      }
    }

    // If updating products, check for existing discounts
    if (req.body.productDiscounts) {
      const productIds = req.body.productDiscounts.map(pd => pd.productId);
      const products = await Product.find({
        _id: { $in: productIds },
        seller: req.user.id
      });

      const now = new Date();
      const productsWithDiscounts = products.filter(product => 
        product.discountEndDate && new Date(product.discountEndDate) > now
      );

      if (productsWithDiscounts.length > 0) {
        return res.status(400).json({
          message: 'Some products already have active discounts',
          products: productsWithDiscounts.map(p => ({
            id: p._id,
            name: p.name,
            discountEndDate: p.discountEndDate
          }))
        });
      }
    }

    const updatedCoupon = await Coupon.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).populate('applicableProducts', 'name price images');

    res.json(updatedCoupon);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to update coupon',
      error: error.message
    });
  }
};

// Delete a coupon
exports.deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user.id;

    // Find the coupon and ensure it belongs to the seller
    const coupon = await Coupon.findOne({ _id: id, seller: sellerId });
    
    if (!coupon) {
      return res.status(404).json({
        message: 'Coupon not found'
      });
    }

    // Get all product IDs from the coupon's applicable products
    const productIds = coupon.applicableProducts.map(ap => ap.product);

    // Update all products to remove the discount, including variants
    await Product.updateMany(
      {
        _id: { $in: productIds },
        'discount.couponName': coupon.name
      },
      {
        $set: {
          discount: {
            isActive: false,
            type: 'percentage',
            value: 0,
            startDate: null,
            endDate: null,
            couponName: null,
            discountedPrice: null
          },
          'pricing.discountInfo': {
            isActive: false,
            type: 'percentage',
            value: 0,
            startDate: null,
            endDate: null,
            couponName: null,
            discountedPrice: null
          },
          'variants.$[].discount': {
            isActive: false,
            type: 'percentage',
            value: 0,
            startDate: null,
            endDate: null,
            couponName: null,
            discountedPrice: null
          }
        }
      }
    );

    // Delete the coupon
    await Coupon.findByIdAndDelete(id);

    res.json({
      message: 'Coupon deleted successfully and product discounts removed',
      affectedProducts: productIds.length
    });

  } catch (error) {
    res.status(500).json({
      message: 'Failed to delete coupon',
      error: error.message
    });
  }
};

// Validate a coupon
exports.validateCoupon = async (req, res) => {
  try {
    const { code } = req.params;
    const { cartTotal, productIds } = req.query;
    const buyerId = req.user.id;

    const coupon = await Coupon.findOne({ 
      code: code.toUpperCase(),
      status: 'active',
      $or: [
        { endDate: { $gt: new Date() } },
        { endDate: null }
      ]
    }).populate('seller')
      .populate('applicableProducts.product');

    if (!coupon) {
      return res.status(404).json({ 
        message: 'Coupon not found or has expired',
        status: 'invalid'
      });
    }

    // Update discount statuses before validation
    await coupon.updateDiscountStatuses();

    // Recheck if coupon is still valid after status update
    if (!coupon.isValid()) {
      return res.status(400).json({ 
        message: 'Coupon has expired',
        status: 'expired'
      });
    }

    // Check minimum amount requirement
    if (coupon.hasMinimumRequirement && cartTotal < coupon.minimumAmount) {
      return res.status(400).json({
        message: `Cart total must be at least ${coupon.minimumAmount}`
      });
    }

    // Check customer eligibility
    if (coupon.customerEligibility === 'followers') {
      const seller = await Seller.findById(coupon.seller);
      const isFollower = seller.followers.some(f => f.buyerId.toString() === buyerId);
      if (!isFollower) {
        return res.status(400).json({
          message: 'This coupon is only available for followers'
        });
      }
    }

    // Only include active discounts in response
    const discountedProducts = coupon.applicableProducts
      .filter(ap => 
        productIds.includes(ap.product._id.toString()) && 
        ap.status === 'active'
      )
      .map(ap => ({
        productId: ap.product._id,
        productName: ap.product.name,
        originalPrice: ap.originalPrice,
        discountedPrice: ap.discountedPrice,
        discountType: coupon.discountType,
        discount: coupon.discountType === 'percentage' ? (coupon.discountPercentage || 0).toFixed(2) + '%' : coupon.fixedAmount,
        validUntil: coupon.endDate
      }));

    // If coupon is valid, notify buyer
    if (coupon.isValid()) {
      await notificationController.createBuyerNotification(
        buyerId,
        'coupon_validated',
        {
          couponCode: coupon.code,
          discount: coupon.discountPercentage,
          validUntil: coupon.endDate,
          sellerName: coupon.seller.businessName || 'Seller',
          savings: ((cartTotal * coupon.discountPercentage) / 100).toFixed(2)
        }
      );
    }

    res.json({
      valid: true,
      status: 'active',
      discountType: coupon.discountType,
      discountPercentage: coupon.discountPercentage,
      fixedAmount: coupon.fixedAmount,
      discountedProducts,
      minimumAmount: coupon.hasMinimumRequirement ? coupon.minimumAmount : null,
      validUntil: coupon.endDate,
      timeRemaining: coupon.endDate ? {
        days: Math.floor((coupon.endDate - new Date()) / (1000 * 60 * 60 * 24)),
        hours: Math.floor(((coupon.endDate - new Date()) % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      } : null
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to validate coupon',
      error: error.message
    });
  }
};

// Expire a coupon
exports.expireCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user.id;

    // Find the coupon and ensure it belongs to the seller
    const coupon = await Coupon.findOne({ _id: id, seller: sellerId });
    
    if (!coupon) {
      return res.status(404).json({
        message: 'Coupon not found'
      });
    }

    // Check if coupon is already expired
    if (coupon.status === 'expired') {
      return res.status(400).json({
        message: 'Coupon is already expired'
      });
    }

    // Get all product IDs from the coupon's applicable products
    const productIds = coupon.applicableProducts.map(ap => ap.product);

    // Update all products to remove the discount, including variants
    await Product.updateMany(
      {
        _id: { $in: productIds },
        'discount.couponName': coupon.name
      },
      {
        $set: {
          discount: {
            isActive: false,
            type: 'percentage',
            value: 0,
            startDate: null,
            endDate: null,
            couponName: null,
            discountedPrice: null
          },
          'pricing.discountInfo': {
            isActive: false,
            type: 'percentage',
            value: 0,
            startDate: null,
            endDate: null,
            couponName: null,
            discountedPrice: null
          },
          'variants.$[].discount': {
            isActive: false,
            type: 'percentage',
            value: 0,
            startDate: null,
            endDate: null,
            couponName: null,
            discountedPrice: null
          }
        }
      }
    );

    // Update coupon status to expired and set end date if not already set
    coupon.status = 'expired';
    coupon.endDate = coupon.endDate || new Date();
    
    // Update all applicable products status to expired
    coupon.applicableProducts.forEach(product => {
      product.status = 'expired';
      product.lastUpdated = new Date();
    });

    await coupon.save();

    res.json({
      message: 'Coupon expired successfully and product discounts removed',
      affectedProducts: productIds.length,
      coupon: {
        id: coupon._id,
        name: coupon.name,
        status: coupon.status,
        endDate: coupon.endDate
      }
    });

  } catch (error) {
    res.status(500).json({
      message: 'Failed to expire coupon',
      error: error.message
    });
  }
};

// Create a special coupon code
exports.createSpecialCoupon = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const {
      name,
      code,
      discountType = 'percentage',
      discountPercentage,
      fixedAmount,
      startDate,
      endDate,
      usageLimit,
      applicableProductIds // New field to specify which products this coupon applies to
    } = req.body;

    // Validate required fields
    if (!name || !code) {
      return res.status(400).json({ message: 'Missing required fields: name and code are required' });
    }
    if (discountType === 'percentage') {
      if (typeof discountPercentage !== 'number' || discountPercentage <= 0) {
        return res.status(400).json({ message: 'discountPercentage must be a positive number for percentage coupons' });
      }
    } else if (discountType === 'fixed') {
      if (typeof fixedAmount !== 'number' || fixedAmount <= 0) {
        return res.status(400).json({ message: 'fixedAmount must be a positive number for fixed coupons' });
      }
    } else {
      return res.status(400).json({ message: 'Invalid discountType' });
    }

    // Check if code already exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({
        message: 'Coupon code already exists'
      });
    }

    // If applicable products are specified, validate they belong to the seller
    let applicableProducts = [];
    if (applicableProductIds && applicableProductIds.length > 0) {
      const products = await Product.find({
        _id: { $in: applicableProductIds },
        seller: sellerId
      });

      if (products.length !== applicableProductIds.length) {
        return res.status(400).json({
          message: 'One or more products not found or do not belong to seller'
        });
      }

      // Create applicable products array with original prices
      applicableProducts = products.map(product => ({
        product: product._id,
        originalPrice: product.price,
        discountedPrice: discountType === 'percentage'
          ? Math.round((product.price * (100 - discountPercentage)) / 100)
          : Math.max(0, product.price - fixedAmount),
        status: 'active'
      }));
    }

    // Create special coupon with optional product restrictions
    const coupon = new Coupon({
      seller: sellerId,
      name,
      code: code.toUpperCase(),
      discountType,
      discountPercentage,
      fixedAmount,
      startDate: startDate || new Date(),
      endDate,
      customerEligibility: 'all', // Default for special coupons
      applicableProducts, // Can be empty array if no product restrictions
      usageLimit
    });

    await coupon.save();

    // If applicable products were specified, populate them for the response
    if (applicableProducts.length > 0) {
      await coupon.populate('applicableProducts.product', 'name price images');
    }

    res.status(201).json({
      message: 'Special coupon created successfully',
      coupon: {
        id: coupon._id,
        name: coupon.name,
        code: coupon.code,
        discountType: coupon.discountType,
        discountPercentage: coupon.discountPercentage,
        fixedAmount: coupon.fixedAmount,
        startDate: coupon.startDate,
        endDate: coupon.endDate,
        usageLimit: coupon.usageLimit,
        status: coupon.status,
        applicableProducts: coupon.applicableProducts.length > 0 ? 
          coupon.applicableProducts.map(ap => ({
            productId: ap.product._id || ap.product,
            productName: ap.product.name,
            originalPrice: ap.originalPrice,
            discountedPrice: ap.discountedPrice
          })) : 
          'All products'
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to create special coupon',
      error: error.message
    });
  }
};

// Apply special coupon to a product
exports.applySpecialCoupon = async (req, res) => {
  try {
    const { code, productId, confirmBelow50 } = req.body;
    const buyerId = req.user.id;

    if (!code || !productId) {
      return res.status(400).json({
        message: 'Coupon code and product ID are required'
      });
    }

    // Find the coupon
    const coupon = await Coupon.findOne({ 
      code: code.toUpperCase(),
      status: 'active',
      $or: [
        { endDate: { $gt: new Date() } },
        { endDate: null }
      ]
    });

    if (!coupon) {
      return res.status(404).json({ 
        message: 'Coupon not found or has expired',
        status: 'invalid'
      });
    }

    // Check if coupon is valid
    if (!coupon.isValid()) {
      return res.status(400).json({ 
        message: 'Coupon has expired or reached usage limit',
        status: 'expired'
      });
    }

    // Find the product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        message: 'Product not found'
      });
    }

    // Check if the coupon has product restrictions
    if (coupon.applicableProducts.length > 0) {
      // Check if this product is in the applicable products list
      const isApplicable = coupon.applicableProducts.some(
        ap => ap.product.toString() === productId
      );

      if (!isApplicable) {
        return res.status(400).json({
          message: 'This coupon cannot be applied to this product',
          status: 'not_applicable'
        });
      }

      // If product is in the list, get the pre-calculated discounted price
      const productDiscount = coupon.applicableProducts.find(
        ap => ap.product.toString() === productId
      );
      
      if (productDiscount) {
        // Increment usage count
        coupon.usageCount += 1;
        
        // Track product-specific usage
        const productUsageIndex = coupon.productUsage.findIndex(
          pu => pu.product.toString() === productId
        );
        
        if (productUsageIndex >= 0) {
          coupon.productUsage[productUsageIndex].usageCount += 1;
        } else {
          coupon.productUsage.push({
            product: productId,
            usageCount: 1
          });
        }
        
        await coupon.save();

        const discountedPrice = coupon.discountType === 'percentage'
          ? Math.round((product.price * (100 - coupon.discountPercentage)) / 100)
          : Math.max(0, product.price - (coupon.fixedAmount || 0));

        // 50% warning check
        const thresholdPrice = product.price * 0.5;
        if (discountedPrice < thresholdPrice && !confirmBelow50) {
          return res.status(409).json({
            requireConfirmation: true,
            message: 'Warning: This coupon reduces the product price to less than 50% of its original value. Are you sure you want to proceed?',
            originalPrice: product.price,
            discountedPrice
          });
        }

        return res.json({
          message: 'Coupon applied successfully',
          product: {
            id: product._id,
            name: product.name,
            originalPrice: product.price,
            discountedPrice: discountedPrice,
            discountType: coupon.discountType,
            discountPercentage: coupon.discountPercentage,
            fixedAmount: coupon.fixedAmount,
            savings: coupon.discountType === 'percentage' ? (product.price * coupon.discountPercentage) / 100 : Math.min(product.price, coupon.fixedAmount || 0)
          },
          coupon: {
            code: coupon.code,
            name: coupon.name,
            discountType: coupon.discountType,
            discountPercentage: coupon.discountPercentage,
            fixedAmount: coupon.fixedAmount
          }
        });
      }
    }

    // If no pre-calculated price or no product restrictions, calculate discount now
    const discountedPrice = coupon.discountType === 'percentage'
      ? Math.round((product.price * (100 - coupon.discountPercentage)) / 100)
      : Math.max(0, product.price - (coupon.fixedAmount || 0));

    // 50% warning check
    const thresholdPrice = product.price * 0.5;
    if (discountedPrice < thresholdPrice && !confirmBelow50) {
      return res.status(409).json({
        requireConfirmation: true,
        message: 'Warning: This coupon reduces the product price to less than 50% of its original value. Are you sure you want to proceed?',
        originalPrice: product.price,
        discountedPrice
      });
    }

    // Increment usage count
    coupon.usageCount += 1;
    
    // Track product-specific usage
    const productUsageIndex = coupon.productUsage.findIndex(
      pu => pu.product.toString() === productId
    );
    
    if (productUsageIndex >= 0) {
      coupon.productUsage[productUsageIndex].usageCount += 1;
    } else {
      coupon.productUsage.push({
        product: productId,
        usageCount: 1
      });
    }
    
    await coupon.save();

    // Return product with discounted price
    res.json({
      message: 'Coupon applied successfully',
      product: {
        id: product._id,
        name: product.name,
        originalPrice: product.price,
        discountedPrice: discountedPrice,
        discountType: coupon.discountType,
        discountPercentage: coupon.discountPercentage,
        fixedAmount: coupon.fixedAmount,
        savings: coupon.discountType === 'percentage' ? (product.price * coupon.discountPercentage) / 100 : Math.min(product.price, coupon.fixedAmount || 0)
      },
      coupon: {
        code: coupon.code,
        name: coupon.name,
        discountType: coupon.discountType,
        discountPercentage: coupon.discountPercentage,
        fixedAmount: coupon.fixedAmount
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to apply coupon',
      error: error.message
    });
  }
};

// Get all special coupons for seller
exports.getSpecialCoupons = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const sellerId = req.user.id;

    const query = { 
      seller: sellerId,
      code: { $ne: null } // Only get coupons with codes
    };
    
    if (status) {
      query.status = status;
    }

    const coupons = await Coupon.find(query)
      .populate('applicableProducts.product', 'name price images')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Coupon.countDocuments(query);

    res.json({
      coupons: coupons.map(coupon => ({
        id: coupon._id,
        name: coupon.name,
        code: coupon.code,
        discountPercentage: coupon.discountPercentage,
        startDate: coupon.startDate,
        endDate: coupon.endDate,
        usageLimit: coupon.usageLimit,
        usageCount: coupon.usageCount,
        status: coupon.status,
        createdAt: coupon.createdAt,
        applicableProducts: coupon.applicableProducts.length > 0 ? 
          coupon.applicableProducts.map(ap => ({
            productId: ap.product._id || ap.product,
            productName: ap.product.name,
            originalPrice: ap.originalPrice,
            discountedPrice: ap.discountedPrice
          })) : 
          'All products'
      })),
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalCoupons: total
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to retrieve special coupons',
      error: error.message
    });
  }
};

// Get available coupon discounts for a product
exports.getProductCoupons = async (req, res) => {
  try {
    const { productId } = req.params;
    const buyerId = req.user.id;

    // Find the product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        message: 'Product not found'
      });
    }

    // Find all valid coupons that can be applied to this product
    const now = new Date();
    const coupons = await Coupon.find({
      status: 'active',
      $or: [
        { endDate: { $gt: now } },
        { endDate: null }
      ],
      $and: [
        { 
          $or: [
            { 'applicableProducts': { $size: 0 } },
            { 'applicableProducts.product': productId }
          ]
        }
      ]
    });

    // Filter out coupons that have reached their usage limit
    const validCoupons = coupons.filter(coupon => 
      !coupon.usageLimit || coupon.usageCount < coupon.usageLimit
    );

    // Format the response
    const availableCoupons = validCoupons.map(coupon => {
      // Calculate discounted price
      const discountedPrice = coupon.discountType === 'percentage'
        ? Math.round((product.price * (100 - coupon.discountPercentage)) / 100)
        : Math.max(0, product.price - (coupon.fixedAmount || 0));
      
      // Check if this product has a specific discount in the coupon
      const productDiscount = coupon.applicableProducts.find(
        ap => ap.product.toString() === productId
      );

      return {
        couponId: coupon._id,
        code: coupon.code,
        name: coupon.name,
        discountType: coupon.discountType,
        discountPercentage: coupon.discountPercentage,
        fixedAmount: coupon.fixedAmount,
        originalPrice: product.price,
        discountedPrice: productDiscount ? productDiscount.discountedPrice : discountedPrice,
        savings: coupon.discountType === 'percentage' ? (product.price * coupon.discountPercentage) / 100 : Math.min(product.price, coupon.fixedAmount || 0),
        validUntil: coupon.endDate,
        usageLimit: coupon.usageLimit,
        usageCount: coupon.usageCount
      };
    });

    res.json({
      productId: product._id,
      productName: product.name,
      originalPrice: product.price,
      availableCoupons
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to retrieve product coupons',
      error: error.message
    });
  }
}; 