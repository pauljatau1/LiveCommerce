const productRepository = require('../repositories/product.repository');
const categoryHelper = require('../helpers/category.helper');

/**
 * GetBlipsCategoriesService
 * Service for fetching blips categories with statistics
 * 
 * For authenticated users: Returns their selected categories with stats
 * For non-authenticated users: Returns popular categories with high blip counts
 */
class GetBlipsCategoriesService {
  /**
   * Execute the service to get blips categories
   * @param {Object} req - Express request object
   * @returns {Promise<Object>} Categories with statistics
   */
  async execute(req) {
    try {
      const buyerId = req.user?.id;
      const isAuthenticated = !!buyerId && req.user?.role === 'Buyer';

      console.log(`📊 [BLIPS CATEGORIES] Processing request for ${isAuthenticated ? 'authenticated' : 'non-authenticated'} user`);

      if (isAuthenticated) {
        return await this.getUserCategories(buyerId);
      } else {
        return await this.getPopularCategories();
      }
    } catch (error) {
      console.error('❌ [BLIPS CATEGORIES] Service error:', error);
      throw error;
    }
  }

  /**
   * Enrich category stats with image URLs from Category collection
   * @param {Array<{name: string}>} categories
   * @returns {Promise<Array<{imageUrl?: string}>>}
   */
  async enrichWithCategoryImages(categories) {
    try {
      const names = categories.map(c => c.name).filter(Boolean);
      if (names.length === 0) return categories;

      const images = await productRepository.findCategoryImagesByNames(names);
      const nameToImage = new Map(images.map(i => [i.name, { id: i.id, imageUrl: i.imageUrl } ]));

      return categories.map(cat => {
        const found = nameToImage.get(cat.name);
        return {
          ...cat,
          categoryId: found?.id || null,
          imageUrl: found?.imageUrl || null
        };
      });
    } catch (e) {
      console.error('⚠️ [BLIPS CATEGORIES] Failed to enrich with category images:', e.message);
      return categories;
    }
  }

