const productRepository = require('../repositories/product.repository');
const sessionHelper = require('../helpers/session.helper');
const pipelineHelper = require('../helpers/pipeline.helper');
const transformationHelper = require('../helpers/transformation.helper');
const categoryHelper = require('../helpers/category.helper');

/**
 * GetRelatedBlipsService
 * 
 * This service provides related blip recommendations based on:
 * 1. The category of the source blip (primary filter)
 * 2. For logged-in buyers WITH selected categories: Also prioritizes blips from their chosen categories
 * 3. For logged-in buyers WITHOUT selected categories: Uses related category only
 * 4. For non-logged-in users: Uses related category only
 * 
 * The algorithm ensures:
 * - No duplicate blips across pagination (session-based tracking)
 * - Balanced distribution across sellers
 * - Proper fallback mechanisms when category-filtered queries return no results
 * - Session management for both logged-in and logged-out users
 * - The source blip is always excluded from results
 */
class GetRelatedBlipsService {
  async execute(req) {
    const { blipId } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);

    // Generate or get session ID
    const sessionId = sessionHelper.generateSessionId(req);
    console.log(`🔍 [RELATED BLIPS DEBUG] Session ID: ${sessionId}, Page: ${page}, Limit: ${limit}, Source Blip ID: ${blipId}`);

    // Get or create session
    const { sessionData, seenBlipIds } = sessionHelper.getOrCreateSession(sessionId, page);
    
    // Always exclude the source blip from results
    const sourceBlipId = blipId;
    if (!seenBlipIds.includes(sourceBlipId)) {
      seenBlipIds.push(sourceBlipId);
      sessionData.seenBlipIds = seenBlipIds;
    }
    
    console.log(`📝 [RELATED BLIPS DEBUG] Current seen blips count: ${seenBlipIds.length}`);
    console.log(`📄 [RELATED BLIPS DEBUG] Last page visited: ${sessionData.lastPage}, Current page: ${page}`);
    if (seenBlipIds.length > 0) {
      console.log(`📝 [RELATED BLIPS DEBUG] First 5 seen blip IDs: ${seenBlipIds.slice(0, 5).join(', ')}`);
    }

    // Get buyer information and selected categories
    const buyerId = req.user?.id;
    const isAuthenticated = !!buyerId && req.user?.role === 'Buyer';
    let followedSellers = [];
    let selectedCategoryNames = [];

    // Find the product that contains the reference blip
    const product = await productRepository.findProductWithBlip(blipId);
    
    if (!product) {
      throw new Error('Blip not found');
    }
    
    // Get the source blip
    const sourceBlip = product.blips.id(blipId);
    
    if (!sourceBlip) {
      throw new Error('Blip not found');
    }
    
    // Get the related category from the source product
    const relatedCategory = product.category;
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🎯 [RELATED BLIPS] PERSONALIZATION ANALYSIS`);
    console.log(`${'='.repeat(80)}`);
    console.log(`📌 [RELATED BLIPS] Source blip category: "${relatedCategory}"`);

    if (isAuthenticated) {
      console.log(`✅ [RELATED BLIPS] User is authenticated - Buyer ID: ${buyerId}`);
      
      // Fetch buyer with selected categories for personalized blips
      const buyer = await productRepository.findBuyerByIdWithCategories(buyerId);

      if (buyer?.followers?.length > 0) {
        followedSellers = buyer.followers.map(f => f.sellerId.toString());
      }

      // Extract category names from buyer's selected categories
      if (categoryHelper.hasSelectedCategories(buyer)) {
        selectedCategoryNames = categoryHelper.extractCategoryNames(buyer.selectedCategories);
        const summary = categoryHelper.getCategorySummary(buyer);
        
        console.log(`\n🎯 [RELATED BLIPS] EXTRACTED CATEGORY NAMES FOR FILTERING:`);
        console.log(`   User's selected categories: [${selectedCategoryNames.map(c => `"${c}"`).join(', ')}]`);
        console.log(`   Total categories: ${summary.totalCategories}`);
        console.log(`   Total subcategories: ${summary.totalSubCategories}`);
        
