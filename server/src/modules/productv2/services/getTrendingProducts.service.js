const productRepository = require('../repositories/product.repository');
const { sellerPopulationFields } = require('../helpers/list.helper');

class GetTrendingProductsService {
  async execute(req) {
    const trendingQuery = {
      status: 'active',
      visibility: 'visible',
      $or: [
        { 'analytics.views': { $gt: 10 } },
        { 'analytics.orderCount': { $gt: 0 } }
      ]
    };

    const fallbackQuery = { status: 'active', visibility: 'visible' };

    let productCount = await productRepository.count(trendingQuery);
    let queryToUse = trendingQuery;
    if (productCount === 0) {
      queryToUse = fallbackQuery;
      productCount = await productRepository.count(fallbackQuery);
    }

    const limit = Math.min(20, productCount || 0);
    const skip = productCount > limit ? Math.floor(Math.random() * (productCount - limit)) : 0;

    // Keep DB-level ordering stable; v1 doesn't sort here beyond random sampling and shuffle
    let products = await productRepository.findProductsSorted(queryToUse, { createdAt: -1 }, skip, limit);
    await productRepository.populateSeller(products, sellerPopulationFields);

    // Shuffle
    products = products.sort(() => 0.5 - Math.random());

    const productsWithStats = products.map(p => {
      const o = typeof p.toObject === 'function' ? p.toObject() : p;
      return {
        ...o,
        averageRating: o.stats?.averageRating || null,
        reviewCount: o.stats?.totalReviews || 0,
        soldCount: Math.max(0, o.stats?.soldCount || 0)
      };
    });

    return { data: productsWithStats };
  }
}

module.exports = new GetTrendingProductsService();


