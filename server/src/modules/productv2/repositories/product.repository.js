const Product = require('../../../models/Product');
const mongoose = require('mongoose');

class ProductRepositoryV2 {
  async countProducts(matchStage) {
    return await Product.countDocuments(matchStage);
  }

  async findProducts(matchStage, skip, limit) {
    return await Product.find(matchStage)
      .skip(skip)
      .limit(limit);
  }

  async findProductsSorted(matchStage, sort, skip, limit) {
    return await Product.find(matchStage)
      .sort(sort || {})
      .skip(skip)
      .limit(limit);
  }

  async populateSeller(products, fields) {
    return await Product.populate(products, {
      path: 'seller',
      select: fields.join(' ')
    });
  }

  async populateReviewBuyers(products) {
    return await Product.populate(products, {
      path: 'reviews.buyer',
      select: 'firstName lastName'
    });
  }

  async aggregate(pipeline) {
    return await Product.aggregate(pipeline);
  }

  async count(query) {
    return await Product.countDocuments(query);
  }

  async findById(id) {
    return await Product.findById(id);
  }

  async findByIdPopulate(id, populateOptions) {
    return await Product.findById(id).populate(populateOptions);
  }

  toObjectId(id) {
    return new mongoose.Types.ObjectId(id);
  }
}

module.exports = new ProductRepositoryV2();


