const productRepository = require('../repositories/product.repository');
const { sellerPopulationFields, shuffleArray, reorderToAvoidSellerClusters } = require('../helpers/list.helper');

class GetPersonalizedProductsService {
  async execute(req) {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    // If unauthenticated, fallback to general pool (same behavior as v1)
    const isAuthenticated = !!req.user;

    const baseQuery = {
      status: 'active',
      visibility: 'visible',
      stock: { $gt: 0 },
      status: { $ne: 'offline_auction' }
    };

    // total count
    const totalProducts = await productRepository.countProducts(baseQuery);

    // Random sampling similar to v1
    const maxSkip = Math.max(0, totalProducts - limit);
    const randomSkip = Math.floor(Math.random() * (maxSkip + 1));

    // Maintain DB-level ordering if needed; the v1 fetch uses createdAt -1 after random sampling.
    let products = await productRepository.findProductsSorted(baseQuery, { createdAt: -1 }, randomSkip, limit);

    if (products.length < limit && randomSkip > 0) {
      const remainingLimit = limit - products.length;
      const remainingProducts = await productRepository.findProductsSorted(baseQuery, { createdAt: -1 }, 0, remainingLimit);
      products = [...products, ...remainingProducts];
    }

    // Shuffle and de-cluster
    products = shuffleArray(products);
    products = reorderToAvoidSellerClusters(products);

    // Populate
    await productRepository.populateSeller(products, sellerPopulationFields);
    await productRepository.populateReviewBuyers(products);

    // Add review stats fields like v1
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
      currentPage: page,
      totalPages: Math.ceil(totalProducts / limit),
      totalProducts,
      hasMore: page * limit < totalProducts,
      isPersonalized: isAuthenticated
    };
  }
}

module.exports = new GetPersonalizedProductsService();


