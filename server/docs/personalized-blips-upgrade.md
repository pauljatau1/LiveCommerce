# Personalized Blips Algorithm Upgrade

## Overview

This document describes the upgrade made to the `getPersonalizedBlips` endpoint to provide category-based personalization for authenticated buyers while maintaining random blips for non-authenticated users.

**Date:** October 6, 2025  
**Branch:** AUQ-679-enhance-blip-algorithm-to-buyers-chosen-categories  
**Module:** `src/modules/blipsv2`

---

## What Changed?

### 1. **Pipeline Helper (`helpers/pipeline.helper.js`)**

#### `buildPrimaryMatchStage(categoryNames, subCategoryNames)`
- **Enhanced** to accept optional category and subcategory filters
- When categories are provided, it filters products to match:
  - Products in the buyer's selected **major categories** (by `category` field)
  - Products in the buyer's selected **subcategories** (by `subCategory` field)
- Uses `$or` logic to match either category OR subcategory, providing flexible matching
- When no categories provided, returns all blips (existing random behavior)

**Example Logic:**
```javascript
// For authenticated buyer with selected categories: ["Electronics", "Fashion"]
// And subcategories: ["Smartphones", "Shoes"]
// The match stage filters products where:
category IN ["Electronics", "Fashion"] 
  OR 
subCategory IN ["Smartphones", "Shoes"]
```

#### `buildFallbackMatchStage(categoryNames, subCategoryNames)`
- **Enhanced** to also accept category filters for fallback scenarios
- Ensures personalization is maintained even when primary pipeline returns no results
- Maintains simple active status check as base criteria

---

### 2. **Personalized Blips Service (`services/getPersonalizedBlips.service.js`)**

#### Enhanced Buyer Data Fetching
- Uses `productRepository.findBuyerByIdWithCategories()` to fetch buyer with `selectedCategories`
- Extracts category names and subcategory names from buyer's `selectedCategories` field
- Logs personalization status for debugging:
  - `🎯` Authenticated user with selected categories
  - `ℹ️` Authenticated user without selected categories (shows random)
  - `👤` Non-authenticated user (shows random)

#### Category Extraction Logic
```javascript
// From Buyer.selectedCategories structure:
[
  {
    name: "Electronics",
    subCategories: [
      { name: "Smartphones" },
      { name: "Laptops" }
    ]
  }
]

// Extracted to:
categoryNames = ["Electronics"]
subCategoryNames = ["Smartphones", "Laptops"]
```

#### Pipeline Building
- Passes extracted categories to both primary and fallback match stages
- If `categoryNames` is empty, passes `null` (triggers random behavior)

---

### 3. **Response Structure**

**No changes** to the response structure - the endpoint still returns:

```json
{
  "blips": [...],
  "currentPage": 1,
  "totalPages": 10,
  "totalBlips": 100,
  "sessionId": "uuid-session-id"
}
```

---

## How It Works

### For Authenticated Buyers WITH Selected Categories

1. **Fetch buyer data** including `selectedCategories`
2. **Extract category and subcategory names** from buyer's selections
3. **Build match stages** with category filters
4. **Query products** matching buyer's interests
5. **Intelligent Hybrid Fallback** (NEW):
   - If personalized content is insufficient (< 30% of pool size)
   - Supplement with diverse content from OTHER categories
   - This prevents showing the same 2-3 videos repeatedly
6. **Fallback** to category-filtered products if primary returns empty
7. **Return personalized blips** based on buyer's chosen categories

**Example Flow:**
```
Buyer selects: Fashion → Shoes, Clothing
                Electronics → Smartphones

Pipeline matches products where:
  - category = "Fashion" OR
  - category = "Electronics" OR
  - subCategory = "Shoes" OR
  - subCategory = "Clothing" OR
  - subCategory = "Smartphones"

If Fashion only has 2 blips:
  - Show those 2 Fashion blips FIRST (personalized)
  - Supplement with blips from Home, Beauty, Sports, etc. (diverse)
  - Result: Full feed with personalized + diverse content
```

---

### For Authenticated Buyers WITHOUT Selected Categories

1. **Fetch buyer data** (no selected categories found)
2. **Build match stages** without category filters (`null` passed)
3. **Query all products** (random distribution)
4. **Return random blips** (same as non-authenticated behavior)

