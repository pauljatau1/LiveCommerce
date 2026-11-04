// Features outside the live-auction MVP. Their routes are not mounted unless
// named in EXTRA_FEATURES (comma-separated), e.g. EXTRA_FEATURES=coupons,referrals.
// The code stays in place, so any of them can be switched back on later.

const OPTIONAL_FEATURES = {
  blips: 'Short-video feed',
  posts: 'Posts',
  messaging: 'Direct messages and conversations',
  coupons: 'Coupons',
  flashSales: 'Flash sales',
  campaigns: 'Email campaigns',
  referrals: 'Referral programme',
  returns: 'Returns',
  listings: 'User listings',
};

const enabledExtras = () =>
  new Set(
    (process.env.EXTRA_FEATURES || '')
      .split(',')
      .map((f) => f.trim())
      .filter(Boolean)
  );

const isFeatureEnabled = (name) => {
  if (!OPTIONAL_FEATURES[name]) throw new Error(`Unknown optional feature: ${name}`);
  return enabledExtras().has(name);
};

// Mount a router only when its feature is enabled
const mountOptional = (app, name, path, router) => {
  if (isFeatureEnabled(name)) app.use(path, router);
};

module.exports = { OPTIONAL_FEATURES, isFeatureEnabled, mountOptional };
