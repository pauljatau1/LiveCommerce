const request = require('supertest');
const { isAllowedOrigin } = require('@/config/cors');
const { app } = require('@/app');

describe('config/cors', () => {
  const saved = { ...process.env };
  afterEach(() => {
    process.env = { ...saved };
  });

  it('allows listed origins, ignoring a trailing slash', () => {
    process.env.ALLOWED_ORIGINS = 'https://shop.example.com/, https://studio.example.com';
    expect(isAllowedOrigin('https://shop.example.com')).toBe(true);
    expect(isAllowedOrigin('https://studio.example.com/')).toBe(true);
    expect(isAllowedOrigin('https://evil.example.com')).toBe(false);
  });

  it('allows localhost only outside production', () => {
    process.env.ALLOWED_ORIGINS = '';
    process.env.NODE_ENV = 'development';
    expect(isAllowedOrigin('http://localhost:5173')).toBe(true);
    process.env.NODE_ENV = 'production';
    expect(isAllowedOrigin('http://localhost:5173')).toBe(false);
  });

  it('does not restrict requests without an Origin header', () => {
    process.env.NODE_ENV = 'production';
    process.env.ALLOWED_ORIGINS = '';
    expect(isAllowedOrigin(undefined)).toBe(true);
  });

  it('sends CORS headers to allowed sites only', async () => {
    process.env.NODE_ENV = 'production';
    process.env.ALLOWED_ORIGINS = 'https://shop.example.com';

    const allowed = await request(app).get('/health').set('Origin', 'https://shop.example.com');
    expect(allowed.headers['access-control-allow-origin']).toBe('https://shop.example.com');

    const blocked = await request(app).get('/health').set('Origin', 'https://evil.example.com');
    expect(blocked.headers['access-control-allow-origin']).toBeUndefined();

    const preflight = await request(app)
      .options('/api/streams')
      .set('Origin', 'https://evil.example.com')
      .set('Access-Control-Request-Method', 'POST');
    expect(preflight.headers['access-control-allow-origin']).toBeUndefined();
  });
});
