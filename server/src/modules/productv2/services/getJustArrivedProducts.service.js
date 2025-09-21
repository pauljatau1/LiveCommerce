const productRepository = require('../repositories/product.repository');
const { sellerPopulationFields } = require('../helpers/list.helper');

class GetJustArrivedProductsService {
  async execute() {
    const query = { status: 'active', visibility: 'visible' };

    // Sort newest first (same as v1)
    let products = await productRepository.findProductsSorted(query, { createdAt: -1 }, 0, 10);
    await productRepository.populateSeller(products, sellerPopulationFields);

    const productsWithStats = products.map(p => {
      const o = typeof p.toObject === 'function' ? p.toObject() : p;
      return {
        ...o,
        averageRating: o.stats?.averageRating || null,
        reviewCount: o.stats?.totalReviews || 0
      };
    });

    return { data: productsWithStats };
  }
}

module.exports = new GetJustArrivedProductsService();


