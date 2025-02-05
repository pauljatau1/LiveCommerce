const Coupon = require('../models/Coupon');
const Product = require('../models/Product');
const Seller = require('../models/Seller');

// Create a new coupon
exports.createCoupon = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const {
      name,
      code,
      discountPercentage,
      hasMinimumRequirement,
      minimumAmount,
      startDate,
      endDate,
      customerEligibility,
      productDiscounts,
      usageLimit
    } = req.body;

    // Validate required fields (remove code from required fields)
    if (!name || !discountPercentage || !productDiscounts) {
      return res.status(400).json({
        message: 'Missing required fields'
      });
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
      
      // Validate discounted price is less than original price
      if (discountInfo.discountedPrice >= product.price) {
        throw new Error(`Discounted price for ${product.name} must be less than original price`);
      }

      // Calculate discount percentage
      const discountValue = ((product.price - discountInfo.discountedPrice) / product.price) * 100;
      
      // Update product's discount information and its variants
      await Product.findByIdAndUpdate(product._id, {
        discount: {
          isActive: true,
          type: 'percentage',
          value: discountValue,
          startDate: startDate || new Date(),
          endDate: endDate,
          couponName: name,
          discountedPrice: discountInfo.discountedPrice
        },
        'pricing.discountInfo': {
          isActive: true,
          type: 'percentage',
          value: discountValue,
          startDate: startDate || new Date(),
          endDate: endDate,
          couponName: name,
          discountedPrice: discountInfo.discountedPrice
        },
        // Apply same discount to all variants
        $set: {
          'variants.$[].discount': {
            isActive: true,
            type: 'percentage',
            value: discountValue,
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
          const variantDiscountedPrice = Math.round((variant.price * (100 - discountValue)) / 100);
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
        discountedPrice: discountInfo.discountedPrice,
        status: 'active'
      };
    }));

    // Create coupon
    const coupon = new Coupon({
      seller: sellerId,
      name,
      code: code ? code.toUpperCase() : undefined,
      discountPercentage,
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
        discount: ((ap.originalPrice - ap.discountedPrice) / ap.originalPrice * 100).toFixed(2) + '%',
        validUntil: coupon.endDate
      }));

    res.json({
      valid: true,
      status: 'active',
      discountPercentage: coupon.discountPercentage,
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