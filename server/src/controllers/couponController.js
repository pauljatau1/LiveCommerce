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
      productDiscounts, // Array of { productId, discountedPrice }
      usageLimit
    } = req.body;

    // Validate required fields
    if (!name || !code || !discountPercentage || !startDate || !productDiscounts) {
      return res.status(400).json({
        message: 'Missing required fields'
      });
    }

    // Get all product IDs from the productDiscounts array
    const productIds = productDiscounts.map(pd => pd.productId);

    // Validate products belong to seller and get their original prices
    const products = await Product.find({
      _id: { $in: productIds },
      seller: sellerId
    });

    if (products.length !== productIds.length) {
      return res.status(400).json({
        message: 'Some products do not belong to the seller'
      });
    }

    // Create applicableProducts array with original and discounted prices
    const applicableProducts = products.map(product => {
      const discountInfo = productDiscounts.find(
        pd => pd.productId.toString() === product._id.toString()
      );
      
      // Validate discounted price is less than original price
      if (discountInfo.discountedPrice >= product.price) {
        throw new Error(`Discounted price for ${product.name} must be less than original price`);
      }

      return {
        product: product._id,
        originalPrice: product.price,
        discountedPrice: discountInfo.discountedPrice
      };
    });

    // Create coupon
    const coupon = new Coupon({
      seller: sellerId,
      name,
      code: code.toUpperCase(),
      discountPercentage,
      hasMinimumRequirement,
      minimumAmount: hasMinimumRequirement ? minimumAmount : 0,
      startDate,
      endDate,
      customerEligibility,
      applicableProducts,
      usageLimit
    });

    await coupon.save();

    // Populate product details for response
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

    const coupon = await Coupon.findOneAndDelete({ _id: id, seller: sellerId });
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    res.json({ message: 'Coupon deleted successfully' });
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