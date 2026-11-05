const request = require('supertest');

const loadApp = (extras) => {
  let app;
  jest.isolateModules(() => {
    process.env.EXTRA_FEATURES = extras;
    ({ app } = require('@/app'));
  });
  return app;
};

describe('optional features', () => {
  const saved = process.env.EXTRA_FEATURES;
  afterAll(() => {
    process.env.EXTRA_FEATURES = saved;
  });

  it('does not mount cut features by default', async () => {
    const app = loadApp('');
    for (const path of ['/api/coupons/seller', '/api/posts', '/api/v2/blips', '/api/v2/sellers/referral/overview', '/api/messages']) {
      const res = await request(app).get(path);
      expect([path, res.status]).toEqual([path, 404]);
    }
  });

  it('keeps the MVP routes mounted', async () => {
    const app = loadApp('');
    const res = await request(app).get('/api/public/categories');
    expect(res.status).not.toBe(404);
  });

  it('mounts a feature when listed in EXTRA_FEATURES', async () => {
    const app = loadApp('coupons');
    const res = await request(app).get('/api/coupons/seller');
    expect(res.status).not.toBe(404);
  });

  it('rejects unknown feature names', () => {
    const { isFeatureEnabled } = require('@/config/optionalFeatures');
    expect(() => isFeatureEnabled('nonsense')).toThrow(/Unknown optional feature/);
  });
});