        // Check if related category is in user's selected categories
        if (selectedCategoryNames.includes(relatedCategory)) {
          console.log(`\n✅ [RELATED BLIPS] Related category "${relatedCategory}" matches user's preferences!`);
          console.log(`✅ [RELATED BLIPS] Will use CATEGORY-ENHANCED algorithm with related category priority`);
        } else {
          console.log(`\n⚠️ [RELATED BLIPS] Related category "${relatedCategory}" not in user's preferences`);
          console.log(`✅ [RELATED BLIPS] Will prioritize related category, but also consider user preferences`);
        }
            } else {
        console.log(`\n⚠️ [RELATED BLIPS] Buyer has NO selected categories`);
        console.log(`✅ [RELATED BLIPS] Will use RELATED CATEGORY algorithm (no user preference filtering)`);
      }
    } else {
      console.log(`❌ [RELATED BLIPS] User is NOT authenticated (guest user)`);
      console.log(`✅ [RELATED BLIPS] Will use RELATED CATEGORY algorithm (no filtering)`);
    }

    console.log(`${'='.repeat(80)}\n`);

    // Build match stages
    // Priority: Related category first, then user's selected categories if available
    let primaryMatchStage, fallbackMatchStage;
    const useCategoryFilter = isAuthenticated && selectedCategoryNames.length > 0;
    
    // Build match stage that prioritizes related category
    // If user has selected categories, we'll combine them with the related category
    const basePrimaryMatch = pipelineHelper.buildPrimaryMatchStage();
    const relatedCategoryMatch = {
      $and: [
        ...basePrimaryMatch.$and,
        { category: relatedCategory },
        { _id: { $ne: product._id } } // Exclude the source product
      ]
    };

    if (useCategoryFilter && selectedCategoryNames.includes(relatedCategory)) {
      // If related category is in user's preferences, use category-enhanced match
      // This will prioritize both the related category and user's other preferences
      primaryMatchStage = {
        $and: [
          ...basePrimaryMatch.$and,
          { 
            category: { 
              $in: [relatedCategory, ...selectedCategoryNames.filter(c => c !== relatedCategory)] 
            } 
          },
          { _id: { $ne: product._id } }
        ]
      };
      const categoryFallbackBase = pipelineHelper.buildCategoryEnhancedFallbackMatchStage(selectedCategoryNames);
      fallbackMatchStage = {
        ...categoryFallbackBase,
        _id: { $ne: product._id }
      };
      
      console.log(`\n🔧 [RELATED BLIPS] MONGODB QUERY FILTER:`);
      console.log(`   Using combined filter: related category "${relatedCategory}" + user preferences`);
      console.log(`   Categories: [${[relatedCategory, ...selectedCategoryNames.filter(c => c !== relatedCategory)].map(c => `"${c}"`).join(', ')}]\n`);
    } else {
      // Use related category only
      primaryMatchStage = relatedCategoryMatch;
      const baseFallbackMatch = pipelineHelper.buildFallbackMatchStage();
      fallbackMatchStage = {
        ...baseFallbackMatch,
        category: relatedCategory,
        _id: { $ne: product._id }
      };
      
      console.log(`\n🔧 [RELATED BLIPS] MONGODB QUERY FILTER:`);
      console.log(`   Using related category filter: { category: "${relatedCategory}" }\n`);
    }

    // Count total products
    let total = await productRepository.countProductsWithBlips({ 
      'blips.0': { $exists: true }, 
      status: { $ne: 'draft' },
      category: relatedCategory,
      _id: { $ne: product._id }
    });
    const poolSize = Math.max(10, Math.min(total, limit * 3));

    // Build common pipeline
    const commonPipeline = pipelineHelper.buildCommonPipeline(poolSize);

    // Validate and clean ObjectIds (including source blip ID)
    const { seenBlipObjectIds, validIds } = sessionHelper.validateAndCleanObjectIds(seenBlipIds);
    
    // Update session with cleaned IDs if needed
    if (validIds !== seenBlipIds) {
      sessionData.seenBlipIds = validIds;
    }

    // Log exclusion match stage details
    if (seenBlipObjectIds.length > 0) {
      console.log(`🚫 [RELATED BLIPS DEBUG] Excluding ${seenBlipObjectIds.length} blip ObjectIds from query (including source blip)`);
    }

    // Execute primary pipeline
    const { pipeline: primaryPipeline } = pipelineHelper.buildPrimaryPipeline(
      primaryMatchStage, 
      seenBlipObjectIds, 
      commonPipeline
    );

    console.log(`🔎 [RELATED BLIPS DEBUG] Executing primary pipeline with ${seenBlipObjectIds.length} exclusions...`);
    let products;
    try {
      products = await productRepository.aggregateProducts(primaryPipeline);
    } catch (dbError) {
      console.error(`❌ [RELATED BLIPS DEBUG] Database error in primary pipeline:`, dbError.message);
      // Fallback to query without exclusions if there's a DB error
      const simplePipeline = [
        { $match: primaryMatchStage },
        { $unwind: "$blips" },
        { $match: { "blips.processed": true } },
        ...commonPipeline
      ];
      products = await productRepository.aggregateProducts(simplePipeline);
      console.log(`🔄 [RELATED BLIPS DEBUG] Used fallback pipeline without exclusions due to DB error`);
    }
    
    console.log(`📊 [RELATED BLIPS DEBUG] Primary pipeline returned: ${products.length} products`);

    // Fallback if no products found
    if (products.length === 0) {
      console.log('❌ [RELATED BLIPS DEBUG] No primary blips, falling back to general pool');

      const { pipeline: fallbackPipeline } = pipelineHelper.buildFallbackPipeline(
        fallbackMatchStage, 
        seenBlipObjectIds, 
        commonPipeline
      );

      console.log(`🔎 [RELATED BLIPS DEBUG] Executing fallback pipeline with ${seenBlipObjectIds.length} exclusions...`);
      try {
        products = await productRepository.aggregateProducts(fallbackPipeline);
      } catch (dbError) {
        console.error(`❌ [RELATED BLIPS DEBUG] Database error in fallback pipeline:`, dbError.message);
        // Final fallback to simple query without exclusions
        const simpleFallbackPipeline = pipelineHelper.buildSimpleFallbackPipeline(fallbackMatchStage, commonPipeline);
        products = await productRepository.aggregateProducts(simpleFallbackPipeline);
        console.log(`🔄 [RELATED BLIPS DEBUG] Used simple fallback without exclusions due to DB error`);
      }
      console.log(`📊 [RELATED BLIPS DEBUG] Fallback pipeline returned: ${products.length} products`);

      // Final fallback: If category-filtered queries returned no results, try without category filter
      // But still prioritize the related category
      if (products.length === 0) {
        console.log('🔄 [RELATED BLIPS] Category-filtered queries returned no results, falling back to non-filtered blips (still excluding source product)');
        
        // Build non-filtered match stages but still exclude source product
        const nonFilteredPrimaryBase = pipelineHelper.buildPrimaryMatchStage();
        const nonFilteredPrimaryMatch = {
          $and: [
            ...nonFilteredPrimaryBase.$and,
            { _id: { $ne: product._id } }
          ]
        };
        const nonFilteredFallbackBase = pipelineHelper.buildFallbackMatchStage();
        const nonFilteredFallbackMatch = {
          ...nonFilteredFallbackBase,
          _id: { $ne: product._id }
        };

        // Try non-filtered fallback
        const { pipeline: nonFilteredPipeline } = pipelineHelper.buildFallbackPipeline(
          nonFilteredFallbackMatch,
          seenBlipObjectIds,
          commonPipeline
        );

        try {
          products = await productRepository.aggregateProducts(nonFilteredPipeline);
          console.log(`📊 [RELATED BLIPS] Non-filtered fallback returned: ${products.length} products`);
        } catch (dbError) {
          console.error(`❌ [RELATED BLIPS] Database error in non-filtered fallback:`, dbError.message);
          // Absolute final fallback
          const simplePipeline = pipelineHelper.buildSimpleFallbackPipeline(nonFilteredFallbackMatch, commonPipeline);
          products = await productRepository.aggregateProducts(simplePipeline);
          console.log(`🔄 [RELATED BLIPS] Used simple non-filtered fallback: ${products.length} products`);
        }
      }
    }

    // Populate seller information
    await productRepository.populateSellerInfo(products);

    if (products.length === 0) {
      return {
        success: true,
        blips: [],
        currentPage: page,
        totalPages: 0,
        totalBlips: 0,
        hasMore: false,
        sessionId
      };
    }

    // Transform products to blips
    const transformedBlips = transformationHelper.transformProductsToBlips(
      products, 
      buyerId, 
      isAuthenticated, 
      followedSellers
    );

    // Categorize blips
    const categorizedBlips = transformationHelper.categorizeBlips(transformedBlips, isAuthenticated);

    // Shuffle each category
    transformationHelper.shuffleCategories(categorizedBlips);

    // Create balanced distribution
    const finalBlips = transformationHelper.createBalancedBlipDistribution(categorizedBlips, limit);

    // Extract the blip IDs from the final result to add to seen blips
    const newlySeenBlipIds = finalBlips.map(blip => blip.blipId.toString());
    console.log(`➕ [RELATED BLIPS DEBUG] Adding ${newlySeenBlipIds.length} new blip IDs to session`);
    console.log(`➕ [RELATED BLIPS DEBUG] New blip IDs: ${newlySeenBlipIds.slice(0, 3).join(', ')}${newlySeenBlipIds.length > 3 ? '...' : ''}`);

    // Final check: ensure no duplicates in the final result
    const duplicatesInResult = newlySeenBlipIds.filter(id => seenBlipIds.includes(id));
    if (duplicatesInResult.length > 0) {
      console.log(`🚨 [RELATED BLIPS DEBUG] CRITICAL ERROR: Found duplicates in final result: ${duplicatesInResult.join(', ')}`);
      console.log(`🚨 [RELATED BLIPS DEBUG] This indicates the MongoDB exclusion is not working properly`);
    } else {
      console.log(`✅ [RELATED BLIPS DEBUG] No duplicates found in final result - exclusion working correctly`);
    }

    // Update session with new blips
    sessionHelper.updateSessionWithNewBlips(sessionData, newlySeenBlipIds, page);

    // Log some final stats
    console.log(`📤 [RELATED BLIPS DEBUG] Returning ${finalBlips.length} blips for page ${page}`);
    if (finalBlips.length > 0) {
      console.log(`📤 [RELATED BLIPS DEBUG] First blip product: ${finalBlips[0].productName} (ID: ${finalBlips[0].blipId})`);
    }
    
    // Log personalization status
    if (useCategoryFilter) {
      console.log(`\n✨ [RELATED BLIPS] Returned personalized related blips based on related category "${relatedCategory}" and ${selectedCategoryNames.length} selected categories`);
    } else {
      console.log(`\n✨ [RELATED BLIPS] Returned related blips based on category "${relatedCategory}"`);
    }
    
    return {
      success: true,
      blips: finalBlips,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalBlips: total,
      hasMore: (page * limit) < total,
      sessionId
    };
  }
}

module.exports = new GetRelatedBlipsService();
