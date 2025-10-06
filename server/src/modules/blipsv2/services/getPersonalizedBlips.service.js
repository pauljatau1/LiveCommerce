const productRepository = require('../repositories/product.repository');
const sessionHelper = require('../helpers/session.helper');
const pipelineHelper = require('../helpers/pipeline.helper');
const transformationHelper = require('../helpers/transformation.helper');

class GetPersonalizedBlipsService {
  async execute(req) {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    // Generate or get session ID
    const sessionId = sessionHelper.generateSessionId(req);
    console.log(`🔍 [BLIPS DEBUG] Session ID: ${sessionId}, Page: ${page}, Limit: ${limit}`);

    // Get or create session with smart rotation window
    const { sessionData, seenBlipIds, allSeenBlipIds } = sessionHelper.getOrCreateSession(sessionId, page);
    
    console.log(`📝 [BLIPS DEBUG] Current seen blips count: ${seenBlipIds.length}`);
    console.log(`📊 [BLIPS DEBUG] Total blips seen in session: ${allSeenBlipIds.length}`);
    console.log(`📄 [BLIPS DEBUG] Last page visited: ${sessionData.lastPage}, Current page: ${page}`);
    if (seenBlipIds.length > 0) {
      console.log(`📝 [BLIPS DEBUG] First 5 seen blip IDs: ${seenBlipIds.slice(0, 5).join(', ')}`);
    }

    // Get buyer information (authentication check)
    const buyerId = req.user?.id;
    const isAuthenticated = !!buyerId && req.user?.role === 'Buyer';
    let followedSellers = [];
    let categoryNames = [];
    let subCategoryNames = [];

    // Fetch buyer's selected categories if authenticated
    if (isAuthenticated) {
      // Use the repository method that includes selectedCategories
      const buyer = await productRepository.findBuyerByIdWithCategories(buyerId);

      if (buyer?.followers?.length > 0) {
        followedSellers = buyer.followers.map(f => f.sellerId.toString());
      }

      // Extract category names and subcategory names from buyer's selections
      // This personalizes the blips based on buyer's interests
      if (buyer?.selectedCategories?.length > 0) {
        buyer.selectedCategories.forEach(category => {
          // Add the main category name
          if (category.name) {
            categoryNames.push(category.name);
          }
          
          // Add all subcategory names from this category
          if (category.subCategories && category.subCategories.length > 0) {
            category.subCategories.forEach(subCat => {
              if (subCat.name) {
                subCategoryNames.push(subCat.name);
              }
            });
          }
        });

        console.log(`🎯 [BLIPS DEBUG] Buyer ${buyerId} has selected categories: ${categoryNames.join(', ')}`);
        if (subCategoryNames.length > 0) {
          console.log(`🎯 [BLIPS DEBUG] Subcategories: ${subCategoryNames.join(', ')}`);
        }
      } else {
        console.log(`ℹ️ [BLIPS DEBUG] Buyer ${buyerId} has no selected categories - showing random blips`);
      }
    } else {
      console.log(`👤 [BLIPS DEBUG] Non-authenticated user - showing random blips`);
    }

    // Build match stages with category filtering for authenticated users with selected categories
    // For non-authenticated users or users without selected categories, categoryNames will be empty
    // which makes the pipeline return random blips (existing behavior)
    const primaryMatchStage = pipelineHelper.buildPrimaryMatchStage(
      categoryNames.length > 0 ? categoryNames : null, 
      subCategoryNames.length > 0 ? subCategoryNames : null
    );
    const fallbackMatchStage = pipelineHelper.buildFallbackMatchStage(
      categoryNames.length > 0 ? categoryNames : null, 
      subCategoryNames.length > 0 ? subCategoryNames : null
    );

    // Count total products
    let total = await productRepository.countProductsWithBlips({ 'blips.0': { $exists: true }, status: { $ne: 'draft' } });
    const poolSize = Math.max(10, Math.min(total, limit * 3));

    // Build common pipeline
    const commonPipeline = pipelineHelper.buildCommonPipeline(poolSize);

    // Validate and clean ObjectIds
    const { seenBlipObjectIds, validIds } = sessionHelper.validateAndCleanObjectIds(seenBlipIds);
    
    // Update session with cleaned IDs if needed
    if (validIds !== seenBlipIds) {
      sessionData.seenBlipIds = validIds;
    }

    // Log exclusion match stage details
    if (seenBlipObjectIds.length > 0) {
      console.log(`🚫 [BLIPS DEBUG] Excluding ${seenBlipObjectIds.length} blip ObjectIds from query`);
      console.log(`🚫 [BLIPS DEBUG] String IDs: ${seenBlipIds.slice(0, 3).join(', ')}`);
      console.log(`🚫 [BLIPS DEBUG] ObjectIds: ${seenBlipObjectIds.slice(0, 3).map(id => id.toString()).join(', ')}`);
    }

    // Execute primary pipeline
    const { pipeline: primaryPipeline, exclusionMatchStage } = pipelineHelper.buildPrimaryPipeline(
      primaryMatchStage, 
      seenBlipObjectIds, 
      commonPipeline
    );

    console.log(`🔎 [BLIPS DEBUG] Executing primary pipeline with ${seenBlipObjectIds.length} exclusions...`);
    let products;
    try {
      products = await productRepository.aggregateProducts(primaryPipeline);
    } catch (dbError) {
      console.error(`❌ [BLIPS DEBUG] Database error in primary pipeline:`, dbError.message);
      // Fallback to query without exclusions if there's a DB error
      const simplePipeline = [
        { $match: primaryMatchStage },
        { $unwind: "$blips" },
        { $match: { "blips.processed": true } },
        ...commonPipeline
      ];
      products = await productRepository.aggregateProducts(simplePipeline);
      console.log(`🔄 [BLIPS DEBUG] Used fallback pipeline without exclusions due to DB error`);
    }
    
    console.log(`📊 [BLIPS DEBUG] Primary pipeline returned: ${products.length} products`);
    if (products.length > 0) {
      const blipIds = products.slice(0, 3).map(p => p.blip._id.toString());
      console.log(`📊 [BLIPS DEBUG] First 3 blip IDs from primary: ${blipIds.join(', ')}`);
      
      // Check if any returned blips were in the exclusion list (this shouldn't happen)
      const duplicates = blipIds.filter(id => seenBlipIds.includes(id));
      if (duplicates.length > 0) {
        console.log(`🚨 [BLIPS DEBUG] ERROR: Found duplicate blips in primary results: ${duplicates.join(', ')}`);
      }
    }

    // INTELLIGENT HYBRID FALLBACK SYSTEM
    // If we have personalized categories but insufficient content (< poolSize threshold),
    // supplement with diverse content from other categories to ensure a full feed
    const MIN_PERSONALIZED_THRESHOLD = poolSize * 0.3; // 30% of pool size minimum
    const hasPersonalizedCategories = categoryNames.length > 0;
    const needsSupplementation = hasPersonalizedCategories && products.length < MIN_PERSONALIZED_THRESHOLD;

    if (needsSupplementation) {
      console.log(`🔄 [BLIPS DEBUG] Insufficient personalized content (${products.length}/${MIN_PERSONALIZED_THRESHOLD} threshold)`);
      console.log(`🌐 [BLIPS DEBUG] Supplementing with diverse content from other categories...`);

      // Build a supplementary match stage that EXCLUDES the buyer's selected categories
      // This ensures we're adding diverse content, not just more of the same limited category
      const supplementaryMatchStage = pipelineHelper.buildSupplementaryMatchStage(
        categoryNames, 
        subCategoryNames
      );

      // Calculate how many additional blips we need
      const additionalNeeded = Math.max(poolSize - products.length, limit);
      const supplementaryPoolSize = Math.min(additionalNeeded * 2, poolSize);

      // Build supplementary pipeline with smaller pool size
      const supplementaryCommonPipeline = pipelineHelper.buildCommonPipeline(supplementaryPoolSize);
      const { pipeline: supplementaryPipeline } = pipelineHelper.buildPrimaryPipeline(
        supplementaryMatchStage,
        seenBlipObjectIds,
        supplementaryCommonPipeline
      );

      console.log(`🔎 [BLIPS DEBUG] Executing supplementary pipeline for ${supplementaryPoolSize} diverse blips...`);
      
      try {
        const supplementaryProducts = await productRepository.aggregateProducts(supplementaryPipeline);
        console.log(`📊 [BLIPS DEBUG] Supplementary pipeline returned: ${supplementaryProducts.length} products`);
        
        // Merge personalized products first, then supplementary (priority to personalized)
        const originalCount = products.length;
        products = [...products, ...supplementaryProducts];
        
        console.log(`✅ [BLIPS DEBUG] Hybrid feed created: ${originalCount} personalized + ${supplementaryProducts.length} diverse = ${products.length} total`);
      } catch (dbError) {
        console.error(`⚠️ [BLIPS DEBUG] Error fetching supplementary blips:`, dbError.message);
        // Continue with just the personalized products if supplementary fetch fails
        console.log(`📌 [BLIPS DEBUG] Continuing with ${products.length} personalized blips only`);
      }
    }

    // Final fallback if absolutely no products found (not even personalized)
    if (products.length === 0) {
      console.log('❌ [BLIPS DEBUG] No primary blips found, falling back to general pool');

      const { pipeline: fallbackPipeline } = pipelineHelper.buildFallbackPipeline(
        fallbackMatchStage, 
        seenBlipObjectIds, 
        commonPipeline
      );

      console.log(`🔎 [BLIPS DEBUG] Executing fallback pipeline with ${seenBlipObjectIds.length} exclusions...`);
      try {
        products = await productRepository.aggregateProducts(fallbackPipeline);
      } catch (dbError) {
        console.error(`❌ [BLIPS DEBUG] Database error in fallback pipeline:`, dbError.message);
        // Final fallback to simple query without exclusions
        const simpleFallbackPipeline = pipelineHelper.buildSimpleFallbackPipeline(fallbackMatchStage, commonPipeline);
        products = await productRepository.aggregateProducts(simpleFallbackPipeline);
        console.log(`🔄 [BLIPS DEBUG] Used simple fallback without exclusions due to DB error`);
      }
      console.log(`📊 [BLIPS DEBUG] Fallback pipeline returned: ${products.length} products`);
      
      if (products.length > 0) {
        const blipIds = products.slice(0, 3).map(p => p.blip._id.toString());
        console.log(`📊 [BLIPS DEBUG] First 3 blip IDs from fallback: ${blipIds.join(', ')}`);
        
        // Check if any returned blips were in the exclusion list (this shouldn't happen)
        const duplicates = blipIds.filter(id => seenBlipIds.includes(id));
        if (duplicates.length > 0) {
          console.log(`🚨 [BLIPS DEBUG] ERROR: Found duplicate blips in fallback results: ${duplicates.join(', ')}`);
        }
      }
      
      // INFINITE SCROLL FAILSAFE: If still no products after all attempts,
      // it means we've exhausted even the rotation window. Reset exclusions entirely.
      if (products.length === 0 && seenBlipObjectIds.length > 0) {
        console.log('🔄 [BLIPS DEBUG] Content exhausted even with rotation window!');
        console.log('♻️ [BLIPS DEBUG] RESETTING exclusions for infinite scroll - allowing ALL blips to rotate back');
        
        // Query without ANY exclusions to allow full rotation
        const resetPipeline = pipelineHelper.buildSimpleFallbackPipeline(fallbackMatchStage, commonPipeline);
        
        try {
          products = await productRepository.aggregateProducts(resetPipeline);
          console.log(`✅ [BLIPS DEBUG] Reset successful: ${products.length} blips available for rotation`);
          
          if (products.length > 0) {
            console.log(`♻️ [BLIPS DEBUG] Infinite scroll active - user will see content from beginning`);
          }
        } catch (resetError) {
          console.error(`❌ [BLIPS DEBUG] Error in reset pipeline:`, resetError.message);
        }
      }
    }

    // Populate seller information
    await productRepository.populateSellerInfo(products);

    if (products.length === 0) {
      return {
        blips: [],
        currentPage: page,
        totalPages: 0,
        totalBlips: 0,
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
    console.log(`➕ [BLIPS DEBUG] Adding ${newlySeenBlipIds.length} new blip IDs to session`);
    console.log(`➕ [BLIPS DEBUG] New blip IDs: ${newlySeenBlipIds.slice(0, 3).join(', ')}${newlySeenBlipIds.length > 3 ? '...' : ''}`);

    // Final check: ensure no duplicates in the final result
    const duplicatesInResult = newlySeenBlipIds.filter(id => seenBlipIds.includes(id));
    if (duplicatesInResult.length > 0) {
      console.log(`🚨 [BLIPS DEBUG] CRITICAL ERROR: Found duplicates in final result: ${duplicatesInResult.join(', ')}`);
      console.log(`🚨 [BLIPS DEBUG] This indicates the MongoDB exclusion is not working properly`);
    } else {
      console.log(`✅ [BLIPS DEBUG] No duplicates found in final result - exclusion working correctly`);
    }

    // Update session with new blips
    sessionHelper.updateSessionWithNewBlips(sessionData, newlySeenBlipIds, page);

    // Log some final stats
    console.log(`📤 [BLIPS DEBUG] Returning ${finalBlips.length} blips for page ${page}`);
    if (finalBlips.length > 0) {
      console.log(`📤 [BLIPS DEBUG] First blip product: ${finalBlips[0].productName} (ID: ${finalBlips[0].blipId})`);
    }

    return {
      blips: finalBlips,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalBlips: total,
      sessionId
    };
  }
}

module.exports = new GetPersonalizedBlipsService();
