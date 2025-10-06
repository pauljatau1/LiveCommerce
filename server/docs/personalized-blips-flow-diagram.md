# Personalized Blips - Flow Diagram

## Algorithm Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    GET /api/blips/personalized               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │   Is User Authenticated?        │
        │   (req.user && role=Buyer)     │
        └────────┬───────────────┬────────┘
                 │               │
            YES  │               │  NO
                 │               │
                 ▼               ▼
    ┌────────────────────┐   ┌──────────────────────┐
    │ Fetch Buyer Data   │   │ Build Random Match   │
    │ + selectedCategories│   │ Stage (no filters)   │
    └────────┬───────────┘   └──────────┬───────────┘
             │                           │
             ▼                           │
    ┌────────────────────┐              │
    │ Extract Categories │              │
    │ & Subcategories    │              │
    └────────┬───────────┘              │
             │                           │
             ▼                           │
    ┌────────────────────┐              │
    │ Has Categories?    │              │
    └────┬──────────┬────┘              │
         │          │                    │
    YES  │          │  NO                │
         │          │                    │
         ▼          ▼                    │
┌────────────┐  ┌─────────────┐         │
│ Build      │  │ Build Random│         │
│ Category-  │  │ Match Stage │         │
│ Filtered   │  │ (no filters)│         │
│ Match      │  │             │         │
│ Stage      │  └─────┬───────┘         │
└─────┬──────┘        │                 │
      │               │                 │
      └───────┬───────┴─────────────────┘
              │
              ▼
     ┌────────────────────────┐
     │ Execute MongoDB        │
     │ Aggregation Pipeline   │
     │                        │
     │ 1. Match Stage         │
     │ 2. Unwind Blips        │
     │ 3. Filter Processed    │
     │ 4. Exclude Seen IDs    │
     │ 5. Calculate Scores    │
     │ 6. Random Sort         │
     │ 7. Limit Results       │
     └────────┬───────────────┘
              │
              ▼
     ┌────────────────────────┐
     │ Results Found?         │
     └────┬──────────────┬────┘
          │              │
     YES  │              │  NO
          │              │
          ▼              ▼
   ┌──────────────┐  ┌────────────────────┐
   │ Has Personali│  │ Execute Fallback   │
   │ zed Categories│  │ Pipeline           │
   │ & Results < 30%│ │ (simpler criteria) │
   │ of Pool Size? │  └────────┬───────────┘
   └────┬─────┬───┘           │
        │     │                │
   YES  │     │  NO            │
        │     │                │
        ▼     │                │
   ┌────────────────────┐     │
   │ HYBRID FALLBACK:   │     │
   │                    │     │
   │ 1. Build Query     │     │
   │    EXCLUDING buyer's│    │
   │    categories      │     │
   │                    │     │
   │ 2. Fetch Diverse   │     │
   │    Blips from OTHER│     │
   │    categories      │     │
   │                    │     │
   │ 3. Merge Results:  │     │
   │    [Personalized   │     │
   │     First] +       │     │
   │    [Diverse After] │     │
   └────────┬───────────┘     │
            │                 │
            └────┬────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │ Populate Seller Info   │
        └────────┬───────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │ Transform to Blips     │
        │ Format                 │
        └────────┬───────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │ Categorize Blips:      │
        │ - Followed Sellers     │
        │ - High Engagement      │
        │ - Undiscovered         │
        │ - Random               │
        └────────┬───────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │ Shuffle Categories     │
        └────────┬───────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │ Create Balanced        │
        │ Distribution           │
        │ (round-robin sellers)  │
        └────────┬───────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │ Update Session with    │
        │ Seen Blip IDs          │
        └────────┬───────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │ Return Response:       │
        │ - blips                │
        │ - currentPage          │
        │ - totalPages           │
        │ - totalBlips           │
        │ - sessionId            │
        └────────────────────────┘
```

---

## Category Matching Logic

### For Authenticated Users with Selected Categories

```
Buyer's Selected Categories:
┌──────────────────────────────┐
│ Fashion                       │
│  ├─ Shoes                     │
│  └─ Clothing                  │
│                               │
│ Electronics                   │
│  ├─ Smartphones               │
│  └─ Laptops                   │
└──────────────────────────────┘
                │
                ▼
        Extract Names
                │
                ▼
┌──────────────────────────────┐
│ categoryNames:                │
│ ["Fashion", "Electronics"]    │
│                               │
│ subCategoryNames:             │
│ ["Shoes", "Clothing",         │
│  "Smartphones", "Laptops"]    │
└──────────┬───────────────────┘
           │
           ▼
    MongoDB Query
           │
           ▼
