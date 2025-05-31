# Facebook Analytics Integration Usage Guide

This guide shows how to use the Facebook analytics integration in your Auqli app.

## Overview

The Facebook analytics integration provides:
1. **Standalone Facebook tracking** via `utils/facebook-analytics.ts`
2. **Global analytics integration** where Facebook events are automatically sent alongside Mixpanel and Customer.io events
3. **E-commerce optimized events** following Facebook's best practices

## Quick Start

### 1. Using Global Analytics (Recommended)

The global `trackEvent` function now automatically sends events to Facebook, Mixpanel, and Customer.io:

```typescript
import { trackEvent, identifyUser } from '@/utils/analytics';

// This will automatically track to Facebook, Mixpanel, and Customer.io
trackEvent('buyer_login', {
  userId: 'user123',
  email: 'user@example.com',
  loginMethod: 'email',
  success: true
});

// User identification also sets Facebook user data
identifyUser('user123', {
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  country: 'US'
});
```

### 2. Using Standalone Facebook Analytics

For Facebook-specific events or more control:

```typescript
import { 
  trackFacebookEvent, 
  trackFacebookPurchase,
  trackFacebookViewContent,
  trackFacebookAddToCart,
  FacebookEvents 
} from '@/utils/facebook-analytics';

// Basic event tracking
trackFacebookEvent('custom_event', undefined, {
  category: 'user_action',
  label: 'button_click'
});

// E-commerce events
trackFacebookPurchase(29.99, 'USD', {
  fb_content_id: 'product_123',
  fb_content_type: 'product'
});

trackFacebookViewContent('product_123', 'product', 'USD', 29.99, 'Awesome Product');

trackFacebookAddToCart('product_123', 'product', 'USD', 29.99);
```

## E-commerce Event Examples

### Product Viewing
```typescript
// When user views a product
trackEvent('product_viewed', {
  contentId: 'product_123',
  contentType: 'product',
  currency: 'USD',
  value: 29.99,
  productName: 'Awesome Product',
  category: 'Electronics'
});
```

### Add to Cart
```typescript
// When user adds item to cart
trackEvent('add_to_cart', {
  contentId: 'product_123',
  contentType: 'product', 
  currency: 'USD',
  value: 29.99,
  quantity: 1
});
```

### Purchase Completion
```typescript
// When user completes purchase
trackEvent('purchase', {
  currency: 'USD',
  value: 129.99,
  numItems: 3,
  orderId: 'order_456',
  products: [
    { id: 'product_123', price: 29.99 },
    { id: 'product_456', price: 49.99 },
    { id: 'product_789', price: 50.01 }
  ]
});
```

### Search Events
```typescript
// When user searches
trackEvent('search', {
  searchString: 'nike shoes',
  contentType: 'product',
  success: true,
  resultsCount: 24
});
```

## Login Integration Example

Update your login component to use Facebook tracking:

```typescript
// In your login component
import { identifyUser, trackEvent } from '@/utils/analytics';

const onLoginSuccess = (result: any) => {
  // Identify user (automatically sets up Facebook, Mixpanel, Customer.io)
  identifyUser(result?.user?._id, {
    email: result?.user?.email,
    firstName: result?.user?.firstName,
    lastName: result?.user?.lastName,
    username: result?.user?.username,
    phoneNumber: result?.user?.phoneNumber,
    country: result?.user?.country
  });
  
  // Track login event (goes to all platforms)
  trackEvent('buyer_login', {
    userId: result?.user?._id,
    email: result?.user?.email,
    loginMethod: 'email',
    success: true,
    userType: 'buyer'
  });
};
```

## Facebook-Specific Features

### User Data for Advanced Matching
```typescript
import { setFacebookUserData } from '@/utils/facebook-analytics';

// Set user data for Facebook's advanced matching
setFacebookUserData({
  em: 'user@example.com', // email
  ph: '+1234567890',      // phone
  fn: 'john',             // first name
  ln: 'doe',              // last name
  country: 'us',          // country
  ct: 'menlo park',       // city
  st: 'ca',               // state
  zp: '94025'             // zip code
});
```

### Standard Facebook Events
```typescript
import { FacebookEvents } from '@/utils/facebook-analytics';

// Use predefined event names
trackEvent(FacebookEvents.VIEW_CONTENT, {
  contentId: 'product_123',
  contentType: 'product'
});

trackEvent(FacebookEvents.ADD_TO_CART, {
  contentId: 'product_123',
  value: 29.99,
  currency: 'USD'
});
```

## Automatic Property Mapping

The global analytics automatically maps common properties to Facebook format:

| Your Property | Facebook Property |
|--------------|------------------|
| `contentId` | `fb_content_id` |
| `contentType` | `fb_content_type` |
| `currency` | `fb_currency` |
| `searchString` | `fb_search_string` |
| `success` | `fb_success` |
| `numItems` | `fb_num_items` |

## Error Handling

All Facebook tracking is wrapped in try-catch blocks, so failures won't break your app:

```typescript
// This will log errors but won't crash your app
trackEvent('some_event', { data: 'value' });
```

## Testing

To verify Facebook events are working:

1. **Development Testing**: Check console logs for Facebook event confirmations
2. **Facebook Events Manager**: Events should appear in your Facebook app's Events Manager
3. **Real Device Testing**: Facebook events work best on real devices with the Facebook app installed

## Best Practices

1. **Use Global Analytics**: Prefer `trackEvent` from `utils/analytics.ts` for consistent cross-platform tracking
2. **Meaningful Event Names**: Use descriptive event names that match your business logic
3. **Consistent Properties**: Use consistent property names across events
4. **Value Tracking**: Include monetary values where applicable for Facebook optimization
5. **User Identification**: Always call `identifyUser` after login for proper user matching

## Migration from Existing Code

If you have existing `trackEvent` calls, they'll automatically start sending to Facebook with no code changes needed!

```typescript
// This existing code now automatically tracks to Facebook too
trackEvent('buyer_login', {
  userId: user.id,
  email: user.email
});
``` 