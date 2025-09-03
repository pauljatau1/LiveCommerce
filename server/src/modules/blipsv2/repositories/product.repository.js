const Product = require('../../../models/Product');
const Buyer = require('../../../models/Buyer');
const mongoose = require('mongoose');

class ProductRepository {
  async countProductsWithBlips(matchStage) {
    return await Product.countDocuments(matchStage);
  }

  async aggregateProducts(pipeline) {
    return await Product.aggregate(pipeline);
  }

  async populateSellerInfo(products) {
    return await Product.populate(products, {
      path: 'seller',
      select: 'firstName lastName storeName storeAvatar aboutStore stats isFeatured followers'
    });
  }

  async findBuyerById(buyerId) {
    return await Buyer.findById(buyerId).select('followers');
  }

  async findBuyerByIdWithCategories(buyerId) {
    return await mongoose.model('Buyer').findById(buyerId).select('selectedCategories followers');
  }

  async findProductWithBlip(blipId) {
    return await Product.findOne({ 
      'blips._id': blipId,
      blips: { $elemMatch: { _id: blipId, processed: true } },
      status: 'active'
    })
    .populate({
      path: 'seller',
      select: '_id firstName lastName businessName email phoneNumber storeName storeAvatar storeBanner aboutStore stats isVerified createdAt warehouseDetails shippingOptions followers'
    });
  }

  async findRelatedProducts(productId, category) {
    return await Product.find({
      _id: { $ne: productId },
      category: category,
      status: 'active',
      'blips.processed': true 
    })
    .populate({
      path: 'seller',
      select: '_id firstName lastName businessName storeName storeAvatar aboutStore stats isVerified followers'
    })
    .select('_id name blips category subCategory seo.slug price discount stats images variants stock status');
  }

  async findRandomProducts(excludeProductId) {
    return await Product.find({
      _id: { $ne: excludeProductId },
      'blips.0': { $exists: true }, // ensure the product has at least one blip
      'blips.processed': true, // ensure blips are processed
      status: 'active'
    })
    .populate({
      path: 'seller',
      select: '_id firstName lastName businessName storeName storeAvatar aboutStore stats isVerified followers'
    })
    .select('_id name blips category subCategory seo.slug price discount stats images variants stock status');
  }
}

module.exports = new ProductRepository();