┌──────────────────────────────┐
│ Match Products Where:         │
│                               │
│ (category IN ["Fashion",      │
│               "Electronics"]) │
│          OR                   │
│ (subCategory IN ["Shoes",     │
│                  "Clothing",  │
│                  "Smartphones",│
│                  "Laptops"])  │
└───────────────────────────────┘
```

### For Non-Authenticated or Users Without Categories

```
┌──────────────────────────────┐
│ No Category Filter            │
└──────────┬───────────────────┘
           │
           ▼
    MongoDB Query
           │
           ▼
┌──────────────────────────────┐
│ Match ALL Products:           │
│                               │
│ - Has blips                   │
│ - Status: active              │
│ - Blips processed: true       │
│                               │
│ (Random distribution)         │
└───────────────────────────────┘
```

---

## Session Management

```
┌─────────────────────────────────────────────────────┐
│                   Session Flow                       │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
    ┌──────────────────────────┐
    │ Request Received         │
    │ Page: 1, Limit: 10       │
    └──────────┬───────────────┘
               │
               ▼
    ┌──────────────────────────┐
    │ Generate/Get Session ID  │
    │ (from header or create)  │
    └──────────┬───────────────┘
               │
               ▼
    ┌──────────────────────────┐
    │ Retrieve Seen Blip IDs   │
    │ from Session Storage     │
    └──────────┬───────────────┘
               │
               ▼
    ┌──────────────────────────┐
    │ Query for NEW Blips      │
    │ Exclude: seenBlipIds     │
    │ Category Filter: Applied │
    └──────────┬───────────────┘
               │
               ▼
    ┌──────────────────────────┐
    │ Return 10 Blips          │
    │ IDs: [B1, B2, ..., B10]  │
    └──────────┬───────────────┘
               │
               ▼
    ┌──────────────────────────┐
    │ Add IDs to Session       │
    │ seenBlipIds += [B1..B10] │
    └──────────┬───────────────┘
               │
               ▼
    ┌──────────────────────────┐
    │ Next Request (Page 2)    │
    │ Excludes: [B1..B10]      │
    └──────────────────────────┘
```

---

## Code Structure

```
src/modules/blipsv2/
│
├── controllers/
│   └── blips.controller.js
│       └── getPersonalizedBlips()
│           ├── Calls service.execute()
│           └── Returns JSON response
│
├── services/
│   └── getPersonalizedBlips.service.js
│       └── execute(req)
│           ├── Extract user from req
│           ├── Fetch buyer + categories  ←── ENHANCED
│           ├── Extract category names    ←── NEW
│           ├── Build match stages        ←── ENHANCED
│           ├── Execute pipelines
│           ├── Transform results
│           └── Return formatted blips
│
├── repositories/
│   └── product.repository.js
│       ├── findBuyerByIdWithCategories() ←── USED
│       ├── aggregateProducts()
│       └── populateSellerInfo()
│
└── helpers/
    ├── pipeline.helper.js               ←── ENHANCED
    │   ├── buildPrimaryMatchStage()     ←── UPDATED
    │   │   └── Now accepts categories
    │   └── buildFallbackMatchStage()    ←── UPDATED
    │       └── Now accepts categories
    │
    ├── session.helper.js
    │   └── Manages seen blips
    │
    └── transformation.helper.js
        └── Formats blip responses
```

---

## Request/Response Examples

### Example 1: Authenticated User with Categories

**Request:**
```http
GET /api/blips/personalized?page=1&limit=10
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Buyer Data:**
```json
{
  "_id": "60a1b2c3d4e5f6g7h8i9j0k1",
  "selectedCategories": [
    {
      "name": "Fashion",
      "subCategories": [
        { "name": "Shoes" },
        { "name": "Clothing" }
      ]
    }
  ]
}
```

**Response:**
```json
{
  "blips": [
    {
      "blipId": "blip123",
      "productName": "Nike Air Max",
      "category": "Fashion",
      "subCategory": "Shoes",
      "price": 15000,
      "seller": { ... },
      ...
    },
    ...
  ],
  "currentPage": 1,
  "totalPages": 15,
  "totalBlips": 150,
  "sessionId": "uuid-v4-session-id"
}
```

**Logs:**
```
🔍 [BLIPS DEBUG] Session ID: abc-123, Page: 1, Limit: 10
🎯 [BLIPS DEBUG] Buyer 60a1b2c3d4e5f6g7h8i9j0k1 has selected categories: Fashion
🎯 [BLIPS DEBUG] Subcategories: Shoes, Clothing
📊 [BLIPS DEBUG] Primary pipeline returned: 35 products
📤 [BLIPS DEBUG] Returning 10 blips for page 1
```

---

### Example 2: Non-Authenticated User

**Request:**
```http
GET /api/blips/personalized?page=1&limit=10
```

**Response:**
```json
{
  "blips": [
    {
      "blipId": "blip456",
      "productName": "Random Product",
      "category": "Electronics",
      "subCategory": "Laptops",
      "price": 250000,
      "seller": { ... },
      ...
    },
    ...
  ],
  "currentPage": 1,
  "totalPages": 50,
  "totalBlips": 500,
  "sessionId": "uuid-v4-session-id"
}
```

