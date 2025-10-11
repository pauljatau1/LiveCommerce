const productRepository = require('../repositories/product.repository');
const sessionHelper = require('../helpers/session.helper');
const pipelineHelper = require('../helpers/pipeline.helper');
const transformationHelper = require('../helpers/transformation.helper');
const categoryHelper = require('../helpers/category.helper');

/**
 * GetPersonalizedBlipsService
 * 
 * This service provides personalized blip recommendations based on:
 * 1. For logged-in buyers WITH selected categories: Prioritizes blips from their chosen categories
 * 2. For logged-in buyers WITHOUT selected categories: Uses standard random algorithm
 * 3. For non-logged-in users: Uses standard random algorithm
 * 
 * The algorithm ensures:
 * - No duplicate blips across pagination
 * - Balanced distribution across sellers
 * - Proper fallback mechanisms when category-filtered queries return no results
 */
class GetPersonalizedBlipsService {
  async execute(req) {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    // Generate or get session ID
    const sessionId = sessionHelper.generateSessionId(req);
    console.log(`🔍 [BLIPS DEBUG] Session ID: ${sessionId}, Page: ${page}, Limit: ${limit}`);

    // Get or create session
    const { sessionData, seenBlipIds } = sessionHelper.getOrCreateSession(sessionId, page);
    
    console.log(`📝 [BLIPS DEBUG] Current seen blips count: ${seenBlipIds.length}`);
    console.log(`📄 [BLIPS DEBUG] Last page visited: ${sessionData.lastPage}, Current page: ${page}`);
    if (seenBlipIds.length > 0) {
      console.log(`📝 [BLIPS DEBUG] First 5 seen blip IDs: ${seenBlipIds.slice(0, 5).join(', ')}`);
    }

    // Get buyer information and selected categories
    const buyerId = req.user?.id;
    const isAuthenticated = !!buyerId && req.user?.role === 'Buyer';
    let followedSellers = [];
    let selectedCategoryNames = [];

    console.log(`\n${'='.repeat(80)}`);
    console.log(`🎯 [CATEGORY DEBUG] PERSONALIZATION ANALYSIS`);
    console.log(`${'='.repeat(80)}`);

    if (isAuthenticated) {
      console.log(`✅ [CATEGORY DEBUG] User is authenticated - Buyer ID: ${buyerId}`);
      
      // Fetch buyer with selected categories for personalized blips
      const buyer = await productRepository.findBuyerByIdWithCategories(buyerId);

      if (buyer?.followers?.length > 0) {
        followedSellers = buyer.followers.map(f => f.sellerId.toString());
      }

      // Log the raw buyer's selected categories data
      console.log(`\n📋 [CATEGORY DEBUG] BUYER'S RAW SELECTED CATEGORIES:`);
      if (buyer?.selectedCategories && buyer.selectedCategories.length > 0) {
        console.log(JSON.stringify(buyer.selectedCategories, null, 2));
        console.log(`📊 [CATEGORY DEBUG] Total selected categories: ${buyer.selectedCategories.length}`);
      } else {
        console.log(`❌ [CATEGORY DEBUG] No selected categories found in buyer document`);
      }

      // Extract category names from buyer's selected categories
      // This is used to filter products that match the buyer's interests
      if (categoryHelper.hasSelectedCategories(buyer)) {
        selectedCategoryNames = categoryHelper.extractCategoryNames(buyer.selectedCategories);
        const summary = categoryHelper.getCategorySummary(buyer);
        
        console.log(`\n🎯 [CATEGORY DEBUG] EXTRACTED CATEGORY NAMES FOR FILTERING:`);
        console.log(`   Categories to match: [${selectedCategoryNames.map(c => `"${c}"`).join(', ')}]`);
        console.log(`   Total categories: ${summary.totalCategories}`);
        console.log(`   Total subcategories: ${summary.totalSubCategories}`);
        console.log(`\n✅ [CATEGORY DEBUG] Will use CATEGORY-ENHANCED algorithm`);
      } else {
        console.log(`\n⚠️ [CATEGORY DEBUG] Buyer has NO selected categories`);
        console.log(`✅ [CATEGORY DEBUG] Will use RANDOM algorithm (no filtering)`);
      }
    } else {
      console.log(`❌ [CATEGORY DEBUG] User is NOT authenticated (guest user)`);
      console.log(`✅ [CATEGORY DEBUG] Will use RANDOM algorithm (no filtering)`);
    }

    console.log(`${'='.repeat(80)}\n`);

    // Build match stages based on whether buyer has selected categories
    // For logged-in buyers with selected categories, we prioritize those categories
    // For non-logged-in buyers or buyers without categories, we use the standard algorithm
    const useCategoryFilter = isAuthenticated && selectedCategoryNames.length > 0;
    let primaryMatchStage, fallbackMatchStage;

    if (useCategoryFilter) {
      primaryMatchStage = pipelineHelper.buildCategoryEnhancedMatchStage(selectedCategoryNames);
      fallbackMatchStage = pipelineHelper.buildCategoryEnhancedFallbackMatchStage(selectedCategoryNames);
      
      console.log(`\n🔧 [CATEGORY DEBUG] MONGODB QUERY FILTER:`);
      console.log(`   Using category filter: { category: { $in: [${selectedCategoryNames.map(c => `"${c}"`).join(', ')}] } }`);
      console.log(`   This will ONLY return products where product.category matches one of the above categories\n`);
    } else {
      primaryMatchStage = pipelineHelper.buildPrimaryMatchStage();
      fallbackMatchStage = pipelineHelper.buildFallbackMatchStage();
      
      console.log(`\n🔧 [CATEGORY DEBUG] MONGODB QUERY FILTER:`);
      console.log(`   No category filter applied - will return random products from ALL categories\n`);
    }

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
    
    // LOG THE CATEGORIES OF PRODUCTS RETURNED
    if (products.length > 0) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`📦 [CATEGORY DEBUG] PRODUCTS RETURNED FROM DATABASE:`);
      console.log(`${'='.repeat(80)}`);
      