**Log Output:**
```
ℹ️ [BLIPS DEBUG] Buyer 60a1b2c3d4e5f6g7h8i9j0k1 has no selected categories - showing random blips
```

---

### For Non-Authenticated Users

1. **No buyer data** fetched
2. **Build match stages** without category filters (`null` passed)
3. **Query all products** (random distribution)
4. **Return random blips**

**Log Output:**
```
👤 [BLIPS DEBUG] Non-authenticated user - showing random blips
```

---

---

## Intelligent Hybrid Fallback System (NEW)

### The Problem

If a buyer selects "Fashion → Vintage Clothing" but there are only 2 videos in that category, the system would keep showing those same 2 videos repeatedly. This creates a poor user experience.

### The Solution

**Intelligent Hybrid Supplementation**: When personalized content is insufficient, automatically supplement with diverse content from OTHER categories.

### How It Works

```
1. Query buyer's selected categories (e.g., Fashion)
2. Get results (e.g., only 2 Fashion blips)
3. Check: Is this < 30% of pool size? (e.g., 2 < 10)
   
   YES → Trigger Supplementation:
   4. Query for diverse blips EXCLUDING Fashion
   5. Get blips from Home, Electronics, Beauty, Sports, etc.
   6. Merge: [2 Fashion blips] + [8 diverse blips] = 10 total
   7. Result: Personalized content first, then diverse content
   
   NO → Continue normally with personalized blips only
```

### Example Scenario

**Buyer Selected:** "Fashion → Vintage Clothing"  
**Available Content:** 2 Fashion blips

**Without Hybrid Fallback:**
```json
{
  "blips": [
    { "category": "Fashion", "name": "Vintage Dress" },
    { "category": "Fashion", "name": "Retro Shoes" }
    // Only 2 blips, not enough for full feed
  ]
}
```

**With Hybrid Fallback (NEW):**
```json
{
  "blips": [
    // Personalized (from Fashion)
    { "category": "Fashion", "name": "Vintage Dress" },
    { "category": "Fashion", "name": "Retro Shoes" },
    
    // Supplementary diverse content (from other categories)
    { "category": "Electronics", "name": "Headphones" },
    { "category": "Home", "name": "Lamp" },
    { "category": "Beauty", "name": "Skincare Set" },
    { "category": "Sports", "name": "Yoga Mat" },
    { "category": "Books", "name": "Novel" },
    { "category": "Toys", "name": "Board Game" }
    // Total: 8 blips = Full feed with variety
  ]
}
```

### Key Parameters

- **Threshold**: 30% of pool size (configurable)
- **Exclusion**: Buyer's selected categories are EXCLUDED from supplementary content
- **Priority**: Personalized blips always appear FIRST
- **Smart Calculation**: Dynamically calculates how many additional blips are needed

### Log Output

When supplementation is triggered:
```
🔄 [BLIPS DEBUG] Insufficient personalized content (2/10 threshold)
🌐 [BLIPS DEBUG] Supplementing with diverse content from other categories...
🔎 [BLIPS DEBUG] Executing supplementary pipeline for 20 diverse blips...
📊 [BLIPS DEBUG] Supplementary pipeline returned: 15 products
✅ [BLIPS DEBUG] Hybrid feed created: 2 personalized + 15 diverse = 17 total
```

---

## Key Benefits

1. ✅ **Better User Experience**: Buyers see blips relevant to their interests
2. ✅ **No Repetitive Content**: Never shows the same 2-3 videos repeatedly
3. ✅ **Diverse Discovery**: Supplements with content from other categories
4. ✅ **Maintained Backward Compatibility**: Non-authenticated users still get random blips
5. ✅ **Graceful Degradation**: Authenticated buyers without categories get random blips
6. ✅ **No Breaking Changes**: Response structure remains unchanged
7. ✅ **Improved Discovery**: Category-based filtering increases relevant content
8. ✅ **Smart Fallback**: Automatically adapts to available content
9. ✅ **Debug Friendly**: Enhanced logging for monitoring personalization

---

## Database Schema Dependencies

### Buyer Model (`selectedCategories`)
```javascript
selectedCategories: [
  {
    name: String,        // Major category name (e.g., "Fashion")
    subCategories: [
      {
        name: String     // Subcategory name (e.g., "Shoes")
      }
    ]
  }
]
```

