const FlashSale = require('../models/FlashSale');
const Product = require('../models/Product');
const { createNotification } = require('./notificationController');

// Create a new flash sale
exports.createFlashSale = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const {
      name,
      discountType,
      discountValue,
      startDate,
      startTime,
      endDate,
      endTime,
      products
    } = req.body;

    // Validate required fields
    if (!name || !discountType || !discountValue || !startDate || !startTime || !products) {
      return res.status(400).json({
        message: 'Missing required fields'
      });
    }

    // Validate products and get their details
    const productIds = products.map(p => p.productId);
    const existingProducts = await Product.find({
      _id: { $in: productIds },
      seller: sellerId
    });

    if (existingProducts.length !== productIds.length) {
      return res.status(400).json({
        message: 'Some products do not belong to the seller or do not exist'
      });
    }

    // Create flash sale products array with calculated discounted prices
    const flashSaleProducts = existingProducts.map(product => {
      const productInput = products.find(p => p.productId.toString() === product._id.toString());
      const discountedPrice = discountType === 'percentage'
        ? product.price - (product.price * (discountValue / 100))
        : product.price - discountValue;

      return {
        product: product._id,
        originalPrice: product.price,
        discountedPrice: Math.max(discountedPrice, 0), // Ensure price doesn't go below 0
        allocatedStock: productInput.allocatedStock,
        status: 'upcoming'
      };
    });

    // Create flash sale
    const flashSale = new FlashSale({
      seller: sellerId,
      name,
      discountType,
      discountValue,
      startDate,
      startTime,
      endDate,
      endTime,
      products: flashSaleProducts
    });

    await flashSale.save();

    // Schedule status updates
    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = endDate ? new Date(`${endDate}T${endTime}`) : null;

    // Schedule start
    setTimeout(async () => {
      await flashSale.updateProductStatuses();
      // Notify seller that flash sale has started
      await createNotification(sellerId, 'flash_sale_started', {
        flashSaleId: flashSale._id,
        flashSaleName: flashSale.name
      });
    }, startDateTime - new Date());

    // Schedule end if end date is provided
    if (endDateTime) {
      setTimeout(async () => {
        await flashSale.updateProductStatuses();
        // Notify seller that flash sale has ended
        await createNotification(sellerId, 'flash_sale_ended', {
          flashSaleId: flashSale._id,
          flashSaleName: flashSale.name
        });
      }, endDateTime - new Date());
    }

    res.status(201).json(flashSale);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to create flash sale',
      error: error.message
    });
  }
};

// Get seller's flash sales
exports.getSellerFlashSales = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const sellerId = req.user.id;

    const query = { seller: sellerId };
    if (status) {
      query.status = status;
    }

    const flashSales = await FlashSale.find(query)
      .populate('products.product', 'name images price')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await FlashSale.countDocuments(query);

    res.json({
      flashSales,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to get flash sales',
      error: error.message
    });
  }
};

// Get active flash sales
exports.getActiveFlashSales = async (req, res) => {
  try {
    const now = new Date();
    
    const activeFlashSales = await FlashSale.find({
      status: 'active',
      startDate: { $lte: now },
      $or: [
        { endDate: { $gt: now } },
        { endDate: null }
      ]
    }).populate('products.product', 'name images price description');

    res.json(activeFlashSales);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to get active flash sales',
      error: error.message
    });
  }
};

// Update flash sale
exports.updateFlashSale = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user.id;
    const updates = req.body;

    const flashSale = await FlashSale.findOne({ _id: id, seller: sellerId });
    if (!flashSale) {
      return res.status(404).json({ message: 'Flash sale not found' });
    }

    // Don't allow updates to active or completed flash sales
    if (['active', 'completed'].includes(flashSale.status)) {
      return res.status(400).json({
        message: 'Cannot update active or completed flash sales'
      });
    }

    // Update flash sale
    Object.assign(flashSale, updates);
    await flashSale.save();

    res.json(flashSale);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to update flash sale',
      error: error.message
    });
  }
};

// Delete flash sale
exports.deleteFlashSale = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user.id;

    const flashSale = await FlashSale.findOneAndDelete({
      _id: id,
      seller: sellerId,
      status: { $nin: ['active', 'completed'] }
    });

    if (!flashSale) {
      return res.status(404).json({
        message: 'Flash sale not found or cannot be deleted'
      });
    }

    res.json({ message: 'Flash sale deleted successfully' });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to delete flash sale',
      error: error.message
    });
  }
}; 