      const blipIds = products.slice(0, 3).map(p => p.blip._id.toString());
      console.log(`📊 [BLIPS DEBUG] First 3 blip IDs from primary: ${blipIds.join(', ')}`);
      
      // Log all product categories AND subcategories
      const productCategories = products.map(p => p.category || 'NO_CATEGORY');
      const productSubCategories = products.map(p => p.subCategory || 'NO_SUBCATEGORY');
      const uniqueCategories = [...new Set(productCategories)];
      const uniqueSubCategories = [...new Set(productSubCategories)];
      
      console.log(`\n📊 [CATEGORY DEBUG] Product Categories Distribution:`);
      console.log(`   Total products: ${products.length}`);
      console.log(`   Unique CATEGORIES: ${uniqueCategories.length}`);
      console.log(`   Categories found: [${uniqueCategories.map(c => `"${c}"`).join(', ')}]`);
      console.log(`   Unique SUBCATEGORIES: ${uniqueSubCategories.length}`);
      console.log(`   SubCategories found: [${uniqueSubCategories.map(c => `"${c}"`).join(', ')}]`);
      
      // Count products per category
      const categoryCounts = {};
      productCategories.forEach(cat => {
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      });
      
      console.log(`\n📊 [CATEGORY DEBUG] Products per CATEGORY field:`);
      Object.entries(categoryCounts).forEach(([cat, count]) => {
        console.log(`   - "${cat}": ${count} product(s)`);
      });
      
      // Count products per subcategory
      const subCategoryCounts = {};
      productSubCategories.forEach(cat => {
        subCategoryCounts[cat] = (subCategoryCounts[cat] || 0) + 1;
      });
      
      console.log(`\n📊 [CATEGORY DEBUG] Products per SUBCATEGORY field:`);
      Object.entries(subCategoryCounts).forEach(([cat, count]) => {
        console.log(`   - "${cat}": ${count} product(s)`);
      });
      
      // If category filter was applied, verify matching
      if (useCategoryFilter) {
        console.log(`\n🔍 [CATEGORY DEBUG] CATEGORY MATCHING VERIFICATION:`);
        console.log(`   Expected categories: [${selectedCategoryNames.map(c => `"${c}"`).join(', ')}]`);
        console.log(`   Found categories: [${uniqueCategories.map(c => `"${c}"`).join(', ')}]`);
        
        const matchingCategories = uniqueCategories.filter(cat => selectedCategoryNames.includes(cat));
        const nonMatchingCategories = uniqueCategories.filter(cat => !selectedCategoryNames.includes(cat));
        
        if (matchingCategories.length > 0) {
          console.log(`   ✅ Matching categories: [${matchingCategories.map(c => `"${c}"`).join(', ')}]`);
        }
        
        if (nonMatchingCategories.length > 0) {
          console.log(`   ❌ NON-MATCHING categories found: [${nonMatchingCategories.map(c => `"${c}"`).join(', ')}]`);
          console.log(`   ⚠️  WARNING: Products returned that DON'T match buyer's selected categories!`);
          console.log(`   🔍 This suggests the MongoDB query filter may not be working correctly.`);
        } else {
          console.log(`   ✅ All products match buyer's selected categories!`);
        }
      }
      
