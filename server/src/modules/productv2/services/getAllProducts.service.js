const productRepository = require('../repositories/product.repository');
const { sellerPopulationFields } = require('../helpers/list.helper');

class GetAllProductsService {
  async execute(req) {
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

    // Build base query: exclude offline_auction and out-of-stock
    const query = {
      status: { $ne: 'offline_auction' },
      stock: { $gt: 0 }
    };

    // Only add status/visibility filters to the DB query if explicitly provided
    if (Object.prototype.hasOwnProperty.call(req.query, 'status')) {
      query.status = status;
    }
    if (Object.prototype.hasOwnProperty.call(req.query, 'visibility')) {
      query.visibility = visibility;
    }
    if (category) query.category = category;

    if (req.query.minPrice || req.query.maxPrice) {
      query.price = { $gte: Number(minPrice), $lte: Number(maxPrice) };
    }

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

    const products = await productRepository.findProductsSorted(query, sortOptions, (page - 1) * limit, parseInt(limit));
    await productRepository.populateSeller(products, sellerPopulationFields);

    const totalProducts = await productRepository.count(query);
    const totalPages = Math.ceil(totalProducts / limit);

    const productsWithStats = products.map(p => {
      const o = typeof p.toObject === 'function' ? p.toObject() : p;
      return {
        ...o,
        averageRating: o.stats?.averageRating || null,
        reviewCount: o.stats?.totalReviews || 0
      };
    });

    return {
      products: productsWithStats,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalProducts,
        hasNextPage: Number(page) < totalPages,
        hasPrevPage: Number(page) > 1,
        limit: Number(limit)
      },
      filters: {
        category,
        priceRange: { min: Number(minPrice), max: Number(maxPrice) !== Number.MAX_SAFE_INTEGER ? Number(maxPrice) : 'no limit' },
        sortBy,
        status,
        visibility
      }
    };
  }
}

module.exports = new GetAllProductsService();


