# BlipsV2 Modular Architecture

## Overview
The BlipsV2 module provides a comprehensive set of endpoints for fetching blips with different algorithms and logic for various use cases.

## API Endpoints

### Saved Blips (Favorites)

The following endpoints allow buyers to save blips (favorite), check saved status, unsave, and retrieve their saved blips. All endpoints require authentication with Buyer role.

#### POST `/api/v2/blips/:blipId/save`
Saves a blip for the authenticated buyer. You can save a blip whether it is processed or not. Idempotent: saving an already-saved blip returns a success message with `created: false`.

Authentication: Required (Buyer)

Path Parameters:
- `blipId` (required): The ID of the blip to save

Response:
```json
{
  "status": true,
  "message": "Blip saved successfully",
  "created": true
}
```

Possible variations:
```json
{
  "status": true,
  "message": "Blip already saved",
  "created": false
}
```

Errors:
```json
{
  "status": false,
  "message": "Unauthorized"
}
```

#### GET `/api/v2/blips/:blipId/saved`
Checks whether the authenticated buyer has saved the specified blip.

Authentication: Required (Buyer)

Path Parameters:
- `blipId` (required): The ID of the blip to check

Response:
```json
{
  "status": true,
  "isSaved": true
}
```

#### DELETE `/api/v2/blips/:blipId/save`
Unsaves the specified blip for the authenticated buyer. Idempotent: unsaving a non-saved blip returns success with `removed: false`.

Authentication: Required (Buyer)

Path Parameters:
- `blipId` (required): The ID of the blip to unsave

Response:
```json
{
  "status": true,
  "message": "Blip unsaved successfully",
  "removed": true
}
```

Possible variations:
```json
{
  "status": true,
  "message": "Blip was not saved",
  "removed": false
}
```

#### GET `/api/v2/blips/saved`
Returns the authenticated buyer's saved blips with pagination. The blip items are shaped identically to other blips endpoints (e.g., personalized/suggested/related), using the same transformation helper.

Authentication: Required (Buyer)

Query Parameters:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Number of blips per page (default: 20)

Response:
```json
{
  "blips": [
    {
      "discount": { "isActive": false, "type": "percentage", "value": 0, "discountedPrice": 12999 },
      "_id": "<productId>",
      "blipId": "<blipId>",
      "blipUrl": "https://...",
      "thumbnail": "https://...",
      "processed": true,
      "productId": "<productId>",
      "productName": "Product Name",
      "price": 12999,
      "stock": 12,
      "status": "active",
      "auctionInfo": null,
      "images": [{ "url": "https://..." }],
      "blipEngagement": { "likesCount": 10, "commentsCount": 2, "viewCount": 250, "isLiked": false },
      "averageRating": 4.5,
      "reviewCount": 23,
      "createdAt": "2025-03-25T10:00:00.000Z",
      "seller": {
        "_id": "<sellerId>",
        "firstName": "Jane",
        "lastName": "Doe",
        "storeName": "Jane's Store",
        "storeAvatar": "https://...",
        "aboutStore": "...",
        "storeRating": 4.8,
        "totalStoreReviews": 120,
        "isFollowing": false,
        "isFeatured": false
      }
    }
  ],
  "currentPage": 1,
  "totalPages": 5,
  "totalBlips": 100
}
```

### GET `/api/v2/blips/personalized`
Returns personalized blips based on user preferences and engagement metrics.

**Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of blips per page (default: 10)
- `sessionId` (optional): Session ID for maintaining seen blips

**Algorithm & Logic:**
- **Session Management**: Uses in-memory session storage to prevent duplicate blips across pagination
- **Engagement Scoring**: Views (1pt) + Likes (5pts) + Comments (10pts)
- **Recency Boost**: Recent content gets priority scoring
- **Seller Diversity**: Prevents clustering from same seller using round-robin distribution
- **Fallback Logic**: Multiple fallback levels ensure results are always returned
- **Categorization**: Followed sellers, high engagement, undiscovered, random

**Response:**
```json
{
  "blips": [...],
  "currentPage": 1,
  "totalPages": 10,
  "totalBlips": 100,
  "sessionId": "user_123_blips"
}
```