      // Log detailed info for first 10 products
      console.log(`\n📋 [CATEGORY DEBUG] Detailed Product Info (First 10):`);
      products.slice(0, 10).forEach((p, idx) => {
        console.log(`   ${idx + 1}. Product: "${p.name}"`);
        console.log(`      category: "${p.category || 'NO_CATEGORY'}"`);
        console.log(`      subCategory: "${p.subCategory || 'N/A'}"`);
        console.log(`      subSubCategory: "${p.subSubCategory || 'N/A'}"`);
        console.log(`      Product ID: ${p._id}`);
        console.log(`      Blip ID: ${p.blip._id}`);
        console.log(``);
      });
      
      console.log(`${'='.repeat(80)}\n`);
      
      // Check if any returned blips were in the exclusion list (this shouldn't happen)
      const duplicates = blipIds.filter(id => seenBlipIds.includes(id));
      if (duplicates.length > 0) {
        console.log(`🚨 [BLIPS DEBUG] ERROR: Found duplicate blips in primary results: ${duplicates.join(', ')}`);
      }
    }

    // Fallback if no products found
    if (products.length === 0) {
      console.log('❌ [BLIPS DEBUG] No primary blips, falling back to general pool');

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

      // Final fallback: If category-filtered queries returned no results, try without category filter
      // This ensures we always return blips even if the buyer's selected categories have no matching products
      if (products.length === 0 && useCategoryFilter) {
        console.log('🔄 [BLIPS PERSONALIZATION] Category-filtered queries returned no results, falling back to non-filtered blips');
        
        // Build non-filtered match stages
        const nonFilteredPrimaryMatch = pipelineHelper.buildPrimaryMatchStage();
        const nonFilteredFallbackMatch = pipelineHelper.buildFallbackMatchStage();

        // Try non-filtered fallback
        const { pipeline: nonFilteredPipeline } = pipelineHelper.buildFallbackPipeline(
          nonFilteredFallbackMatch,
          seenBlipObjectIds,
          commonPipeline
        );

        try {
          products = await productRepository.aggregateProducts(nonFilteredPipeline);
          console.log(`📊 [BLIPS PERSONALIZATION] Non-filtered fallback returned: ${products.length} products`);
        } catch (dbError) {
          console.error(`❌ [BLIPS PERSONALIZATION] Database error in non-filtered fallback:`, dbError.message);
          // Absolute final fallback
          const simplePipeline = pipelineHelper.buildSimpleFallbackPipeline(nonFilteredFallbackMatch, commonPipeline);
          products = await productRepository.aggregateProducts(simplePipeline);
          console.log(`🔄 [BLIPS PERSONALIZATION] Used simple non-filtered fallback: ${products.length} products`);
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
    
    // Log personalization status with final category breakdown
    if (useCategoryFilter) {
      console.log(`\n✨ [BLIPS PERSONALIZATION] Returned personalized blips based on ${selectedCategoryNames.length} selected categories`);
      
      // Final verification of returned blips
      console.log(`\n${'='.repeat(80)}`);
      console.log(`📤 [CATEGORY DEBUG] FINAL BLIPS BEING RETURNED TO USER:`);
      console.log(`${'='.repeat(80)}`);
      
      // We need to get categories from the original products array
      const finalBlipIds = finalBlips.map(b => b.blipId.toString());
      const finalProducts = products.filter(p => finalBlipIds.includes(p.blip._id.toString()));
      const finalCategories = finalProducts.map(p => p.category || 'NO_CATEGORY');
      const uniqueFinalCategories = [...new Set(finalCategories)];
      
      console.log(`   Total blips: ${finalBlips.length}`);
      console.log(`   Categories: [${uniqueFinalCategories.map(c => `"${c}"`).join(', ')}]`);
      
      finalBlips.forEach((blip, idx) => {
        const product = finalProducts.find(p => p.blip._id.toString() === blip.blipId.toString());
        console.log(`   ${idx + 1}. "${blip.productName}" - Category: "${product?.category || 'UNKNOWN'}"`);
      });
      
      console.log(`${'='.repeat(80)}\n`);
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
