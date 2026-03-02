const productRepository = require('../repositories/product.repository');

class GetSellerProductsService {
    async execute(req) {
        const sellerId = req.user.id;
        const {
            page = 1,
            limit = 10,
            category = '',
            minPrice = 0,
            maxPrice = Number.MAX_SAFE_INTEGER,
            sortBy = 'newest',
            status, // Optional status filter
            visibility // Optional visibility filter
        } = req.query;

        // Base query: match the seller
        const query = {
            seller: sellerId
        };

        // Apply filters
        if (status) {
            query.status = status;
        }

        if (visibility) {
            query.visibility = visibility;
        }

        if (category) {
            query.category = category;
        }

        if (req.query.minPrice || req.query.maxPrice) {
            query.price = {
                $gte: Number(minPrice),
                $lte: Number(maxPrice)
            };
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

        // We might not need to populate seller since we ARE the seller, but keeping consistency with getAllProducts might be good 
        // or we can populate structure required by frontend.
        // getAllProducts calls `populateSeller`.
        // Let's populate just in case legacy frontend relies on it.
        // const { sellerPopulationFields } = require('../helpers/list.helper');
        // await productRepository.populateSeller(products, sellerPopulationFields);

        const totalProducts = await productRepository.count(query);
        const totalPages = Math.ceil(totalProducts / limit);

        const productsWithStats = products.map(p => {
            const o = typeof p.toObject === 'function' ? p.toObject() : p;
            return {
                ...o,
                averageRating: o.stats?.averageRating || null,
                reviewCount: o.stats?.totalReviews || 0,
                soldCount: Math.max(0, o.stats?.soldCount || 0)
            };
        });

        return {
            status: 200,
            body: {
                success: true,
                data: {
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
                }
            }
        };
    }
}

module.exports = new GetSellerProductsService();