**Logs:**
```
🔍 [BLIPS DEBUG] Session ID: xyz-789, Page: 1, Limit: 10
👤 [BLIPS DEBUG] Non-authenticated user - showing random blips
📊 [BLIPS DEBUG] Primary pipeline returned: 120 products
📤 [BLIPS DEBUG] Returning 10 blips for page 1
```

---

---

## Intelligent Hybrid Fallback System

### The Supplementation Flow

```
┌─────────────────────────────────────────────────────────┐
│     Personalized Query Returns Limited Results         │
│     (e.g., Buyer selected Fashion, only 2 blips found) │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │ Check: Results < 30%       │
        │ of Pool Size?              │
        │ (e.g., 2 < 10 = YES)       │
        └────────┬───────────────────┘
                 │
            YES  │
                 ▼
        ┌────────────────────────────┐
        │ Trigger Hybrid Fallback    │
        │ "Need to supplement!"      │
        └────────┬───────────────────┘
                 │
                 ▼
        ┌────────────────────────────┐
        │ Build Supplementary Query: │
        │                            │
        │ EXCLUDE buyer's categories │
        │ (Fashion, Electronics)     │
        │                            │
        │ INCLUDE all others:        │
        │ Home, Beauty, Sports,      │
        │ Books, Toys, etc.          │
        └────────┬───────────────────┘
                 │
                 ▼
        ┌────────────────────────────┐
        │ Execute Supplementary      │
        │ Pipeline                   │
        │                            │
        │ Find 8-15 diverse blips    │
        │ from other categories      │
        └────────┬───────────────────┘
                 │
                 ▼
        ┌────────────────────────────┐
        │ Merge Results:             │
        │                            │
        │ [2 Fashion blips]          │
        │     +                      │
        │ [8 diverse blips]          │
        │     =                      │
        │ [10 total blips]           │
        └────────┬───────────────────┘
                 │
                 ▼
        ┌────────────────────────────┐
        │ Return Hybrid Feed:        │
        │                            │
        │ 1. Fashion blip 1 (♥)      │
        │ 2. Fashion blip 2 (♥)      │
        │ 3. Home blip              │
        │ 4. Beauty blip            │
        │ 5. Sports blip            │
        │ 6. Books blip             │
        │ 7. Toys blip              │
        │ 8. Electronics blip       │
        │ 9. Garden blip            │
        │ 10. Health blip           │
        │                            │
        │ (♥ = Personalized)         │
        └────────────────────────────┘
```

### Example: Limited Category Content

**Scenario:** Buyer selects "Fashion → Vintage Clothing"

**Step 1: Initial Query**
```javascript
// Query for Fashion/Vintage Clothing
category: "Fashion"
subCategory: "Vintage Clothing"

// Result: Only 2 blips found
```

**Step 2: Supplementation Check**
```javascript
results.length = 2
poolSize = 10
threshold = 10 * 0.3 = 3

2 < 3 ❌ (Insufficient!)
→ Trigger supplementation
```

**Step 3: Supplementary Query**
```javascript
// Query EXCLUDING Fashion
category: { $nin: ["Fashion"] }
subCategory: { $nin: ["Vintage Clothing"] }

// This returns blips from:
Electronics, Home, Beauty, Sports, Books, etc.

// Result: 15 diverse blips found
```

**Step 4: Merge**
```javascript
personalizedBlips = [
  { id: 1, category: "Fashion", name: "Vintage Dress" },
  { id: 2, category: "Fashion", name: "Retro Shoes" }
]

diverseBlips = [
  { id: 3, category: "Electronics", name: "Headphones" },
  { id: 4, category: "Home", name: "Lamp" },
  { id: 5, category: "Beauty", name: "Skincare" },
  { id: 6, category: "Sports", name: "Yoga Mat" },
  { id: 7, category: "Books", name: "Novel" },
  { id: 8, category: "Toys", name: "Board Game" },
  { id: 9, category: "Garden", name: "Plant Pot" },
  { id: 10, category: "Health", name: "Vitamins" }
]

finalFeed = [...personalizedBlips, ...diverseBlips]
// Total: 10 blips (2 personalized + 8 diverse)
```

---

## Benefits Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Authenticated Users** | Random blips only | Category-based personalized blips |
| **Non-authenticated Users** | Random blips | Random blips (unchanged) |
| **Limited Content** | Shows same 2-3 videos repeatedly | Supplements with diverse content |
| **Discovery** | Low relevance | High relevance + diversity |
| **Response Structure** | Same | Same (no breaking changes) |
| **Performance** | Good | Good (indexed category queries) |
| **Fallback** | Basic | Intelligent hybrid fallback |
| **User Experience** | Can feel stale | Always fresh and varied |

---

**Last Updated:** October 6, 2025  
**Version:** 2.0 (with Intelligent Hybrid Fallback)