### GET `/api/v2/blips/suggested`
Returns suggested blips based on user preferences, followed sellers, and engagement metrics.

**Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of blips per page (default: 20)

**Algorithm & Logic:**
- **User Preferences**: Considers buyer's selected categories and followed sellers
- **Engagement Scoring**: Views (1pt) + Likes (5pts) + Comments (10pts)
- **Recency Factor**: Recent content gets higher priority
- **Complex Distribution**: Advanced algorithm to balance different content types
- **Seller Clustering Prevention**: Ensures variety across sellers
- **Category Prioritization**: New content in buyer categories, followed sellers, high engagement, undiscovered, random

**Response:**
```json
{
  "blips": [...],
  "isPersonalized": true,
  "currentPage": 1,
  "totalPages": 10,
  "totalBlips": 100
}
```

### GET `/api/v2/blips/related/:blipId`
Returns related blips based on a specific blip's category. If not enough related blips are found, it falls back to random blips.

**Path Parameters:**
- `blipId` (required): The ID of the reference blip

**Query Parameters:**
- `limit` (optional): Number of blips per page (default: 10)
- `page` (optional): Page number for pagination (default: 1)

**Algorithm & Logic:**
- **Category Matching**: Finds blips from the same category as the reference blip
- **Fallback Strategy**: If insufficient related content, fetches random blips
- **Engagement Consideration**: Includes likes and following status for personalized experience
- **Seller Following**: Checks if buyer follows the seller for each blip
- **Shuffling**: Randomizes results for variety

**Response:**
```json
{
  "success": true,
  "blips": [...],
  "currentPage": 1,
  "totalPages": 5,
  "totalBlips": 50,
  "hasMore": true
}
```

### GET `/api/v2/blips/new`
Returns new blips with focus on recent content and low-view blips.

**Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of blips per page (default: 10)
- `sessionId` (optional): Session ID for maintaining seen blips

**Algorithm & Logic:**
- **Recency Focus**: Prioritizes blips from last 3 days with 200 bonus points
- **Low-View Priority**: Blips with <50 views get 100 bonus points, <100 views get 50 points
- **Strict Capping**: Only considers the most recent 35 blips, then randomizes within that subset
- **Enhanced Scoring**: Low-view bonus + recency bonus + engagement score
- **Categorization**: Very recent low-view, recent low-view, very recent, recent, low-view, followed sellers, high engagement, random
- **Fallback Reliability**: Multiple fallback levels ensure results

**Response:**
```json
{
  "blips": [...],
  "currentPage": 1,
  "totalPages": 5,
  "totalBlips": 35,
  "sessionId": "user_123_blips"
}
```

### GET `/api/v2/blips/trending`
Returns trending blips based on high engagement metrics including views, likes, comments, and product sales.

**Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of blips per page (default: 10)
- `sessionId` (optional): Session ID for maintaining seen blips

**Algorithm & Logic:**
- **Comprehensive Scoring**: Views (1pt) + Likes (5pts) + Comments (10pts) + Sales (50pts per sale)
- **Time-Based Factors**: Very recent (3 days) = 200pts, Recent (7 days) = 100pts, Within 30 days = 50pts
- **Advanced Metrics**: 
  - Velocity Score: Engagement per day × 10
  - Viral Coefficient: (Likes + Comments) / Views × 1000
- **Categorization**: Viral (>0.1 viral coefficient), high engagement (>200), high velocity (>50), high sales (>5), trending (>500), popular (>1000 views), random
- **Top 100 Selection**: Limits to top 100 trending blips before distribution

**Response:**
```json
{
  "blips": [...],
  "currentPage": 1,
  "totalPages": 10,
  "totalBlips": 100,
  "sessionId": "user_123_blips"
}
```

### GET `/api/v2/blips/following`
Returns blips only from sellers that the authenticated buyer follows.

**Authentication:** Required (Buyer role)

**Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of blips per page (default: 10)
- `sessionId` (optional): Session ID for maintaining seen blips

