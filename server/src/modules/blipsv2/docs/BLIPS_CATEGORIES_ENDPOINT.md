# Blips Categories Endpoint Documentation

## Overview
The `/api/v2/blips/categories` endpoint provides category statistics for blips, with different behavior for authenticated and non-authenticated users.

## Endpoint Details

### URL
```
GET /api/v2/blips/categories
```

### Authentication
- **Optional**: Uses `optionalAuthMiddleware`
- **Authenticated users**: Get personalized categories based on their selected preferences
- **Non-authenticated users**: Get popular categories with high engagement

## Response Format

### Success Response (200 OK)
```json
{
  "status": true,
  "categories": [
    {
      "name": "Electronics",
      "totalBlips": 45,
      "totalProducts": 23,
      "totalViews": 1250,
      "totalLikes": 89,
      "totalComments": 34,
      "avgEngagement": 12.5
    }
  ],
  "totalCategories": 5,
  "isPersonalized": true,
  "message": "Categories based on your preferences"
}
```

### Error Response (500 Internal Server Error)
```json
{
  "status": false,
  "message": "Failed to fetch blips categories",
  "error": "Error message details"
}
```

## Category Statistics Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | String | Category name |
| `totalBlips` | Number | Total number of processed blips in this category |
| `totalProducts` | Number | Total number of products with blips in this category |
| `totalViews` | Number | Sum of all view counts for blips in this category |
| `totalLikes` | Number | Sum of all like counts for blips in this category |
| `totalComments` | Number | Sum of all comment counts for blips in this category |
| `avgEngagement` | Number | Average engagement score (views + 5×likes + 10×comments) |

## Behavior by User Type

### Authenticated Users
- Returns categories based on their `selectedCategories` from their buyer profile
- If no selected categories found, falls back to popular categories
- `isPersonalized: true`
- `message: "Categories based on your preferences"`

### Non-Authenticated Users
- Returns top 10 popular categories with highest blip counts and engagement
- Only includes categories with at least 3 blips
- Sorted by total blips and average engagement
- `isPersonalized: false`
- `message: "Popular categories with high engagement"`

## Algorithm Details

### For Authenticated Users
1. Fetch buyer's `selectedCategories` from database
2. Extract category names using `CategoryHelper.extractCategoryNames()`
3. Get statistics for each selected category
4. If no categories found, fallback to popular categories

### For Non-Authenticated Users
1. Aggregate all products with processed blips
2. Group by category and calculate statistics
3. Filter categories with minimum 3 blips
4. Sort by total blips and engagement
5. Limit to top 10 categories

## Database Queries

The service uses MongoDB aggregation pipelines to:
- Match products with processed blips
- Exclude draft and ended auction products
- Calculate engagement metrics
- Group by category
- Sort and limit results

## Error Handling

- Service errors are caught and logged
- Authenticated users fallback to popular categories on error
- Non-authenticated users return error response
- All errors include detailed logging for debugging

## Usage Examples

### Get Categories (Non-authenticated)
```bash
curl -X GET "http://localhost:3000/api/v2/blips/categories" \
  -H "Content-Type: application/json"
```

### Get Categories (Authenticated)
```bash
curl -X GET "http://localhost:3000/api/v2/blips/categories" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Integration Notes

- Uses existing `ProductRepository` for database operations
- Leverages `CategoryHelper` for category name extraction
- Follows the same error handling patterns as other blips endpoints
- Compatible with existing authentication middleware
