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
      const searchQuery = (req.query?.query || '').trim().toLowerCase();
      const page = parseInt(req.query?.page) || 1;
      const limit = parseInt(req.query?.limit) || 10;

      console.log(`📊 [BLIPS CATEGORIES] Processing request for ${isAuthenticated ? 'authenticated' : 'non-authenticated'} user`);

      if (isAuthenticated) {
        return await this.getUserCategories(buyerId, searchQuery, page, limit);
      } else {
        return await this.getPopularCategories(searchQuery, page, limit);
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
   * Personalization: User's selected categories are always shown first (at least first 5 if available),
   * followed by popular categories to ensure data is always returned
   * @param {string} buyerId - The buyer's ID
   * @param {string} searchQuery - Optional search query to filter categories
   * @param {number} page - Page number for pagination
   * @param {number} limit - Number of categories per page
   * @returns {Promise<Object>} User's categories with statistics, prioritized with user's selected categories first
   */
  async getUserCategories(buyerId, searchQuery, page, limit) {
    try {
      console.log(`👤 [BLIPS CATEGORIES] Fetching personalized categories for authenticated user: ${buyerId}`);

      // Get buyer's selected categories
      const buyer = await productRepository.findBuyerByIdWithCategories(buyerId);
      
      if (!buyer) {
        console.log('👤 [BLIPS CATEGORIES] Buyer not found, falling back to popular categories');
        return await this.getPopularCategories(searchQuery, page, limit);
      }

      // Extract category names from buyer's selected categories
      const categoryNames = categoryHelper.extractCategoryNames(buyer.selectedCategories);
      
      if (!categoryNames || categoryNames.length === 0) {
        console.log('👤 [BLIPS CATEGORIES] No selected categories found, falling back to popular categories');
        return await this.getPopularCategories(searchQuery, page, limit);
      }

      console.log(`👤 [BLIPS CATEGORIES] Found ${categoryNames.length} selected categories: ${categoryNames.join(', ')}`);

      // Get statistics for user's selected categories
      // This will return categories that actually exist in products with blips
      const userCategoriesWithStats = await this.getCategoriesStatistics(categoryNames);
      
      console.log(`👤 [BLIPS CATEGORIES] Found ${userCategoriesWithStats.length} user categories with blips available`);

      // Personalization: Always prioritize user's selected categories first
      // Take at least first 5 user categories (or all if less than 5)
      const minUserCategories = Math.min(5, userCategoriesWithStats.length);
      const prioritizedUserCategories = userCategoriesWithStats.slice(0, minUserCategories);
      
      // Calculate how many more categories we need to reach minimum of 10
      const minTotalCategories = 10;
      const remainingNeeded = Math.max(0, minTotalCategories - prioritizedUserCategories.length);
      
      console.log(`👤 [BLIPS CATEGORIES] Need ${remainingNeeded} more categories to reach minimum of ${minTotalCategories}`);

      // Get popular categories to supplement (with at least 3 blips requirement)
      const popularCategoriesResult = await this.getPopularCategories('', 1, 50);
      const popularCategories = popularCategoriesResult.categories || [];

      // Create a map of user category names for quick lookup
      const userCategoryNamesSet = new Set(prioritizedUserCategories.map(cat => cat.name.toLowerCase()));

      // Filter out popular categories that are already in user's categories (avoid duplicates)
      let additionalPopularCategories = popularCategories.filter(
        cat => !userCategoryNamesSet.has((cat.name || '').toLowerCase())
      );

      // If we still don't have enough categories (less than 10 total), get categories with lower threshold (1 blip minimum)
      const currentTotal = prioritizedUserCategories.length + additionalPopularCategories.length;
      if (currentTotal < minTotalCategories) {
        console.log(`👤 [BLIPS CATEGORIES] Only have ${currentTotal} categories, fetching additional categories with lower threshold (1+ blips)`);
        
        const additionalCategories = await this.getCategoriesWithLowThreshold(prioritizedUserCategories, additionalPopularCategories, minTotalCategories - currentTotal);
        additionalPopularCategories = [...additionalPopularCategories, ...additionalCategories];
      }

      // Combine: User's categories first (at least first 5), then popular categories
      const combinedCategories = [
        ...prioritizedUserCategories,
        ...additionalPopularCategories
      ];

      console.log(`👤 [BLIPS CATEGORIES] Combined categories: ${prioritizedUserCategories.length} user categories + ${additionalPopularCategories.length} popular categories = ${combinedCategories.length} total`);

      // Apply search filter if present
      const filteredCategories = searchQuery
        ? combinedCategories.filter(c => (c?.name || '').toLowerCase().includes(searchQuery))
        : combinedCategories;

      // Ensure we always have at least 10 categories (or as many as available if less than 10 exist)
      // If filtering removed too many, use unfiltered to ensure minimum
      let finalCategories = filteredCategories.length >= minTotalCategories 
        ? filteredCategories 
        : (filteredCategories.length > 0 ? filteredCategories : combinedCategories);

      // If we still don't have enough after filtering, try to get more from unfiltered
      if (finalCategories.length < minTotalCategories && combinedCategories.length > finalCategories.length) {
        // Add more from unfiltered combined list
        const missing = minTotalCategories - finalCategories.length;
        const additionalFromUnfiltered = combinedCategories
          .filter(cat => !finalCategories.some(fc => fc.name === cat.name))
          .slice(0, missing);
        finalCategories = [...finalCategories, ...additionalFromUnfiltered];
      }

      // Ensure minimum of 10 categories (or all available if less than 10 exist in total)
      // This ensures we always return a good amount of categories
      const minCategoriesToReturn = Math.min(minTotalCategories, finalCategories.length);

      // Pagination - but ensure we return at least the minimum on first page
      const total = finalCategories.length;
      let startIndex, endIndex;
      
      if (page === 1) {
        // On first page, return at least minTotalCategories (or all if less)
        startIndex = 0;
        endIndex = Math.max(minCategoriesToReturn, limit);
      } else {
        // On subsequent pages, use normal pagination
        startIndex = (page - 1) * limit;
        endIndex = startIndex + limit;
      }
      
      const pageItems = finalCategories.slice(startIndex, endIndex);

      // Enrich with category images
      const enriched = await this.enrichWithCategoryImages(pageItems);

      // Determine if personalized (has user's categories)
      const isPersonalized = prioritizedUserCategories.length > 0;
      const message = isPersonalized
        ? `Your selected categories (${prioritizedUserCategories.length} shown first) + popular categories`
        : 'Popular categories';

      console.log(`👤 [BLIPS CATEGORIES] Returning ${enriched.length} categories (page ${page}/${Math.ceil(total / limit)})`);

      return {
        categories: enriched,
        totalCategories: total,
        currentPage: page,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        isPersonalized,
        message
      };
    } catch (error) {
      console.error('❌ [BLIPS CATEGORIES] Error getting user categories:', error);
      // Fallback to popular categories on error to ensure data is always returned
      return await this.getPopularCategories(searchQuery, page, limit);
    }
  }

  /**
   * Get categories with lower threshold (1+ blips) to fill up minimum category count
   * Used when we need more categories to reach the minimum of 10
   * @param {Array} existingUserCategories - User's categories already included
   * @param {Array} existingPopularCategories - Popular categories already included
   * @param {number} neededCount - Number of additional categories needed
   * @returns {Promise<Array>} Additional categories with at least 1 blip
   */
  async getCategoriesWithLowThreshold(existingUserCategories, existingPopularCategories, neededCount) {
    try {
      // Create set of already included category names (case-insensitive)
      const existingNames = new Set([
        ...existingUserCategories.map(c => (c.name || '').toLowerCase()),
        ...existingPopularCategories.map(c => (c.name || '').toLowerCase())
      ]);

      // Get all categories with at least 1 blip (lower threshold)
      const lowThresholdPipeline = [
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
          $match: {
            'blips.processed': true
          }
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
            totalBlips: { $gte: 1 } // Lower threshold: at least 1 blip
          }
        },
        {
          $sort: { totalBlips: -1, avgEngagement: -1 }
        },
        {
          $limit: neededCount + 20 // Get extra to filter out duplicates
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

      const allCategories = await productRepository.aggregateProducts(lowThresholdPipeline);
      
      // Filter out categories that are already included
      const additionalCategories = allCategories
        .filter(cat => !existingNames.has((cat.name || '').toLowerCase()))
        .slice(0, neededCount);

      console.log(`👤 [BLIPS CATEGORIES] Found ${additionalCategories.length} additional categories with low threshold (1+ blips)`);
      
      return additionalCategories;
    } catch (error) {
      console.error('❌ [BLIPS CATEGORIES] Error getting categories with low threshold:', error);
      return [];
    }
  }

  /**
   * Get popular categories for non-authenticated users or as supplement for authenticated users
   * @param {string} searchQuery - Optional search query to filter categories
   * @param {number} page - Page number for pagination
   * @param {number} limit - Number of categories per page (can be higher when used as supplement)
   * @returns {Promise<Object>} Popular categories with statistics
   */
  async getPopularCategories(searchQuery, page, limit) {
    try {
      console.log('🌐 [BLIPS CATEGORIES] Fetching popular categories');

      // Calculate how many categories to fetch from database
      // If used as supplement, we may need more than the page limit
      const fetchLimit = Math.max(limit, 50); // Fetch at least 50 for supplementing user categories

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
          $limit: fetchLimit // Fetch enough categories for supplementing
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

      let popularCategories = await productRepository.aggregateProducts(popularCategoriesPipeline);

      console.log(`🌐 [BLIPS CATEGORIES] Found ${popularCategories.length} popular categories with 3+ blips`);

      // If we don't have enough categories (less than 10) and this is a direct call (not supplement),
      // fetch additional categories with lower threshold (1+ blips)
      const minTotalCategories = 10;
      const isSupplementCall = limit >= 50;
      
      if (!isSupplementCall && popularCategories.length < minTotalCategories) {
        console.log(`🌐 [BLIPS CATEGORIES] Only found ${popularCategories.length} categories with 3+ blips, fetching additional with 1+ blips`);
        
        // Get additional categories with 1+ blips
        const lowThresholdPipeline = [
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
            $match: {
              'blips.processed': true
            }
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
              totalBlips: { $gte: 1 } // Lower threshold: at least 1 blip
            }
          },
          {
            $sort: { totalBlips: -1, avgEngagement: -1 }
          },
          {
            $limit: minTotalCategories + 10 // Get extra to filter out duplicates
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

        const allCategories = await productRepository.aggregateProducts(lowThresholdPipeline);
        
        // Create set of existing category names
        const existingNames = new Set(popularCategories.map(c => (c.name || '').toLowerCase()));
        
        // Add additional categories that aren't already in the list
        const additionalCategories = allCategories
          .filter(cat => !existingNames.has((cat.name || '').toLowerCase()))
          .slice(0, minTotalCategories - popularCategories.length);
        
        popularCategories = [...popularCategories, ...additionalCategories];
        console.log(`🌐 [BLIPS CATEGORIES] Added ${additionalCategories.length} additional categories, total: ${popularCategories.length}`);
      }

      // Apply search filter if present
      const filtered = searchQuery
        ? popularCategories.filter(c => (c?.name || '').toLowerCase().includes(searchQuery))
        : popularCategories;

      // If limit is high (used as supplement), return all categories without pagination
      // Otherwise, apply pagination for direct calls
      let finalCategories, total, currentPage, totalPages;
      
      if (isSupplementCall) {
        // Return all categories when used as supplement (no pagination)
        finalCategories = filtered;
        total = filtered.length;
        currentPage = 1;
        totalPages = 1;
      } else {
        // Apply pagination for direct calls, but ensure at least 10 on first page
        total = filtered.length;
        let startIndex, endIndex;
        
        if (page === 1) {
          // On first page, return at least minTotalCategories (or all if less)
          startIndex = 0;
          endIndex = Math.max(minTotalCategories, limit);
        } else {
          // On subsequent pages, use normal pagination
          startIndex = (page - 1) * limit;
          endIndex = startIndex + limit;
        }
        
        finalCategories = filtered.slice(startIndex, endIndex);
        currentPage = page;
        totalPages = Math.max(1, Math.ceil(total / limit));
      }

      const enriched = await this.enrichWithCategoryImages(finalCategories);
      return {
        categories: enriched,
        totalCategories: total,
        currentPage,
        totalPages,
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