**Algorithm & Logic:**
- **Authentication Required**: Only authenticated buyers can access
- **Followed Sellers Filter**: Only includes blips from sellers in buyer's following list
- **Empty Array Logic**: Returns empty array if no followed sellers or no blips from followed sellers
- **Engagement Scoring**: Views (1pt) + Likes (5pts) + Comments (10pts)
- **Recency Boost**: 100 points for content from last 7 days
- **Categorization**: Recent high engagement (<7 days + >100 engagement), high engagement (>100), recent (<7 days), followed sellers, random
- **Seller Diversity**: Prevents clustering from same followed seller

**Response:**
```json
{
  "blips": [...],
  "currentPage": 1,
  "totalPages": 5,
  "totalBlips": 50,
  "sessionId": "user_123_blips",
  "followedSellersCount": 8,
  "message": "No blips from followed sellers"
}
```

**Error Responses:**
```json
{
  "status": false,
  "message": "Authentication required for following blips",
  "error": "Authentication required"
}
```

## Common Algorithm Features

### Session Management
- **In-Memory Storage**: Uses Map to store seen blip IDs per session
- **Session Cleanup**: Automatic cleanup of expired sessions (1 minute timeout)
- **Session Limits**: Maximum 1000 sessions, 100 seen blips per session
- **Duplicate Prevention**: Ensures no duplicate blips across pagination

### Engagement Scoring
- **Base Formula**: Views (1pt) + Likes (5pts) + Comments (10pts)
- **Sales Integration**: Product sales add 50 points per sale
- **Recency Bonuses**: Time-based scoring for recent content
- **Velocity Calculation**: Engagement per day for trending content

### Distribution Algorithms
- **Seller Diversity**: Round-robin through sellers to prevent clustering
- **Category Balancing**: Distributes content across different categories
- **Randomization**: Adds random factors for variety
- **Product Deduplication**: Ensures no duplicate products in results

### Fallback Strategies
- **Multiple Levels**: Primary → Fallback → Basic fallback
- **Relaxed Filtering**: Gradually relaxes constraints if no results
- **Error Handling**: Graceful degradation on database errors
- **Empty Results**: Proper handling when no content is available

### GET `/api/v2/blips/top`
Returns a non-scrollable list of recent, high-engagement blips. This endpoint does not use session tracking or de-duplication.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Number of blips per page (default: 12)

**Algorithm & Logic:**
- **Engagement + Recency Scoring**: Views (1pt) + Likes (6pts) + Comments (12pts) + recency boost (≤14 days)
- **Personalization Boosts (if logged in)**: Preferred categories and followed sellers receive additional score
- **Variety**: Random tie-breaker within a top pool to avoid static ordering
- **No Session**: Designed for simple list usage, not infinite scroll
- **Fallbacks**: Relaxes to active/pending, then basic sort if needed

**Response:**
```json
{
  "blips": [...],
  "currentPage": 1,
  "totalPages": 3,
  "totalBlips": 36
}
```

### GET `/api/v2/blips/by-category`
Returns blips for a provided category or subCategory (case-insensitive), ranked by engagement and recency.

**Query Parameters:**
- `category` (required): Category or subCategory name
- `page` (optional): Page number (default: 1)
- `limit` (optional): Number of blips per page (default: 12)

**Algorithm & Logic:**
- **Category Match**: Matches either `category` or `subCategory`
- **Engagement + Recency**: Ranks by engagement score and recency with randomization for variety
- **Fallbacks**: Relaxes product status constraints if needed

**Response:**
```json
{
  "blips": [...],
  "currentPage": 1,
  "totalPages": 5,
  "totalBlips": 60
}
```

### GET `/api/v2/blips/by-random-category`
Returns blips from a randomly selected category that contains at least 6 blips. If the user is logged in, it first tries to pick from the buyer's selected categories.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Number of blips per page (default: 12)

**Algorithm & Logic:**
- **Category Selection**: Randomly selects a category where blip count ≥ 6
- **Preference Bias**: Prefers categories in the buyer's `selectedCategories` when available
- **Engagement + Recency**: Ranks blips within the chosen category
- **Fallbacks**: Falls back to global active/pending pool to find a qualifying category

**Response:**
```json
{
  "blips": [...],
  "selectedCategory": "Electronics",
  "currentPage": 1,
  "totalPages": 4,
  "totalBlips": 48
}
```