### Product Model
```javascript
{
  category: String,      // Major category (e.g., "Fashion")
  subCategory: String,   // Subcategory (e.g., "Shoes")
  blips: [...],         // Array of blip objects
  status: String,       // Product status
  // ... other fields
}
```

---

## Testing Recommendations

### 1. **Test Authenticated Buyer with Selected Categories**
```bash
# Setup: Create buyer with selectedCategories
# Expected: Blips from selected categories are returned
GET /api/blips/personalized
Authorization: Bearer <buyer-token-with-categories>
```

### 2. **Test Authenticated Buyer without Selected Categories**
```bash
# Setup: Create buyer with empty selectedCategories
# Expected: Random blips are returned (same as non-authenticated)
GET /api/blips/personalized
Authorization: Bearer <buyer-token-no-categories>
```

### 3. **Test Non-Authenticated User**
```bash
# Expected: Random blips are returned
GET /api/blips/personalized
```

### 4. **Test Pagination with Personalization**
```bash
# Expected: Subsequent pages maintain category filtering
GET /api/blips/personalized?page=2&limit=10
Authorization: Bearer <buyer-token-with-categories>
```

### 5. **Test Session Deduplication**
```bash
# Expected: No duplicate blips across pages for same session
GET /api/blips/personalized?page=1
GET /api/blips/personalized?page=2
```

---

## Performance Considerations

### Indexes
Ensure these indexes exist on the `Product` collection:
```javascript
db.products.createIndex({ "category": 1, "status": 1, "blips.processed": 1 });
db.products.createIndex({ "subCategory": 1, "status": 1, "blips.processed": 1 });
db.products.createIndex({ "blips._id": 1 });
```

### Query Optimization
- Category filtering happens at the **first stage** of aggregation (most efficient)
- Uses `$in` operator for category matching (index-friendly)
- Fallback logic ensures users always see content

---

## Monitoring and Logs

### Key Log Messages

| Log Prefix | Meaning | User Type |
|-----------|---------|-----------|
| `🎯 [BLIPS DEBUG]` | Personalized blips served | Authenticated with categories |
| `ℹ️ [BLIPS DEBUG]` | Random blips (no categories) | Authenticated without categories |
| `👤 [BLIPS DEBUG]` | Random blips | Non-authenticated |

### Example Logs
```
🎯 [BLIPS DEBUG] Buyer 60a1b2c3d4e5f6g7h8i9j0k1 has selected categories: Fashion, Electronics
🎯 [BLIPS DEBUG] Subcategories: Shoes, Clothing, Smartphones, Laptops
📊 [BLIPS DEBUG] Primary pipeline returned: 42 products
📤 [BLIPS DEBUG] Returning 10 blips for page 1
```

---

## Files Modified

1. **`src/modules/blipsv2/helpers/pipeline.helper.js`**
   - Enhanced `buildPrimaryMatchStage()` with category filtering
   - Enhanced `buildFallbackMatchStage()` with category filtering
   - Added comprehensive JSDoc comments

2. **`src/modules/blipsv2/services/getPersonalizedBlips.service.js`**
   - Added buyer category extraction logic
   - Enhanced logging for personalization status
   - Passes categories to pipeline builders

3. **`docs/personalized-blips-upgrade.md`** (this file)
   - Comprehensive documentation of changes

---

## Future Enhancements

### Potential Improvements
1. **Hybrid Scoring**: Mix personalized + trending blips for better discovery
2. **Category Weighting**: Prioritize certain categories based on user engagement
3. **Machine Learning**: Use viewing/engagement history for smarter recommendations
4. **A/B Testing**: Test personalization effectiveness vs random
5. **Cache Optimization**: Cache buyer categories to reduce DB queries

### Analytics Tracking
Consider tracking:
- Personalization effectiveness (CTR, engagement)
- Category coverage (are all categories represented?)
- Fallback frequency (how often do we run out of personalized content?)

---

## Rollback Plan

If issues arise, revert these commits:
1. Restore `pipeline.helper.js` to original state
2. Restore `getPersonalizedBlips.service.js` to original state

The changes are **backward compatible**, so no data migration is needed.

---

## Support

For questions or issues, contact the development team or reference:
- Ticket: **AUQ-679**
- Branch: **AUQ-679-enhance-blip-algorithm-to-buyers-chosen-categories**
- Documentation: This file

---

**Author:** AI Assistant  
**Reviewer:** [Pending]  
**Status:** ✅ Implemented and Documented

