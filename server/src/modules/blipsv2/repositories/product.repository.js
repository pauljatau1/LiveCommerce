const Product = require('../../../models/Product');
const Buyer = require('../../../models/Buyer');
const Category = require('../../../models/Category');
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

  /**
   * Finds a buyer by ID and returns only their followers
   * Used for basic buyer information lookup
   * @param {string} buyerId - The buyer's MongoDB ObjectId
   * @returns {Promise<Object>} Buyer object with followers field
   */
  async findBuyerById(buyerId) {
    return await Buyer.findById(buyerId).select('followers');
  }

  /**
   * Finds a buyer by ID and returns their selected categories and followers
   * Used for personalized blips algorithm to match buyer's category preferences
   * @param {string} buyerId - The buyer's MongoDB ObjectId
   * @returns {Promise<Object>} Buyer object with selectedCategories and followers fields
   */
  async findBuyerByIdWithCategories(buyerId) {
    return await Buyer.findById(buyerId).select('selectedCategories followers');
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

  /**
   * Finds a product that contains the given blipId regardless of blip processed
   * state or product status. Intended for validation/error messaging.
   * @param {string} blipId
   * @returns {Promise<Object|null>} Product with blips array
   */
  async findProductContainingBlipAnyStatus(blipId) {
    return await Product.findOne({ 'blips._id': blipId }).select('_id status blips');
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

  /**
   * Finds a product that contains the given blipId regardless of processed/status,
   * and populates seller info to support blip transformation.
   * @param {string} blipId
   * @returns {Promise<Object|null>}
   */
  async findProductWithBlipAnyStatus(blipId) {
    return await Product.findOne({ 'blips._id': blipId })
      .populate({
        path: 'seller',
        select: '_id firstName lastName businessName email phoneNumber storeName storeAvatar storeBanner aboutStore stats isVerified createdAt warehouseDetails shippingOptions followers'
      });
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

  /**
   * Fetches category images for a list of category names
   * Returns an array of { name, imageUrl }
   * @param {string[]} categoryNames
   * @returns {Promise<Array<{name: string, imageUrl: string|null}>>}
   */
  async findCategoryImagesByNames(categoryNames) {
    if (!Array.isArray(categoryNames) || categoryNames.length === 0) {
      return [];
    }

    const uniqueNames = [...new Set(categoryNames.filter(Boolean))];
    // Pass 1: Exact matches
    const exactDocs = await Category.find({ name: { $in: uniqueNames } }).select('_id name image.url');
    const foundNames = new Set(exactDocs.map(d => d.name));
    const remaining = uniqueNames.filter(n => !foundNames.has(n));

    let results = [...exactDocs];

    // Pass 2: Case-insensitive regex matches for remaining
    if (remaining.length > 0) {
      const regexOr = remaining.map(n => ({ name: { $regex: `^${escapeRegex(n)}$`, $options: 'i' } }));
      if (regexOr.length > 0) {
        const ciDocs = await Category.find({ $or: regexOr }).select('_id name image.url');
        results.push(...ciDocs);
        ciDocs.forEach(d => foundNames.add(d.name));
      }
    }

    // Pass 3: Slug/normalized fallback match against all categories (avoids extra roundtrips)
    const stillRemaining = uniqueNames.filter(n => !Array.from(foundNames).some(fn => fn.toLowerCase() === n.toLowerCase()));
    if (stillRemaining.length > 0) {
      const all = await Category.find({}).select('_id name image.url');
      const toSlug = (s) => s
        .toString()
        .trim()
        .toLowerCase()
        .normalize('NFKD')
        .replace(/\p{Diacritic}+/gu, '')
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const allBySlug = new Map(all.map(d => [toSlug(d.name), d]));
      for (const name of stillRemaining) {
        const slug = toSlug(name);
        const match = allBySlug.get(slug);
        if (match) {
          results.push(match);
        }
      }
    }

    // Deduplicate by name (prefer earlier passes)
    const nameSeen = new Set();
    const deduped = [];
    for (const doc of results) {
      if (nameSeen.has(doc.name)) continue;
      nameSeen.add(doc.name);
      deduped.push(doc);
    }

    return deduped.map(doc => ({
      id: doc._id,
      name: doc.name,
      imageUrl: doc?.image?.url || null
    }));
  }
}

// Escapes regex special characters in a string
function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = new ProductRepository();