  /**
   * Get categories for authenticated users based on their selected categories
   * @param {string} buyerId - The buyer's ID
   * @returns {Promise<Object>} User's categories with statistics
   */
  async getUserCategories(buyerId) {
    try {
      console.log(`👤 [BLIPS CATEGORIES] Fetching categories for authenticated user: ${buyerId}`);

      // Get buyer's selected categories
      const buyer = await productRepository.findBuyerByIdWithCategories(buyerId);
      
      if (!buyer) {
        console.log('👤 [BLIPS CATEGORIES] Buyer not found, falling back to popular categories');
        return await this.getPopularCategories();
      }

      // Extract category names from buyer's selected categories
      const categoryNames = categoryHelper.extractCategoryNames(buyer.selectedCategories);
      
      if (!categoryNames || categoryNames.length === 0) {
        console.log('👤 [BLIPS CATEGORIES] No selected categories found, falling back to popular categories');
        return await this.getPopularCategories();
      }

      console.log(`👤 [BLIPS CATEGORIES] Found ${categoryNames.length} selected categories: ${categoryNames.join(', ')}`);

      // Debug: Check what categories actually exist in products with blips
      console.log('🔍 [BLIPS CATEGORIES] Debugging - checking available categories in products...');
      const debugPipeline = [
        {
          $match: {
            'blips.0': { $exists: true },
            'blips.processed': true,
            status: { $ne: 'draft' }
          }
        },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        },
        {
          $limit: 10
        }
      ];
      
      const availableCategories = await productRepository.aggregateProducts(debugPipeline);
      console.log('🔍 [BLIPS CATEGORIES] Available categories in products:', availableCategories);

      // Get statistics for each selected category
      const categoriesWithStats = await this.getCategoriesStatistics(categoryNames);

      // If no categories found for user's preferences, fallback to popular categories
      if (categoriesWithStats.length === 0) {
        console.log('👤 [BLIPS CATEGORIES] No categories found for user preferences, falling back to popular categories');
        const popularCategories = await this.getPopularCategories();
        const enriched = await this.enrichWithCategoryImages(popularCategories.categories);
        return {
          categories: enriched,
          totalCategories: popularCategories.totalCategories,
          isPersonalized: false,
          message: 'Popular categories (your preferences not found in current products)'
        };
      }

      // If we found some categories but not many, supplement with popular categories
      if (categoriesWithStats.length < 3) {
        console.log(`👤 [BLIPS CATEGORIES] Found only ${categoriesWithStats.length} categories for user preferences, supplementing with popular categories`);
        const popularCategories = await this.getPopularCategories();
        
        // Combine user categories with popular categories, avoiding duplicates
        const userCategoryNames = categoriesWithStats.map(cat => cat.name);
        const additionalCategories = popularCategories.categories.filter(
          cat => !userCategoryNames.includes(cat.name)
        );
        
        const combinedCategories = [
          ...categoriesWithStats,
          ...additionalCategories.slice(0, 6 - categoriesWithStats.length)
        ];

        const enriched = await this.enrichWithCategoryImages(combinedCategories);
        return {
          categories: enriched,
          totalCategories: combinedCategories.length,
          isPersonalized: true,
          message: 'Categories based on your preferences (supplemented with popular categories)'
        };
      }

      const enriched = await this.enrichWithCategoryImages(categoriesWithStats);
      return {
        categories: enriched,
        totalCategories: categoriesWithStats.length,
        isPersonalized: true,
        message: 'Categories based on your preferences'
      };
    } catch (error) {
      console.error('❌ [BLIPS CATEGORIES] Error getting user categories:', error);
      // Fallback to popular categories on error
      return await this.getPopularCategories();
    }
  }

  /**
   * Get popular categories for non-authenticated users
   * @returns {Promise<Object>} Popular categories with statistics
   */
  async getPopularCategories() {
    try {
      console.log('🌐 [BLIPS CATEGORIES] Fetching popular categories for non-authenticated user');

      // Get categories with the highest number of blips
      const popularCategoriesPipeline = [
        {
          $match: {
            'blips.0': { $exists: true },
            status: { $ne: 'draft' },
            $or: [
              { status: { $ne: 'offline_auction' } },
              { $and: [{ status: 'offline_auction' }, { 'auction.status': { $ne: 'ended' } }] }
            ]
          }
        },
        {
          $unwind: '$blips'
        },
        {
          $group: {
            _id: '$category',
            totalBlips: { $sum: 1 },
            totalProducts: { $addToSet: '$_id' },
            totalViews: { $sum: { $ifNull: ['$blips.viewCount', 0] } },
            totalLikes: { $sum: { $ifNull: ['$blips.likesCount', 0] } },
            totalComments: { $sum: { $ifNull: ['$blips.commentsCount', 0] } },
            avgEngagement: {
              $avg: {
                $add: [
                  { $ifNull: ['$blips.viewCount', 0] },
                  { $multiply: [{ $ifNull: ['$blips.likesCount', 0] }, 5] },
                  { $multiply: [{ $ifNull: ['$blips.commentsCount', 0] }, 10] }
                ]
              }
            }
          }
        },
        {
          $addFields: {
            totalProducts: { $size: '$totalProducts' }
          }
        },
        {
          $match: {
            _id: { $ne: null, $ne: '' },
            totalBlips: { $gte: 3 } // Only include categories with at least 3 blips
          }
        },
        {
          $sort: { totalBlips: -1, avgEngagement: -1 }
        },
        {
          $limit: 10 // Limit to top 10 popular categories
        },
        {
          $project: {
            _id: 0,
            name: '$_id',
            totalBlips: 1,
            totalProducts: 1,
            totalViews: 1,
            totalLikes: 1,
            totalComments: 1,
            avgEngagement: { $round: ['$avgEngagement', 2] }
          }
        }
      ];

      const popularCategories = await productRepository.aggregateProducts(popularCategoriesPipeline);

      console.log(`🌐 [BLIPS CATEGORIES] Found ${popularCategories.length} popular categories`);

      const enriched = await this.enrichWithCategoryImages(popularCategories);
      return {
        categories: enriched,
        totalCategories: popularCategories.length,
        isPersonalized: false,
        message: 'Popular categories with high engagement'
      };
    } catch (error) {
      console.error('❌ [BLIPS CATEGORIES] Error getting popular categories:', error);
      throw error;
    }
  }

  /**
   * Get statistics for specific categories
   * @param {Array<string>} categoryNames - Array of category names
   * @returns {Promise<Array>} Categories with their statistics
   */
  async getCategoriesStatistics(categoryNames) {
    try {
      console.log(`📊 [BLIPS CATEGORIES] Getting statistics for ${categoryNames.length} categories`);
      console.log(`📊 [BLIPS CATEGORIES] Looking for categories: [${categoryNames.map(c => `"${c}"`).join(', ')}]`);

      // Create flexible matching patterns for better category matching
      const categoryPatterns = this.createCategoryPatterns(categoryNames);
      console.log(`📊 [BLIPS CATEGORIES] Using patterns: [${categoryPatterns.map(c => `"${c}"`).join(', ')}]`);

      const categoriesStatsPipeline = [
        {
          $match: {
            $or: [
              { category: { $in: categoryNames } }, // Exact match
              { category: { $in: categoryPatterns } }, // Pattern match
              { category: { $regex: this.createRegexPattern(categoryNames), $options: 'i' } } // Fuzzy match
            ],
            'blips.0': { $exists: true },
            status: { $ne: 'draft' },
            $or: [
              { status: { $ne: 'offline_auction' } },
              { $and: [{ status: 'offline_auction' }, { 'auction.status': { $ne: 'ended' } }] }
            ]
          }
        },
        {
          $unwind: '$blips'
        },
        {
          $group: {
            _id: '$category',
            totalBlips: { $sum: 1 },
            totalProducts: { $addToSet: '$_id' },
            totalViews: { $sum: { $ifNull: ['$blips.viewCount', 0] } },
            totalLikes: { $sum: { $ifNull: ['$blips.likesCount', 0] } },
            totalComments: { $sum: { $ifNull: ['$blips.commentsCount', 0] } },
            avgEngagement: {
              $avg: {
                $add: [
                  { $ifNull: ['$blips.viewCount', 0] },
                  { $multiply: [{ $ifNull: ['$blips.likesCount', 0] }, 5] },
                  { $multiply: [{ $ifNull: ['$blips.commentsCount', 0] }, 10] }
                ]
              }
            }
          }
        },
        {
          $addFields: {
            totalProducts: { $size: '$totalProducts' }
          }
        },
        {
          $sort: { totalBlips: -1, avgEngagement: -1 }
        },
        {
          $project: {
            _id: 0,
            name: '$_id',
            totalBlips: 1,
            totalProducts: 1,
            totalViews: 1,
            totalLikes: 1,
            totalComments: 1,
            avgEngagement: { $round: ['$avgEngagement', 2] }
          }
        }
      ];

      // Debug: Check how many products match the initial filter
      const debugMatchPipeline = [
        {
          $match: {
            category: { $in: categoryNames },
            'blips.0': { $exists: true },
            'blips.processed': true,
            status: { $ne: 'draft' },
            $or: [
              { status: { $ne: 'offline_auction' } },
              { $and: [{ status: 'offline_auction' }, { 'auction.status': { $ne: 'ended' } }] }
            ]
          }
        },
        {
          $group: {
            _id: '$category',
            productCount: { $sum: 1 }
          }
        }
      ];
      
      const debugMatch = await productRepository.aggregateProducts(debugMatchPipeline);
      console.log(`🔍 [BLIPS CATEGORIES] Products matching selected categories:`, debugMatch);

      const categoriesStats = await productRepository.aggregateProducts(categoriesStatsPipeline);

      console.log(`📊 [BLIPS CATEGORIES] Retrieved statistics for ${categoriesStats.length} categories`);

      return categoriesStats;
    } catch (error) {
      console.error('❌ [BLIPS CATEGORIES] Error getting categories statistics:', error);
      throw error;
    }
  }

  /**
   * Create flexible category patterns for better matching
   * @param {Array<string>} categoryNames - Array of category names
   * @returns {Array<string>} Array of pattern variations
   */
  createCategoryPatterns(categoryNames) {
    const patterns = [];
    
    // Common category mappings
    const categoryMappings = {
      'smartphones': ['phones', 'mobile phones', 'cell phones'],
      'phones': ['smartphones', 'mobile phones', 'cell phones'],
      'laptops': ['computers', 'computing', 'laptop computers'],
      'tablets': ['ipads', 'tablet computers'],
      'fashion': ['clothing', 'apparel', 'women dresses', 'men clothing'],
      'accessories': ['phone accessories', 'laptop accessories', 'wearable accessories'],
      'electronics': ['gadgets', 'tech', 'technology'],
      'jewelry': ['jewelry', 'watches', 'men jewelry', 'women watches'],
      'shoes': ['footwear', 'sneakers', 'boots'],
      'bags': ['handbags', 'purses', 'women bags & purses']
    };

    categoryNames.forEach(category => {
      const lowerCategory = category.toLowerCase();
      
      // Add exact match
      patterns.push(category);
      
      // Add mapped variations
      if (categoryMappings[lowerCategory]) {
        patterns.push(...categoryMappings[lowerCategory]);
      }
      
      // Add partial matches (remove common words)
      const simplified = category.replace(/\b(women|men|kids|refurbished|region-specific)\b/gi, '').trim();
      if (simplified !== category && simplified.length > 0) {
        patterns.push(simplified);
      }
    });

    // Remove duplicates and return
    return [...new Set(patterns)];
  }

  /**
   * Create regex pattern for fuzzy matching
   * @param {Array<string>} categoryNames - Array of category names
   * @returns {string} Regex pattern string
   */
  createRegexPattern(categoryNames) {
    const patterns = categoryNames.map(category => {
      // Escape special regex characters and create flexible patterns
      const escaped = category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return `(${escaped})`;
    });
    
    return patterns.join('|');
  }
}

module.exports = new GetBlipsCategoriesService();
