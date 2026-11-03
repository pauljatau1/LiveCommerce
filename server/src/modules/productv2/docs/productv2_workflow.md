# ProductV2 Modular Architecture

## Overview
The ProductV2 module provides a comprehensive set of endpoints for managing and retrieving products with advanced search capabilities, personalization, and trending algorithms.

**Note on Route Design:** The module includes both `/` and `/all` routes for getting all products to prevent routing conflicts with the `/:id` parameter pattern. This ensures that requests to `/api/v2/products/all` are properly handled without ObjectId casting errors.

## API Endpoints

### GET `/api/v2/products/personalized`
Returns personalized products based on user preferences and engagement metrics.

**Authentication:** Optional (Enhanced experience for authenticated users)

**Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of products per page (default: 20)

**Algorithm & Logic:**
- **Authentication Check**: Authenticated users get enhanced personalization
- **Base Filtering**: Active, visible products with stock > 0, excluding offline auctions
- **Random Sampling**: Uses random skip for variety in results
- **Seller Diversity**: Prevents clustering from same seller using round-robin distribution
- **Shuffling**: Randomizes results for variety
- **Fallback Logic**: Handles edge cases when insufficient products are found
- **Population**: Includes seller details and review statistics

**Response:**
```json
{
  "products": [...],
  "currentPage": 1,
  "totalPages": 10,
  "totalProducts": 100,
  "hasMore": true,
  "isPersonalized": true
}
```

### GET `/api/v2/products`
Returns all products with filtering and pagination capabilities.

**Authentication:** Optional

**Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of products per page (default: 20)

**Algorithm & Logic:**
- **Base Filtering**: Active and visible products
- **Pagination**: Standard offset-based pagination
- **Population**: Includes seller details and review statistics
- **Statistics**: Adds average rating and review count to each product

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "pages": 5
  },
  "filters": {...}
}
```

### GET `/api/v2/products/all`
Alternative route for getting all products. This route is specifically designed to handle the `/all` path parameter without conflicting with the `/:id` route pattern.

**Authentication:** Optional

**Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of products per page (default: 20)

**Algorithm & Logic:**
- **Route Resolution**: Handles `/all` path without ObjectId casting errors
- **Base Filtering**: Active and visible products
- **Pagination**: Standard offset-based pagination
- **Population**: Includes seller details and review statistics
- **Statistics**: Adds average rating and review count to each product

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "pages": 5
  },
  "filters": {...}
}
```

### GET `/api/v2/products/search/deep`
Advanced search functionality with fuzzy matching and multiple filtering options.

**Authentication:** Optional

**Query Parameters:**
- `query` (optional): Search term for product name, description, category, etc.
- `minPrice` (optional): Minimum price filter
- `maxPrice` (optional): Maximum price filter
- `condition` (optional): Product condition filter
- `sortBy` (optional): Sort field (newest, oldest, price_asc, price_desc, popular, best_selling, rating)
- `order` (optional): Sort order (asc, desc)
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of products per page (default: 20)

**Algorithm & Logic:**
- **Fuzzy Search**: Uses Fuse.js for intelligent text matching
- **Term Expansion**: Automatically handles singular/plural forms
- **Multi-field Search**: Searches across name, description, category, subcategory, brand, tags, SKU
- **Scoring System**: Weighted scoring with category and subcategory boosts
- **Price Filtering**: Range-based price filtering
- **Condition Filtering**: Exact match condition filtering
- **Sorting Options**: Multiple sorting criteria with custom logic
- **Pagination**: Standard pagination with total count

**Response:**
```json
{
  "products": [...],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "pages": 3
  },
  "filters": {
    "query": "laptop",
    "priceRange": { "min": 100, "max": 1000 },
    "condition": "new",
    "sortBy": "price_asc",
    "order": "asc"
  }
}
```

### GET `/api/v2/products/just-arrived`
Returns recently added products with focus on new arrivals.

**Authentication:** Optional

**Algorithm & Logic:**
- **Recency Focus**: Prioritizes recently created products
- **Active Filtering**: Only includes active and visible products
- **Randomization**: Shuffles results for variety
- **Population**: Includes seller details and review statistics

**Response:**
```json
{
  "success": true,
  "data": [...]
}
```

### GET `/api/v2/products/trending`
Returns trending products based on engagement metrics and sales performance.

**Authentication:** Optional

**Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of products per page (default: 20)

**Algorithm & Logic:**
- **Engagement Filtering**: Products with >10 views or >0 orders
- **Fallback Strategy**: Falls back to all active products if no trending products found
- **Random Sampling**: Uses random skip for variety
- **Shuffling**: Randomizes results for variety
- **Population**: Includes seller details and review statistics

**Response:**
```json
{
  "success": true,
  "data": [...]
}
```

### GET `/api/v2/products/by-id/:id`
Returns a specific product by ID with formatted seller information.

