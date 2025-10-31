const mongoose = require('mongoose');
const productRepository = require('../repositories/product.repository');
const transformationHelper = require('../helpers/transformation.helper');

class GetProductBlipsService {
  /**
   * Fetch blips attached to a specific product, returning items in the
   * standard blips response shape used across blipsv2 endpoints.
   *
   * Why: Product detail pages (web/mobile) need to render the product's blips
   * consistently with feeds and other blip listings.
   *
   * Behavior:
   * - Filters to processed blips for reliability on client playback
   * - Sorts newest-first by blip createdAt
   * - Supports optional pagination via page/limit (defaults to return all if limit omitted)
   * - Reuses the transformation helper to maintain identical response shape
   */
  async execute(req) {
    const { productId } = req.params;

    // Validate product id early to avoid casting errors in aggregation
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return { error: 'Invalid product id provided', statusCode: 400 };
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limitParam = parseInt(req.query.limit);
    const hasPagination = Number.isFinite(limitParam) && limitParam > 0;
    const limit = hasPagination ? limitParam : 0; // 0 indicates no limit (return all)
    const skip = hasPagination ? (page - 1) * limit : 0;

    const buyerId = req.user?.id;
    const isAuthenticated = !!buyerId && req.user?.role === 'Buyer';

    // Build an aggregation pipeline to project each blip as a separate row
    // and keep minimal product fields required by the transformer
    const basePipeline = [
      { $match: { _id: new mongoose.Types.ObjectId(productId) } },
      { $unwind: '$blips' },
      // Include both processed and unprocessed blips, but prioritize processed ones in sorting
      { $addFields: { isProcessed: { $ifNull: [ '$blips.processed', false ] } } },
      { $sort: { isProcessed: -1, 'blips.createdAt': -1 } },
      {
        $project: {
          _id: 1,
          name: 1,
          price: 1,
          stock: 1,
          status: 1,
          category: 1,
          subCategory: 1,
          seller: 1,
          discount: 1,
          auction: 1,
          images: { $arrayElemAt: [ '$images.url', 0 ] },
          blip: '$blips',
          reviews: 1,
          createdAt: 1
        }
      }
    ];

    // Apply pagination only if requested; otherwise return all blips
    const pipeline = hasPagination
      ? [
          ...basePipeline,
          { $facet: {
              items: [ { $skip: skip }, { $limit: limit } ],
              meta: [ { $count: 'total' } ]
            }
          }
        ]
      : basePipeline;

    // Execute aggregation
    let productsOrFaceted;
    try {
      productsOrFaceted = await productRepository.aggregateProducts(pipeline);
    } catch (error) {
      return { error: 'Failed to fetch product blips', statusCode: 500, details: error.message };
    }

    // Normalize results depending on pagination usage
    let products = [];
    let totalBlips = 0;
    if (hasPagination) {
      const facet = productsOrFaceted[0] || { items: [], meta: [] };
      products = facet.items || [];
      totalBlips = (facet.meta && facet.meta[0] && facet.meta[0].total) ? facet.meta[0].total : 0;
    } else {
      products = productsOrFaceted;
      totalBlips = products.length;
    }

    // Populate seller info required by the transformer
    await productRepository.populateSellerInfo(products);

    // Transform into standard blips payload
    const transformed = transformationHelper.transformProductsToBlips(
      products,
      buyerId,
      isAuthenticated,
      [] // followed sellers not relevant for product-specific listing
    );

    return {
      blips: transformed,
      currentPage: hasPagination ? page : 1,
      totalPages: hasPagination ? Math.ceil(totalBlips / limit) : 1,
      totalBlips
    };
  }
}

module.exports = new GetProductBlipsService();


