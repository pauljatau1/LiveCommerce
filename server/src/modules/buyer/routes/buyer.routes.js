const express = require('express');
const router = express.Router();

// Split route groups
const walletRoutes = require('./buyer.wallet.routes');
const authRoutes = require('./buyer.auth.routes');
const profileRoutes = require('./buyer.profile.routes');
const addressesRoutes = require('./buyer.addresses.routes');
const wishlistRoutes = require('./buyer.wishlist.routes');
const followRoutes = require('./buyer.follow.routes');
const sellerRoutes = require('./buyer.seller.routes');
const notificationsRoutes = require('./buyer.notifications.routes');
const categoriesRoutes = require('./buyer.categories.routes');
const ordersRoutes = require('./buyer.orders.routes');
const identityRoutes = require('./buyer.identity.routes');
const accountRoutes = require('./buyer.account.routes');
const publicRoutes = require('./buyer.public.routes');
const activityRoutes = require('./buyer.activity.routes');
const reportRoutes = require('./buyer.report.routes');
const analyticsRoutes = require('./buyer.analytics.routes');

// Mount Auth routes (moved to buyer.auth.routes.js)
router.use(authRoutes);
// Mount Profile routes (moved to buyer.profile.routes.js)
router.use(profileRoutes);
// Mount Addresses routes (moved to buyer.addresses.routes.js)
router.use(addressesRoutes);
// Mount Wishlist routes (moved to buyer.wishlist.routes.js)
router.use(wishlistRoutes);
// Mount Follow routes (moved to buyer.follow.routes.js)
router.use(followRoutes);
// Sellers discovery included in buyer.seller.routes.js
// Mount Seller profile and reviews routes (moved to buyer.seller.routes.js)
router.use(sellerRoutes);
// Mount Notifications routes
router.use(notificationsRoutes);
// Mount Categories routes
router.use(categoriesRoutes);
// Mount Orders and Analytics routes
router.use(ordersRoutes);
// Mount Identity verification and Phone OTP routes
router.use(identityRoutes);
// Mount Account deletion routes
router.use(accountRoutes);
// Mount Public profile routes
router.use(publicRoutes);
// Mount Activity routes
router.use(activityRoutes);
// Mount Report user routes
router.use(reportRoutes);
// Mount buyer wallet routes
router.use(walletRoutes);
// Mount buyer analytics routes
router.use(analyticsRoutes);

module.exports = router;