**Authentication:** Optional

**Path Parameters:**
- `id` (required): Product ID

**Algorithm & Logic:**
- **ID Validation**: Validates product ID format
- **Population**: Includes detailed seller information
- **Error Handling**: Returns 404 for non-existent products
- **Formatting**: Formats seller data for consistent response

**Response:**
```json
{
  "product": {
    "_id": "product_id",
    "name": "Product Name",
    "price": 100,
    "seller": {
      "firstName": "John",
      "lastName": "Doe",
      "businessName": "Business Name",
      "storeName": "Store Name",
      "stats": {
        "averageRating": 4.5,
        "totalReviews": 100
      },
      "isVerified": true
    }
  }
}
```

### GET `/api/v2/products/:id`
Returns a product with aggregation and auction awareness.

**Authentication:** Optional

**Path Parameters:**
- `id` (required): Product ID

**Algorithm & Logic:**
- **Aggregation Pipeline**: Uses MongoDB aggregation for complex queries
- **Auction Awareness**: Handles auction-specific product data
- **Population**: Includes seller and category information
- **Error Handling**: Returns 404 for non-existent products

**Response:**
```json
{
  "product": {
    "_id": "product_id",
    "name": "Product Name",
    "price": 100,
    "category": "Electronics",
    "seller": {...},
    "stats": {
      "averageRating": 4.5,
      "totalReviews": 100,
      "soldCount": 50
    }
  }
}
```

### POST `/api/v2/products`
Creates a new product (authenticated endpoint).

**Authentication:** Required (Seller role)

**Request Body:**
```json
{
  "name": "Product Name",
  "description": "Product Description",
  "price": 100,
  "category": "Electronics",
  "subCategory": "Computers",
  "brand": "Brand Name",
  "condition": "new",
  "stock": 10,
  "images": ["image_url_1", "image_url_2"],
  "tags": ["tag1", "tag2"],
  "sku": "SKU123"
}
```

**Algorithm & Logic:**
- **Authentication**: Requires valid seller token
- **Validation**: Comprehensive input validation
- **Image Processing**: Handles image uploads and processing
- **Category Mapping**: Maps categories to proper hierarchy
- **Stock Management**: Initializes stock tracking
- **Analytics**: Initializes analytics tracking

**Response:**
```json
{
  "status": 201,
  "body": {
    "success": true,
    "message": "Product created successfully",
    "product": {
      "_id": "new_product_id",
      "name": "Product Name",
      "price": 100
    }
  }
}
```

## Common Algorithm Features

### Product Filtering
- **Status Filtering**: Only active and visible products
- **Stock Validation**: Products with available stock
- **Auction Exclusion**: Excludes offline auction products
- **Condition Filtering**: Supports new, used, refurbished conditions

### Search Algorithms
- **Fuzzy Matching**: Intelligent text matching with Fuse.js
- **Term Expansion**: Handles singular/plural variations
- **Multi-field Search**: Searches across multiple product fields
- **Scoring System**: Weighted scoring with category boosts
- **Price Range**: Flexible price range filtering

### Sorting Options
- **Price Sorting**: Ascending and descending price order
- **Date Sorting**: Newest and oldest creation dates
- **Popularity**: Based on view count
- **Best Selling**: Based on sold count
- **Rating**: Based on average rating

### Seller Diversity
- **Clustering Prevention**: Round-robin distribution through sellers
- **Randomization**: Shuffles results for variety
- **Population**: Includes comprehensive seller information
- **Verification Status**: Includes seller verification status

### Error Handling
- **404 Responses**: Proper handling for non-existent products
- **500 Responses**: Graceful error handling with meaningful messages
- **Validation Errors**: Comprehensive input validation
- **Authentication Errors**: Proper authentication checks

### Pagination
- **Offset-based**: Standard skip/limit pagination
- **Total Count**: Includes total count for pagination info
- **Page Calculation**: Calculates total pages
- **Has More**: Indicates if more results are available

### Analytics Integration
- **View Tracking**: Tracks product views
- **Order Tracking**: Tracks product orders
- **Rating System**: Integrates with review system
- **Performance Metrics**: Trending based on engagement

## Data Population

### Seller Information
- **Basic Details**: Name, business name, store name
- **Contact Info**: Email, phone number
- **Addresses**: Business and warehouse addresses
- **Stats**: Average rating, total reviews
- **Verification**: Verification status
- **Features**: Store pickup availability

### Product Statistics
- **Rating**: Average rating from reviews
- **Review Count**: Total number of reviews
- **Sales Count**: Total number of sales
- **View Count**: Total number of views
- **Order Count**: Total number of orders

### Category Information
- **Hierarchy**: Category, subcategory, sub-subcategory
- **Mapping**: Proper category mapping
- **Validation**: Category existence validation
