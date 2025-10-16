# Coupon Expiry & Product Discount Deactivation Fix

## Problem
When coupons expired based on their `endDate`, they were marked as "expired" but the associated products still showed `discount.isActive = true`. This caused confusion as expired coupons appeared to still have active discounts on products.

## Solution
Implemented a two-layered approach to ensure expired coupons automatically deactivate product discounts:

### 1. Hourly Cleanup (Existing - Enhanced)
**Location:** `src/models/Coupon.js` - `cleanupExpiredDiscounts()` function

**What it does:**
- Runs every hour automatically
- Finds coupons with `endDate <= now` and status 'active'
- Updates coupon status to 'expired'
- **NEW:** Now also updates all associated products to set `discount.isActive = false`
- Updates product variants and pricing discount info as well

**Technical implementation:**
```javascript
// Updates products to deactivate discounts
await Product.updateMany(
  {
    _id: { $in: productIds },
    'discount.couponName': coupon.name
  },
  {
    $set: {
      'discount.isActive': false,
      'pricing.discountInfo.isActive': false,
      'variants.$[].discount.isActive': false
    }
  }
);
```

### 2. Daily Comprehensive Cleanup (New)
**Location:** `src/config/agenda.js` - `daily_coupon_cleanup` job

**What it does:**
- Runs daily at 3:00 AM WAT (2:00 AM UTC)
- Performs a comprehensive scan of ALL expired coupons
- Catches any edge cases that might have been missed by the hourly cleanup
- Updates both coupons and products to ensure consistency

**Scheduled via:**
```javascript
await agenda.every('0 2 * * *', 'daily_coupon_cleanup');
```

## Changes Made

### File: `src/models/Coupon.js`
1. Enhanced `cleanupExpiredDiscounts()` function
2. Added comprehensive comments explaining the cleanup process
3. Added product discount deactivation logic
4. Improved logging to track what products are being updated

### File: `src/config/agenda.js`
1. Created new `daily_coupon_cleanup` agenda job
2. Scheduled the job to run daily at 3:00 AM WAT
3. Added detailed logging for monitoring and debugging

## Behavior

### Before
- Coupon expires → Coupon status = 'expired' ✓
- Product discount → Still shows `isActive: true` ❌

### After
- Coupon expires → Coupon status = 'expired' ✓
- Product discount → Automatically set to `isActive: false` ✓
- All variants → Also set to `isActive: false` ✓
- Pricing discount info → Also set to `isActive: false` ✓

## Testing

### Test the Hourly Cleanup
1. Create a coupon with an endDate set to 5 minutes from now
2. Wait for the coupon to expire
3. Wait up to 1 hour for the cleanup job to run (or restart the server to trigger initial cleanup)
4. Check the product's discount field - `isActive` should be false

### Test the Daily Cleanup
You can manually trigger the daily cleanup job for testing:

```javascript
// In a test script or using Postman/REST client
const agenda = require('./src/config/agenda').agenda;
await agenda.now('daily_coupon_cleanup');
```

### Verify in Database
```javascript
// Check expired coupons
db.coupons.find({ 
  endDate: { $lte: new Date() },
  status: 'active' 
})

// Check products with active discounts from expired coupons
db.products.find({
  'discount.isActive': true,
  'discount.endDate': { $lte: new Date() }
})
```

## Monitoring

Check server logs for these messages:
- Hourly: `"Deactivated discounts for X products from expired coupon: [name]"`
- Daily: `"Daily coupon cleanup completed: X coupons expired, Y products updated"`

## Edge Cases Handled

1. **Database disconnection**: Cleanup skips if database is not connected
2. **Batch processing**: Processes 100 coupons at a time to avoid memory issues
3. **Timeout protection**: 5-second timeout on cleanup queries
4. **Error isolation**: If one coupon fails, others continue processing
5. **Idempotency**: Running cleanup multiple times won't cause issues

## Performance Considerations

- Hourly cleanup: Processes max 100 expired coupons per run
- Daily cleanup: No limit, but runs during off-peak hours (3 AM)
- Uses bulk update operations for efficiency
- Proper indexing on `endDate` and `status` fields recommended

## Future Enhancements

Consider these for future improvements:
1. Add webhook/notification when coupons are auto-expired
2. Send email to sellers when their coupons expire
3. Create analytics report of expired coupons
4. Add a manual "force cleanup" endpoint for admins

## Notes

- The coupon status remains "expired" (not changed to "inactive") as it's semantically correct
- Products show discount as inactive, which is the expected behavior
- Both hourly and daily jobs work together - hourly for real-time, daily for comprehensive coverage
- No changes needed to existing API endpoints - this is automatic background processing

